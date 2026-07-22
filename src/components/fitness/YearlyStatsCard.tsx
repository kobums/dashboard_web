import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../../lib/api'
import type { YearFitness } from '../../types'
import { WORKOUT_TYPES } from '../../pages/Fitness'

// 연도별 운동 통계 — 연도 칩 선택 → 요약 스탯 + 월별 세션 차트 + 타입별 분포.

export default function YearlyStatsCard({ className = '' }: { className?: string }) {
  const [years, setYears] = useState<YearFitness[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    api
      .get('/fitness/yearly')
      .then((res) => {
        const list: YearFitness[] = res.data.years ?? []
        setYears(list)
        if (list.length > 0) setSelected(list[0].year)
      })
      .catch(() => {})
  }, [])

  if (years.length === 0) return null

  const year = years.find((y) => y.year === selected) ?? years[0]
  const monthlyData = year.monthly.map((m) => ({ name: `${m.month}월`, 회: m.sessions }))
  const types = Object.entries(year.byType).sort((a, b) => b[1] - a[1])

  return (
    <section className={`card ${className}`}>
      <h2 className="card-title">연도별 통계</h2>

      <div className="year-chips">
        {years.map((y) => (
          <button
            key={y.year}
            className={`year-chip${y.year === year.year ? ' active' : ''}`}
            onClick={() => setSelected(y.year)}
          >
            {y.year}
          </button>
        ))}
      </div>

      <div className="year-stat-grid">
        <div>
          <p className="stat-value">{year.sessions}</p>
          <p className="stat-label">운동 횟수</p>
        </div>
        <div>
          <p className="stat-value">
            {year.minutes >= 60 ? `${Math.floor(year.minutes / 60)}시간` : `${year.minutes}분`}
          </p>
          <p className="stat-label">총 운동 시간</p>
        </div>
        <div>
          <p className="stat-value">{year.distance.toLocaleString()}km</p>
          <p className="stat-label">총 거리</p>
        </div>
        <div>
          <p className="stat-value">{year.avgSteps > 0 ? year.avgSteps.toLocaleString() : '—'}</p>
          <p className="stat-label">하루 평균 걸음</p>
        </div>
      </div>

      {year.sessions > 0 && (
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--track)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'var(--cursor-fill)' }}
                contentStyle={{ borderRadius: 11, border: '1px solid var(--tooltip-border)', background: 'var(--tooltip-bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}
                formatter={(value) => [`${value ?? 0}회`, '운동']}
              />
              <Bar dataKey="회" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {types.length > 0 && (
        <ul className="kv-list">
          {types.map(([type, count]) => (
            <li key={type}>
              <span className="kv-key">{WORKOUT_TYPES[type] ?? type}</span>
              <span className="kv-value">{count}회</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
