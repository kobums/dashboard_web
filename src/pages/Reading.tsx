import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { ReadingDay, ReadingSummary } from '../types'
import { thisWeekStart } from '../lib/fitness'
import { buildReadingDaily, buildReadingHeatDays, buildReadingWeekly } from '../lib/reading'
import ActivityRing from '../components/common/ActivityRing'
import CompareCard from '../components/common/CompareCard'
import Heatmap from '../components/common/Heatmap'
import WeeklyChart from '../components/fitness/WeeklyChart'
import BookProgressList from '../components/reading/BookProgressList'
import ReadingYearlyCard from '../components/reading/ReadingYearlyCard'

export default function Reading() {
  const [summary, setSummary] = useState<ReadingSummary | null>(null)
  const [daily, setDaily] = useState<ReadingDay[]>([])
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
    api
      .get('/reading/daily')
      .then((res) => setDaily(res.data.items ?? []))
      .catch(() => {})
  }, [])

  const heatDays = useMemo(() => buildReadingHeatDays(daily), [daily])
  const dailyData = useMemo(() => buildReadingDaily(daily, 14), [daily])
  const weeklyData = useMemo(() => buildReadingWeekly(daily, thisWeekStart(new Date())), [daily])
  const readDays = daily.filter((d) => d.pages > 0 || d.minutes > 0).length
  const totalPages = daily.reduce((s, d) => s + d.pages, 0)
  const totalSessions = daily.reduce((s, d) => s + d.sessions, 0)
  const totalMinutes = daily.reduce((s, d) => s + d.minutes, 0)

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
  // progress 에는 waiting/completed 도 섞여 오므로 실제 읽는 중만 추린다
  const readingBooks = summary.progress?.filter((b) => b.status === 'reading') ?? []

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

      {/* 같은 요일 비교 — 페이지는 읽은 페이지 로그, 시간은 세션(타이머) 기준 */}
      <CompareCard
        className="dg-8"
        metrics={['readingMinutes', 'readingPages']}
        emptyHint="snippet 에서 읽은 페이지를 기록하면 페이지 비교가 여기에 표시됩니다. 시간 비교는 독서 세션(타이머) 기준입니다."
      />

      {/* 일별/주별 읽은 페이지 — 타이머 세션 + 진행률만 올린 날(snippet 읽은 페이지 로그) */}
      <section className="card dg-6">
        <h2 className="card-title">일별 읽은 페이지</h2>
        <WeeklyChart data={dailyData} dataKey="페이지" unit="p" label="읽은 페이지" />
      </section>
      <section className="card dg-6">
        <h2 className="card-title">주별 읽은 페이지</h2>
        <WeeklyChart data={weeklyData} dataKey="페이지" unit="p" label="읽은 페이지" />
      </section>

      {/* 독서 잔디 */}
      {heatDays.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">독서 잔디</h2>
            <span className="text-secondary" style={{ fontSize: 14 }}>
              {readDays}일 · {totalPages.toLocaleString()}p
              {totalSessions > 0 && ` · 세션 ${totalSessions}회 · ${totalMinutes}분`}
            </span>
          </div>
          <Heatmap days={heatDays} thresholds={[10, 30, 60]} />
        </section>
      )}

      {/* 읽고 있는 책 */}
      {readingBooks.length > 0 && (
        <section className="card">
          <h2 className="card-title">읽고 있는 책</h2>
          <BookProgressList books={readingBooks} />
        </section>
      )}

      {/* 연도별 통계 (완독 책 그리드 포함) */}
      <ReadingYearlyCard initialSummary={summary} className="dg-8" />

      {/* 카테고리 & 인사이트 — 데스크톱 우측 세로 열 */}
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
