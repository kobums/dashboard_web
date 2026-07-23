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
import type { DoneBook, ReadingSummary } from '../../types'

// 연도별 독서 통계 — 연도 칩 → 그해 완독·페이지·월별 차트 + 완독 책 표지 그리드.
// 연도 선택 시 /reading/summary?year= 재호출 (백엔드 10분 캐시).

export default function ReadingYearlyCard({
  initialSummary,
  className = '',
}: {
  initialSummary: ReadingSummary
  className?: string
}) {
  const currentYear = new Date().getFullYear()
  const years = (initialSummary.yearlyStats ?? [])
    .map((y) => y.year)
    .sort((a, b) => b - a)

  const [selected, setSelected] = useState(currentYear)
  const [summary, setSummary] = useState<ReadingSummary>(initialSummary)
  const [books, setBooks] = useState<DoneBook[]>([])

  useEffect(() => {
    api
      .get('/reading/books')
      .then((res) => setBooks(res.data.items ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (selected === currentYear) {
      setSummary(initialSummary)
      return
    }
    api
      .get(`/reading/summary?year=${selected}&month=1`)
      .then((res) => {
        if (res.data.code === 'ok' && res.data.item) setSummary(res.data.item)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  if (years.length === 0) return null

  const yearly = initialSummary.yearlyStats?.find((y) => y.year === selected)
  const monthlyData = (summary.monthlyStats ?? []).map((m) => ({ name: `${m.month}월`, 권수: m.completedCount }))
  const yearBooks = books.filter((b) => b.endDate.startsWith(String(selected)))

  return (
    <section className={`card ${className}`}>
      <h2 className="card-title">연도별 통계</h2>

      <div className="year-chips">
        {years.map((y) => (
          <button key={y} className={`year-chip${y === selected ? ' active' : ''}`} onClick={() => setSelected(y)}>
            {y}
          </button>
        ))}
      </div>

      <div className="year-stat-grid">
        <div>
          <p className="stat-value">{yearly?.completedCount ?? yearBooks.length}권</p>
          <p className="stat-label">완독</p>
        </div>
        <div>
          <p className="stat-value">{(yearly?.totalPages ?? 0).toLocaleString()}</p>
          <p className="stat-label">읽은 페이지</p>
        </div>
      </div>

      {monthlyData.length > 0 && (
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--track)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'var(--cursor-fill)' }}
                contentStyle={{ borderRadius: 11, border: '1px solid var(--tooltip-border)', background: 'var(--tooltip-bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}
                formatter={(value) => [`${value ?? 0}권`, '완독']}
              />
              <Bar dataKey="권수" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {yearBooks.length > 0 && (
        <>
          <p className="book-grid-title">{selected}년에 완독한 책</p>
          <div className="book-grid">
            {yearBooks.map((b, i) => (
              <div key={`${b.title}-${i}`} className="book-grid-item" title={`${b.title} — ${b.author}`}>
                {b.coverUrl ? (
                  <img src={b.coverUrl} alt={b.title} className="book-grid-cover" />
                ) : (
                  <div className="book-grid-cover placeholder" />
                )}
                {b.rating > 0 && <span className="book-grid-rating">{'★'.repeat(b.rating)}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
