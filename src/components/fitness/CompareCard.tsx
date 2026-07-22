import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { ComparePoint, FitnessCompare } from '../../types'

// 같은 요일 비교 — 기준일 vs 1주 전 / 4주 전 / 1년 전(전부 같은 요일).
// 증감은 ▲▼ 기호 + 중립 잉크만 사용 (DESIGN: 두 번째 액센트 금지).

const COLUMN_LABELS: Record<string, string> = {
  base: '기준일',
  week: '1주 전',
  month: '4주 전',
  year: '1년 전',
}

function formatBaseDate(iso: string, weekday: string): string {
  const [, m, d] = iso.split('-')
  return `${Number(m)}월 ${Number(d)}일 ${weekday} 기준`
}

// 기준일 대비 변화율 배지: "오늘이 그 시점보다 ▲/▼ N%"
function DeltaBadge({ base, past }: { base: number | null; past: number | null }) {
  if (base == null || past == null || past === 0) return null
  const pct = Math.round(((base - past) / past) * 100)
  if (pct === 0) return <span className="compare-delta">동일</span>
  return (
    <span className="compare-delta">
      {pct > 0 ? '▲' : '▼'}
      {Math.abs(pct)}%
    </span>
  )
}

interface RowSpec {
  label: string
  value: (p: ComparePoint) => number | null
  format: (v: number) => string
}

const ROWS: RowSpec[] = [
  { label: '걸음', value: (p) => p.steps, format: (v) => Math.round(v).toLocaleString() },
  { label: '활동 에너지', value: (p) => p.activeEnergy, format: (v) => `${Math.round(v)}kcal` },
  { label: '운동 시간', value: (p) => p.exerciseMinutes, format: (v) => `${Math.round(v)}분` },
  {
    label: '운동',
    value: (p) => (p.workoutCount > 0 ? p.workoutMinutes : null),
    format: (v) => `${Math.round(v)}분`,
  },
]

export default function CompareCard({ className = '' }: { className?: string }) {
  const [data, setData] = useState<FitnessCompare | null>(null)

  useEffect(() => {
    api
      .get('/fitness/compare')
      .then((res) => {
        if (res.data.code === 'ok') setData(res.data as FitnessCompare)
      })
      .catch(() => {})
  }, [])

  if (!data) return null

  const points = data.points
  const base = points.find((p) => p.label === 'base')
  if (!base) return null

  // 값이 하나도 없는 행은 숨긴다 (예: exercise_minutes 수집 중단 구간)
  const visibleRows = ROWS.filter((row) => points.some((p) => row.value(p) != null))
  if (visibleRows.length === 0) return null

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">나와의 비교</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          {formatBaseDate(data.baseDate, data.weekdayLabel)}
        </span>
      </div>
      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th />
              {points.map((p) => (
                <th key={p.label}>{COLUMN_LABELS[p.label]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const baseValue = row.value(base)
              return (
                <tr key={row.label}>
                  <td className="compare-row-label">{row.label}</td>
                  {points.map((p) => {
                    const v = row.value(p)
                    return (
                      <td key={p.label}>
                        {v == null ? (
                          <span className="text-tertiary">—</span>
                        ) : (
                          <>
                            <span className="compare-value">{row.format(v)}</span>
                            {p.label !== 'base' && <DeltaBadge base={baseValue} past={v} />}
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="compare-note">모든 시점이 같은 {data.weekdayLabel}입니다 — 요일 패턴을 통제한 비교예요.</p>
    </section>
  )
}
