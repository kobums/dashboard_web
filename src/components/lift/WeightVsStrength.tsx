import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../lib/api'
import type { LiftExerciseDetail, LiftExerciseSummary } from '../../types'
import { kg, shortDate } from '../../lib/lift'
import { SkBlock } from '../common/Skeleton'

// 체중 vs 근력 — 감량기 핵심 지표: 체중이 빠지는 동안 주요 종목 e1RM 이 유지/상승하는가.
// 이중 Y축, 단일 액센트: 체중은 점선, e1RM 은 실선으로 구분.

const tooltipStyle = {
  borderRadius: 11,
  border: '1px solid var(--tooltip-border)',
  background: 'var(--tooltip-bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 13,
}

function signed(v: number, unit: string): string {
  const r = Math.round(v * 10) / 10
  if (r === 0) return `±0${unit}`
  return `${r > 0 ? '+' : '−'}${Math.abs(r)}${unit}`
}

export default function WeightVsStrength({
  bodyweight,
  exercises,
  className = '',
}: {
  bodyweight: { date: string; weight: number }[]
  exercises: LiftExerciseSummary[]
  className?: string
}) {
  const candidates = useMemo(
    () => exercises.filter((e) => !e.bodyweight).sort((a, b) => b.sessions - a.sessions),
    [exercises],
  )
  const [name, setName] = useState<string>('')
  const [detail, setDetail] = useState<LiftExerciseDetail | null>(null)

  const selected = name || candidates.find((e) => e.name === '벤치프레스')?.name || candidates[0]?.name || ''

  useEffect(() => {
    if (!selected) return
    let alive = true
    api
      .get(`/lift/exercise?name=${encodeURIComponent(selected)}`)
      .then((res) => alive && res.data.code === 'ok' && setDetail(res.data as LiftExerciseDetail))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [selected])

  const sessions = detail && detail.name === selected ? detail.sessions : null

  const data = useMemo(() => {
    const byDate = new Map<string, { date: string; weight?: number; e1rm?: number }>()
    for (const b of bodyweight) byDate.set(b.date, { date: b.date, weight: b.weight })
    for (const s of sessions ?? []) {
      if (s.e1rm <= 0) continue
      byDate.set(s.date, { ...(byDate.get(s.date) ?? { date: s.date }), e1rm: s.e1rm })
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, name: shortDate(d.date) }))
  }, [bodyweight, sessions])

  // 해석: 종목 첫 회차 ~ 마지막 회차 구간의 체중 변화 vs e1RM 변화
  const summary = useMemo(() => {
    const lifts = (sessions ?? []).filter((s) => s.e1rm > 0)
    if (lifts.length < 2) return null
    const from = lifts[0].date
    const ws = bodyweight.filter((b) => b.date >= from)
    const dE = lifts[lifts.length - 1].e1rm - lifts[0].e1rm
    const parts = []
    if (ws.length >= 2) parts.push(`체중 ${signed(ws[ws.length - 1].weight - ws[0].weight, 'kg')}`)
    parts.push(`${selected} e1RM ${signed(dE, 'kg')}`)
    return `${shortDate(from)} 이후 ${parts.join(', ')}`
  }, [sessions, bodyweight, selected])

  if (candidates.length === 0 && bodyweight.length === 0) return null

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">체중 vs 근력</h2>
        {candidates.length > 0 && (
          <select className="form-input lift-select" value={selected} onChange={(e) => setName(e.target.value)}>
            {candidates.map((e) => (
              <option key={e.name} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {summary && <p className="lift-insight">{summary}</p>}

      {selected && !sessions ? (
        <SkBlock height={208} />
      ) : data.length < 2 ? (
        <p className="text-tertiary" style={{ marginTop: 12 }}>
          비교할 데이터가 아직 부족합니다.
        </p>
      ) : (
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: -16, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--track)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} minTickGap={16} />
              <YAxis yAxisId="w" domain={['auto', 'auto']} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
              <YAxis
                yAxisId="e"
                orientation="right"
                domain={['auto', 'auto']}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--ink-48)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, key) => [kg(Number(value)), key === 'weight' ? '체중' : `${selected} e1RM`]}
              />
              <Line yAxisId="w" type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
              <Line yAxisId="e" type="monotone" dataKey="e1rm" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="lift-legend">
        <span className="lift-legend-dash" /> 체중 (왼쪽)
        <span className="lift-legend-line" /> e1RM (오른쪽)
      </p>
    </section>
  )
}
