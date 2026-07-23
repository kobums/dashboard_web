import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { DevActivity, DevSummary } from '../types'
import Heatmap from '../components/common/Heatmap'
import CompareCard from '../components/common/CompareCard'
import { buildDevHeatDays } from '../lib/reading'
import YearlyDevCard from '../components/dev/YearlyDevCard'
import RecentActivityList from '../components/dev/RecentActivityList'

function SourceStatCard({
  label,
  week,
  month,
  total,
  className = '',
}: {
  label: string
  week: number
  month: number
  total: number
  className?: string
}) {
  return (
    <section className={`card ${className}`}>
      <p className="eyebrow">{label}</p>
      <div className="stat-grid" style={{ marginTop: 16 }}>
        <div>
          <p className="stat-value">{week}</p>
          <p className="stat-label">이번 주</p>
        </div>
        <div>
          <p className="stat-value">{month}</p>
          <p className="stat-label">이번 달</p>
        </div>
        <div>
          <p className="stat-value">{total.toLocaleString()}</p>
          <p className="stat-label">전체 합계</p>
        </div>
      </div>
    </section>
  )
}

export default function Dev() {
  const [summary, setSummary] = useState<DevSummary | null>(null)
  const [recent, setRecent] = useState<DevActivity[]>([])

  useEffect(() => {
    api
      .get('/dev/summary?days=0') // 0 = 전체 기간 (백필 포함)
      .then((res) => {
        if (res.data.code === 'ok' && res.data.item) setSummary(res.data.item)
      })
      .catch(() => {})
    api
      .get('/dev/recent')
      .then((res) => setRecent(res.data.items ?? []))
      .catch(() => {})
  }, [])

  if (!summary) {
    return <p className="text-tertiary">불러오는 중…</p>
  }

  const hasData = summary.total.all > 0

  return (
    <div className="stack desktop-grid">
      <h1 className="display-title">개발</h1>

      {!hasData && (
        <p className="card text-secondary">
          아직 활동 데이터가 없습니다. 서버 설정(.env.yml 의 githubToken · gitlabToken · gitlabUsername)을
          채우면 GitHub · GitLab 컨트리뷰션이 여기에 표시됩니다.
        </p>
      )}

      {/* 연간 히트맵 */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">전체 컨트리뷰션</h2>
          <span className="text-secondary" style={{ fontSize: 14 }}>
            {summary.total.all.toLocaleString()}회 · 연속 {summary.streak.current}일 (최장 {summary.streak.max}일)
          </span>
        </div>
        <Heatmap days={buildDevHeatDays(summary.calendar)} />
      </section>

      {/* 같은 요일 비교 — 커밋 */}
      <CompareCard className="dg-8" metrics={['dev']} />

      {/* 소스별 통계 — 데스크톱: 우측 세로 열 */}
      <div className="two-col side-stack dg-4">
        <SourceStatCard
          label="GitHub"
          week={summary.week.github}
          month={summary.month.github}
          total={summary.total.github}
        />
        <SourceStatCard
          label="GitLab"
          week={summary.week.gitlab}
          month={summary.month.gitlab}
          total={summary.total.gitlab}
        />
      </div>

      {/* 연도별 통계 (백필 전체 히스토리) */}
      <YearlyDevCard className="dg-6" />

      {/* 최근 활동 */}
      {recent.length > 0 && (
        <section className="card dg-6">
          <h2 className="card-title">최근 활동</h2>
          <RecentActivityList items={recent} />
        </section>
      )}
    </div>
  )
}
