import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

// 알림 배너 — /api/notify/check?mode=auto (오전=어제 보고, 오후=오늘 경고).
// evening 에 부족이 없으면 표시하지 않는다 (홈을 조용하게 — DESIGN 절제).

interface NotifyCompare {
  vs: string
  other: number
  pct: number
}

interface NotifyAlert {
  area: string
  label: string
  value: number
  unit: string
  behind: NotifyCompare[]
  ahead: NotifyCompare[]
  message: string
}

interface NotifyResult {
  mode: 'evening' | 'morning'
  date: string
  weekdayLabel: string
  notify: boolean
  summary: string
  alerts: NotifyAlert[]
}

export default function NotifyBanner() {
  const [data, setData] = useState<NotifyResult | null>(null)

  useEffect(() => {
    api
      .get('/notify/check?mode=auto')
      .then((res) => {
        if (res.data.code === 'ok') setData(res.data as NotifyResult)
      })
      .catch(() => {})
  }, [])

  if (!data || !data.notify) return null

  const title = data.mode === 'evening' ? '🔔 오늘 채울 것' : '어제 결과'

  return (
    <section className="card notify-banner">
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          {data.date} {data.weekdayLabel}
        </span>
      </div>
      <ul className="kv-list">
        {data.alerts
          .filter((a) => data.mode === 'morning' || a.behind.length > 0)
          .map((a) => (
            <li key={a.area}>
              <span className="kv-key">
                {a.behind.length > 0 ? '▼' : '✓'} {a.label}
              </span>
              <span className="kv-value">{a.message.replace(`${a.label} `, '')}</span>
            </li>
          ))}
      </ul>
    </section>
  )
}
