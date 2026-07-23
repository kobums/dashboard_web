import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { UnifiedCompare, UnifiedPoint } from '../../types'

// 통합 같은 요일 비교 카드 — /api/compare 를 쓰고 metrics prop 으로 표시 지표를 고른다.
// 시점: 기준일 / 전날 / 1주 전 / 4주 전 / 1년 전 (전날 외엔 같은 요일 보존).
// 증감은 ▲▼ 기호 + 중립 잉크만 (DESIGN: 두 번째 액센트 금지).

export type MetricKey =
  | 'steps'
  | 'activeEnergy'
  | 'exerciseMinutes'
  | 'workout'
  | 'dev'
  | 'readingMinutes'
  | 'readingPages'

interface RowSpec {
  label: string
  value: (p: UnifiedPoint) => number | null
  format: (v: number) => string
}

const METRIC_ROWS: Record<MetricKey, RowSpec> = {
  steps: { label: '걸음', value: (p) => p.steps, format: (v) => Math.round(v).toLocaleString() },
  activeEnergy: { label: '활동 에너지', value: (p) => p.activeEnergy, format: (v) => `${Math.round(v)}kcal` },
  exerciseMinutes: { label: '운동 시간', value: (p) => p.exerciseMinutes, format: (v) => `${Math.round(v)}분` },
  workout: {
    label: '운동',
    value: (p) => (p.workoutCount > 0 ? p.workoutMinutes : null),
    format: (v) => `${Math.round(v)}분`,
  },
  dev: { label: '커밋', value: (p) => p.devCommits, format: (v) => `${Math.round(v)}회` },
  readingMinutes: {
    label: '독서 시간',
    value: (p) => (p.readingMinutes != null && p.readingMinutes > 0 ? p.readingMinutes : null),
    format: (v) => `${Math.round(v)}분`,
  },
  readingPages: {
    label: '읽은 페이지',
    value: (p) => (p.readingPages != null && p.readingPages > 0 ? p.readingPages : null),
    format: (v) => `${Math.round(v)}p`,
  },
}

const COLUMN_LABELS: Record<string, string> = {
  base: '기준일',
  prev: '전날',
  week: '1주 전',
  month: '4주 전',
  year: '1년 전',
}

function formatBaseDate(iso: string, weekday: string): string {
  const [, m, d] = iso.split('-')
  return `${Number(m)}월 ${Number(d)}일 ${weekday} 기준`
}

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

export default function CompareCard({
  metrics,
  className = '',
  emptyHint,
}: {
  metrics: MetricKey[]
  className?: string
  emptyHint?: string
}) {
  const [data, setData] = useState<UnifiedCompare | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api
      .get('/compare')
      .then((res) => {
        if (res.data.code === 'ok') setData(res.data as UnifiedCompare)
        else setFailed(true)
      })
      .catch(() => setFailed(true))
  }, [])

  // 로딩 중에도 카드 틀을 유지해 그리드 재배치(레이아웃 시프트)를 막는다
  if (!data) {
    return (
      <section className={`card ${className}`}>
        <h2 className="card-title">나와의 비교</h2>
        <p className="text-tertiary" style={{ marginTop: 12 }}>
          {failed ? '비교 데이터를 불러오지 못했습니다.' : '불러오는 중…'}
        </p>
      </section>
    )
  }

  const points = data.points
  const base = points.find((p) => p.label === 'base')
  if (!base) return null

  const rows = metrics.map((k) => METRIC_ROWS[k])
  const visibleRows = rows.filter((row) => points.some((p) => row.value(p) != null))

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">나와의 비교</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          {formatBaseDate(data.baseDate, data.weekdayLabel)}
        </span>
      </div>
      {visibleRows.length === 0 ? (
        <p className="text-secondary" style={{ marginTop: 12 }}>
          {emptyHint ?? '아직 비교할 데이터가 없습니다.'}
        </p>
      ) : (
        <>
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
          <p className="compare-note">전날을 제외한 모든 시점이 같은 {data.weekdayLabel}입니다.</p>
        </>
      )}
    </section>
  )
}
