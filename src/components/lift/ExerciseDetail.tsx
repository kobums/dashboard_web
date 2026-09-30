import { useEffect, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../../lib/api'
import type { LiftExerciseDetail, LiftSession } from '../../types'
import { fmtSets, fmtVolume, kg, shortDate } from '../../lib/lift'
import { SkBlock, SkLines } from '../common/Skeleton'
import ExerciseArt from './ExerciseArt'
import { ART_CREDIT, exerciseArt } from '../../lib/exerciseArt'

// 종목 상세 — 회차별 e1RM(선) + 볼륨(옅은 막대) 추이, PR 회차는 큰 점, 회차 표.
// 맨몸(BW) 종목은 e1RM 대신 최다 횟수를 그린다. 단일 액센트: 볼륨 막대는 같은 색 저불투명.

const tooltipStyle = {
  borderRadius: 11,
  border: '1px solid var(--tooltip-border)',
  background: 'var(--tooltip-bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 13,
}

export default function ExerciseDetail({ name }: { name: string }) {
  const [data, setData] = useState<LiftExerciseDetail | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api
      .get(`/lift/exercise?name=${encodeURIComponent(name)}`)
      .then((res) => {
        if (res.data.code === 'ok') setData(res.data as LiftExerciseDetail)
        else setFailed(true)
      })
      .catch(() => setFailed(true))
  }, [name])

  if (failed) return <p className="text-tertiary" style={{ marginTop: 12 }}>기록을 불러오지 못했습니다.</p>
  if (!data) {
    return (
      <>
        <SkBlock height={208} />
        <SkLines rows={4} />
      </>
    )
  }

  const bw = data.bodyweight
  const sessions = data.sessions
  const art = exerciseArt(data.name)
  const chartData = sessions.map((s) => ({
    name: shortDate(s.date),
    main: bw ? s.topReps : s.e1rm,
    volume: s.volume,
    pr: s.isPR,
  }))
  const achieved = sessions.filter((s) => s.achievement)
  const hitAll = achieved.filter((s) => s.achievement && s.achievement.hit >= s.achievement.total).length

  return (
    <div className="lift-detail">
      {art && (
        <figure>
          <ExerciseArt name={data.name} size="lg" animate />
          <figcaption className="ex-art-caption">
            {art.exact ? '' : `참고 동작: ${art.title} · `}
            <a href={ART_CREDIT.url} target="_blank" rel="noreferrer">
              {ART_CREDIT.text}
            </a>
          </figcaption>
        </figure>
      )}
      <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
        {data.part} · {sessions.length}회차
        {achieved.length > 0 && ` · 목표 완수 ${hitAll}/${achieved.length}회`}
      </p>

      {sessions.length > 1 ? (
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--track)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
              <YAxis
                yAxisId="main"
                domain={['auto', 'auto']}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--ink-48)', fontSize: 12 }}
              />
              <YAxis yAxisId="vol" orientation="right" hide />
              <Tooltip
                cursor={{ fill: 'var(--cursor-fill)' }}
                contentStyle={tooltipStyle}
                formatter={(value, key) =>
                  key === 'volume'
                    ? [fmtVolume(Number(value), bw), '볼륨']
                    : [bw ? `${value}회` : kg(Number(value)), bw ? '최다 횟수' : 'e1RM']
                }
              />
              <Bar yAxisId="vol" dataKey="volume" fill="var(--accent)" fillOpacity={0.18} radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Line
                yAxisId="main"
                type="monotone"
                dataKey="main"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={(p: { cx?: number; cy?: number; index?: number; payload?: { pr: boolean } }) => (
                  <circle
                    key={p.index}
                    cx={p.cx}
                    cy={p.cy}
                    r={p.payload?.pr ? 5 : 3}
                    fill={p.payload?.pr ? 'var(--accent)' : 'var(--canvas)'}
                    stroke="var(--accent)"
                    strokeWidth={2}
                  />
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-tertiary" style={{ marginTop: 12, fontSize: 14 }}>
          추이는 2회차부터 그려집니다.
        </p>
      )}
      <p className="lift-legend">
        <span className="lift-legend-line" /> {bw ? '최다 횟수' : 'e1RM'}
        <span className="lift-legend-bar" /> 볼륨
        <span className="lift-legend-dot" /> 신기록
      </p>

      <ul className="lift-session-list">
        {[...sessions].reverse().map((s) => (
          <SessionRow key={s.date + s.mainText} s={s} bw={bw} />
        ))}
      </ul>
    </div>
  )
}

function SessionRow({ s, bw }: { s: LiftSession; bw: boolean }) {
  return (
    <li className="lift-session">
      <div className="lift-session-head">
        <span className="lift-session-date">
          {shortDate(s.date)}
          {s.isPR && <span className="lift-pr-badge">PR</span>}
        </span>
        <span className="lift-session-stat">
          {bw ? `${s.topReps}회` : kg(s.e1rm)} · {fmtVolume(s.volume, bw)}
        </span>
      </div>
      <p className="lift-session-sets">{s.main.length > 0 ? fmtSets(s.main) : s.mainText || '—'}</p>
      {s.warmup.length > 0 && <p className="lift-session-sub">웜업 {fmtSets(s.warmup)}</p>}
      {s.goal && (
        <p className="lift-session-sub">
          목표 {s.goal}
          {s.achievement && ` → ${s.achievement.hit}/${s.achievement.total}세트 달성`}
        </p>
      )}
      {s.target && <p className="lift-session-sub">다음 목표 {s.target}</p>}
      {(s.memo || s.condition) && (
        <p className="lift-session-sub">
          {[s.condition && `컨디션 ${s.condition}`, s.memo].filter(Boolean).join(' · ')}
        </p>
      )}
      {s.notionUrl && (
        <a className="lift-link" href={s.notionUrl} target="_blank" rel="noreferrer">
          노션에서 보기
        </a>
      )}
    </li>
  )
}
