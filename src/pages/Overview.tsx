import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { DevActivity, DevSummary, HealthMetric, ReadingSummary, Workout } from '../types'
import { fmtDate, thisWeekStart } from '../lib/fitness'
import { buildDevHeatDays } from '../lib/reading'
import ActivityRing from '../components/common/ActivityRing'
import NotifyBanner from '../components/common/NotifyBanner'
import Heatmap from '../components/common/Heatmap'
import { SkBlock, SkLines, SkRingRow } from '../components/common/Skeleton'
import BookProgressList from '../components/reading/BookProgressList'
import RecentActivityList from '../components/dev/RecentActivityList'
import WorkoutList from '../components/fitness/WorkoutList'

function Card({
  to,
  eyebrow,
  className = '',
  children,
}: {
  to: string
  eyebrow: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link to={to} className={`card ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <div className="card-body">{children}</div>
    </Link>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  )
}

export default function Overview() {
  // null = 아직 로딩 중 (스켈레톤 표시), 빈 배열 = 로딩 완료·데이터 없음
  const [reading, setReading] = useState<ReadingSummary | null>(null)
  const [readingError, setReadingError] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[] | null>(null)
  const [metrics, setMetrics] = useState<HealthMetric[] | null>(null)
  const [dev, setDev] = useState<DevSummary | null>(null)
  const [devRecent, setDevRecent] = useState<DevActivity[] | null>(null)

  const today = new Date()
  const weekAgo = new Date(today.getTime() - 6 * 86400000)
  const eightWeeksAgo = new Date(today.getTime() - 55 * 86400000)

  useEffect(() => {
    api
      .get('/reading/summary')
      .then((res) => {
        if (res.data.code === 'ok' && res.data.item) setReading(res.data.item)
        else setReadingError(true)
      })
      .catch(() => setReadingError(true))
    api
      .get(`/workout?startworkoutdate=${fmtDate(eightWeeksAgo)}&endworkoutdate=${fmtDate(today)}&pagesize=500`)
      .then((res) => setWorkouts(res.data.items ?? []))
      .catch(() => setWorkouts([]))
    api
      .get(`/health/metrics?from=${fmtDate(weekAgo)}&to=${fmtDate(today)}`)
      .then((res) => setMetrics(res.data.items ?? []))
      .catch(() => setMetrics([]))
    api
      .get('/dev/summary?days=0') // dev 페이지와 같은 캐시 키(전체 기간) — 캐시 히트
      .then((res) => {
        if (res.data.code === 'ok' && res.data.item) setDev(res.data.item)
      })
      .catch(() => {})
    api
      .get('/dev/recent')
      .then((res) => setDevRecent(res.data.items ?? []))
      .catch(() => setDevRecent([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goal = reading?.goals?.year === today.getFullYear() ? reading.goals : null
  const completedThisYear =
    goal?.completedBooks ??
    reading?.yearlyStats?.find((y) => y.year === today.getFullYear())?.completedCount ??
    0
  const goalProgress = goal && goal.targetBooks > 0 ? completedThisYear / goal.targetBooks : 0
  const readingCount = reading?.progress?.filter((b) => b.status === 'reading').length ?? 0

  const workoutList = workouts ?? []
  const metricList = metrics ?? []
  const fitnessLoading = workouts === null || metrics === null
  const weekStart = thisWeekStart(today)
  const thisWeek = workoutList.filter((w) => w.workoutdate >= fmtDate(weekStart))
  const weekMinutes = Math.round(thisWeek.reduce((sum, w) => sum + w.duration, 0) / 60)
  const weekSteps = metricList.filter((m) => m.name === 'steps').reduce((s, m) => s + m.qty, 0)
  const hasFitnessData = workoutList.length > 0 || metricList.length > 0

  // 개발: 최근 7일 중 활동일 비율이 링, 중앙은 이번 주 컨트리뷰션
  const last7 = dev?.calendar.slice(-7) ?? []
  const devActiveDays = last7.filter((d) => d.total > 0).length

  // 홈 히트맵은 요약이므로 최근 1년만 (전체는 개발 페이지에서)
  const last365 = dev?.calendar.slice(-365) ?? []
  const last365Total = last365.reduce((s, d) => s + d.total, 0)

  return (
    <div className="stack desktop-grid">
      <h1 className="display-title">
        {today.getMonth() + 1}월 {today.getDate()}일,
        <br />
        오늘의 현황
      </h1>

      <NotifyBanner />

      <Card to="/reading" eyebrow="독서" className="dg-4">
        {readingError ? (
          <p className="text-secondary">독서 데이터를 불러오지 못했습니다. snippet 연동 설정을 확인하세요.</p>
        ) : !reading ? (
          <SkRingRow />
        ) : (
          <div className="card-row">
            <ActivityRing progress={goalProgress} color="var(--accent)" size={96} strokeWidth={9}>
              <span className="ring-value">{completedThisYear}</span>
              <span className="ring-sub">/ {goal?.targetBooks ?? '—'}권</span>
            </ActivityRing>
            <div className="stat-grid">
              <Stat value={readingCount} label="읽는 중" />
              <Stat value={`${reading.streak?.currentStreak ?? 0}일`} label="연속 독서" />
            </div>
          </div>
        )}
      </Card>

      <Card to="/fitness" eyebrow="운동" className="dg-4">
        {fitnessLoading ? (
          <SkRingRow />
        ) : hasFitnessData ? (
          <div className="card-row">
            <ActivityRing
              progress={weekMinutes / 150} // WHO 주간 권장 150분 기준
              color="var(--accent)"
              size={96}
              strokeWidth={9}
            >
              <span className="ring-value">{weekMinutes}</span>
              <span className="ring-sub">분 / 주</span>
            </ActivityRing>
            <div className="stat-grid">
              <Stat value={thisWeek.length} label="이번 주 운동" />
              <Stat value={weekSteps > 0 ? Math.round(weekSteps).toLocaleString() : '—'} label="걸음 (7일)" />
            </div>
          </div>
        ) : (
          <p className="text-secondary">
            아직 운동 기록이 없습니다. 직접 기록하거나 Health Auto Export 를 연결하세요.
          </p>
        )}
      </Card>

      <Card to="/dev" eyebrow="개발" className="dg-4">
        {!dev ? (
          <SkRingRow />
        ) : (
          <div className="card-row">
            <ActivityRing progress={devActiveDays / 7} color="var(--accent)" size={96} strokeWidth={9}>
              <span className="ring-value">{dev.week.all}</span>
              <span className="ring-sub">회 / 주</span>
            </ActivityRing>
            <div className="stat-grid">
              <Stat value={dev.month.all.toLocaleString()} label="이번 달" />
              <Stat value={`${dev.streak.current}일`} label="연속 커밋" />
            </div>
          </div>
        )}
      </Card>

      {/* ---- 이하 데스크톱 전용 상세 미리보기 ---- */}

      {dev ? (
        <section className="card desktop-only">
          <div className="card-head">
            <h2 className="card-title">최근 1년 컨트리뷰션</h2>
            <span className="text-secondary" style={{ fontSize: 14 }}>
              {last365Total.toLocaleString()}회 · 최장 연속 {dev.streak.max}일
            </span>
          </div>
          <Heatmap days={buildDevHeatDays(last365)} />
        </section>
      ) : (
        <section className="card desktop-only">
          <h2 className="card-title">최근 1년 컨트리뷰션</h2>
          <SkBlock height={132} />
        </section>
      )}

      {!reading && !readingError ? (
        <section className="card desktop-only dg-4">
          <h2 className="card-title">읽고 있는 책</h2>
          <SkLines rows={5} />
        </section>
      ) : reading?.progress && reading.progress.length > 0 ? (
        <section className="card desktop-only dg-4">
          <h2 className="card-title">읽고 있는 책</h2>
          <BookProgressList books={reading.progress} />
        </section>
      ) : null}

      <section className="card desktop-only dg-4">
        <h2 className="card-title">최근 운동 기록</h2>
        {workouts === null ? <SkLines rows={5} /> : <WorkoutList workouts={workoutList} limit={20} />}
      </section>

      {devRecent === null ? (
        <section className="card desktop-only dg-4">
          <h2 className="card-title">최근 개발 활동</h2>
          <SkLines rows={5} />
        </section>
      ) : devRecent.length > 0 ? (
        <section className="card desktop-only dg-4">
          <h2 className="card-title">최근 개발 활동</h2>
          <RecentActivityList items={devRecent} />
        </section>
      ) : null}
    </div>
  )
}
