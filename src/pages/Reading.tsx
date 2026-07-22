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
import { api } from '../lib/api'
import type { ReadingSummary } from '../types'
import ActivityRing from '../components/common/ActivityRing'
import BookProgressList from '../components/reading/BookProgressList'

export default function Reading() {
  const [summary, setSummary] = useState<ReadingSummary | null>(null)
  const [error, setError] = useState(false)

  const year = new Date().getFullYear()

  useEffect(() => {
    api
      .get('/reading/summary')
      .then((res) => {
        if (res.data.code === 'ok' && res.data.item) setSummary(res.data.item)
        else setError(true)
      })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <p className="card text-secondary">
        독서 데이터를 불러오지 못했습니다. 서버의 snippet 연동 설정(.env.yml 의 snippetPassword)을 확인하세요.
      </p>
    )
  }
  if (!summary) {
    return <p className="text-tertiary">불러오는 중…</p>
  }

  const goal = summary.goals?.year === year ? summary.goals : null
  const yearly = summary.yearlyStats?.find((y) => y.year === year)
  const completed = goal?.completedBooks ?? yearly?.completedCount ?? 0
  const monthlyData = (summary.monthlyStats ?? []).map((m) => ({
    name: `${m.month}월`,
    권수: m.completedCount,
    pages: m.totalPages,
  }))

  return (
    <div className="stack desktop-grid">
      <h1 className="display-title">독서</h1>

      {/* 올해 목표 */}
      <section className="card dg-4">
        <div className="card-row" style={{ gap: 32 }}>
          <ActivityRing
            progress={goal && goal.targetBooks > 0 ? completed / goal.targetBooks : 0}
            color="var(--accent)"
            size={140}
            strokeWidth={12}
          >
            <span className="ring-value large">{completed}</span>
            <span className="ring-sub">/ {goal?.targetBooks ?? '—'}권</span>
          </ActivityRing>
          <div className="stack" style={{ gap: 16 }}>
            <div>
              <p className="stat-value large">{(yearly?.totalPages ?? 0).toLocaleString()}</p>
              <p className="stat-label">올해 읽은 페이지</p>
            </div>
            <div>
              <p className="stat-value large">
                {summary.streak?.currentStreak ?? 0}일
                <small>최장 {summary.streak?.maxStreak ?? 0}일</small>
              </p>
              <p className="stat-label">연속 독서</p>
            </div>
          </div>
        </div>
      </section>

      {/* 월별 완독 */}
      <section className="card dg-8">
        <h2 className="card-title">{year}년 월별 완독</h2>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--track)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7a7a7a', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{
                  borderRadius: 11,
                  border: '1px solid #e0e0e0',
                  fontFamily: 'inherit',
                  fontSize: 13,
                }}
                formatter={(value) => [`${value ?? 0}권`, '완독']}
              />
              <Bar dataKey="권수" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 읽고 있는 책 */}
      {summary.progress && summary.progress.length > 0 && (
        <section className="card dg-8">
          <h2 className="card-title">읽고 있는 책</h2>
          <BookProgressList books={summary.progress} />
        </section>
      )}

      {/* 카테고리 & 인사이트 — 데스크톱에선 우측 세로 열 */}
      <div className="two-col side-stack dg-4">
        {summary.categoryStats && summary.categoryStats.length > 0 && (
          <section className="card">
            <h2 className="card-title">카테고리</h2>
            <ul className="kv-list">
              {summary.categoryStats.slice(0, 6).map((cat) => (
                <li key={cat.category}>
                  <span className="kv-key">{cat.category || '미분류'}</span>
                  <span className="kv-value">{cat.completedCount}권</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {summary.insights && (
          <section className="card">
            <h2 className="card-title">인사이트</h2>
            <ul className="kv-list">
              <li>
                <span className="kv-key">평균 완독 기간</span>
                <span className="kv-value">{Math.round(summary.insights.averageReadingDays)}일</span>
              </li>
              <li>
                <span className="kv-key">최다 장르</span>
                <span className="kv-value">{summary.insights.topCategory || '—'}</span>
              </li>
              <li>
                <span className="kv-key">가장 오래 읽은 책</span>
                <span className="kv-value">{summary.insights.longestBook || '—'}</span>
              </li>
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
