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
import type { DevYear } from '../../types'

// 연도별 개발 통계 — 백필된 전체 히스토리(GitHub 계정 생성 이후) 기반.

export default function YearlyDevCard({ className = '' }: { className?: string }) {
  const [years, setYears] = useState<DevYear[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    api
      .get('/dev/yearly')
      .then((res) => {
        const list: DevYear[] = res.data.years ?? []
        setYears(list)
        if (list.length > 0) setSelected(list[0].year)
      })
      .catch(() => {})
  }, [])

  if (years.length === 0) return null

  const year = years.find((y) => y.year === selected) ?? years[0]
  const monthlyData = year.monthly.map((m) => ({ name: `${m.month}월`, 회: m.total }))

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
          <p className="stat-value">{year.total.toLocaleString()}</p>
          <p className="stat-label">컨트리뷰션</p>
        </div>
        <div>
          <p className="stat-value">{year.github.toLocaleString()}</p>
          <p className="stat-label">GitHub</p>
        </div>
        <div>
          <p className="stat-value">{year.gitlab.toLocaleString()}</p>
          <p className="stat-label">GitLab</p>
        </div>
        <div>
          <p className="stat-value">{year.activeDays}일</p>
          <p className="stat-label">활동일</p>
        </div>
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--track)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'var(--cursor-fill)' }}
              contentStyle={{ borderRadius: 11, border: '1px solid var(--tooltip-border)', background: 'var(--tooltip-bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}
              formatter={(value) => [`${value ?? 0}회`, '컨트리뷰션']}
            />
            <Bar dataKey="회" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
