import type { DevActivity } from '../../types'

// 최근 개발 활동 목록 — 개발 페이지와 홈(데스크톱) 공용.

const TYPE_LABELS: Record<string, string> = {
  push: '커밋',
  pr: 'PR',
  mr: 'MR',
  issue: '이슈',
  create: '생성',
  activity: '활동',
}

function relativeDate(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return d.toISOString().slice(0, 10)
}

export default function RecentActivityList({
  items,
  twoCol = false,
  limit,
}: {
  items: DevActivity[]
  twoCol?: boolean
  limit?: number
}) {
  const list = limit ? items.slice(0, limit) : items
  if (list.length === 0) {
    return <p className="text-secondary" style={{ marginTop: 12 }}>최근 활동이 없습니다.</p>
  }

  return (
    <ul className={`activity-list${twoCol ? ' two-col-list' : ''}`}>
      {list.map((a, i) => (
        <li key={`${a.url}-${i}`} className="activity-item">
          <span className={`activity-badge src-${a.source}`}>{a.source === 'github' ? 'GH' : 'GL'}</span>
          <a href={a.url} target="_blank" rel="noreferrer" className="activity-body">
            <p className="activity-title">{a.title || TYPE_LABELS[a.type] || a.type}</p>
            <p className="activity-meta">
              {TYPE_LABELS[a.type] ?? a.type}
              {a.repo && ` · ${a.repo}`} · {relativeDate(a.date)}
            </p>
          </a>
        </li>
      ))}
    </ul>
  )
}
