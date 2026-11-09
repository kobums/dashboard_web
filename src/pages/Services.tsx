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
import type { SignupService, SignupSummary } from '../types'

// 서비스별 신규 가입 — 공용 MariaDB 의 각 서비스 유저 테이블 집계 (/api/signups/summary, 5분 캐시).
// 주는 월요일 시작. 증감은 ▲▼ + 중립 잉크 (DESIGN: 두 번째 액센트 금지).

function Delta({ now, before }: { now: number; before: number }) {
  const diff = now - before
  if (diff === 0) return <span className="compare-delta">지난주 같은 시점과 동일</span>
  return (
    <span className="compare-delta">
      지난주 같은 시점 대비 {diff > 0 ? '▲' : '▼'} {Math.abs(diff)}
    </span>
  )
}

function Spark({ weekly }: { weekly: SignupService['weekly'] }) {
  const max = Math.max(1, ...weekly.map((w) => w.count))
  const bw = 72 / weekly.length
  return (
    <svg className="signup-spark" viewBox="0 0 72 24" aria-hidden="true">
      {weekly.map((w, i) => {
        const h = w.count === 0 ? 1 : Math.max(2, (w.count / max) * 24)
        return (
          <rect
            key={w.start}
            x={i * bw + 1}
            y={24 - h}
            width={bw - 2}
            height={h}
            rx={1}
            fill={w.count === 0 ? 'var(--track)' : 'var(--accent)'}
          />
        )
      })}
    </svg>
  )
}

function lastSignupText(s: SignupService): string {
  if (s.error) return s.error
  if (!s.lastSignup) return '가입 없음'
  const days = Math.floor((Date.now() - new Date(s.lastSignup.replace(' ', 'T')).getTime()) / 86400000)
  if (days <= 0) return '마지막 가입 오늘'
  return `마지막 가입 ${days}일 전`
}

export default function Services() {
  const [data, setData] = useState<SignupSummary | null>(null)

  useEffect(() => {
    api
      .get('/signups/summary')
      .then((res) => {
        if (res.data.code === 'ok' && res.data.item) setData(res.data.item)
      })
      .catch(() => {})
  }, [])

  if (!data) {
    return <p className="text-tertiary">불러오는 중…</p>
  }

  const { totals } = data
  const services = [...data.services].sort(
    (a, b) => b.thisWeek - a.thisWeek || b.today - a.today || b.total - a.total,
  )
  const weeks = data.services[0]?.weekly ?? []
  const weeklyData = weeks.map((w, i) => ({
    name: `${Number(w.start.slice(5, 7))}/${Number(w.start.slice(8, 10))}`,
    명: data.services.reduce((sum, s) => sum + (s.weekly[i]?.count ?? 0), 0),
  }))

  return (
    <div className="stack desktop-grid">
      <h1 className="display-title">서비스</h1>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">신규 가입</h2>
          <span className="text-secondary" style={{ fontSize: 14 }}>
            {data.weekStart.slice(5).replace('-', '/')} 월요일부터 · {data.asOf.slice(11, 16)} 기준
          </span>
        </div>
        <div className="stat-grid signup-stats">
          <div>
            <p className="stat-value large">{totals.today}</p>
            <p className="stat-label">오늘</p>
            <span className="compare-delta">어제 {totals.yesterday}</span>
          </div>
          <div>
            <p className="stat-value large">{totals.thisWeek}</p>
            <p className="stat-label">이번 주</p>
            <Delta now={totals.thisWeek} before={totals.lastWeekSoFar} />
          </div>
          <div>
            <p className="stat-value large">{totals.lastWeek}</p>
            <p className="stat-label">지난주</p>
          </div>
          <div>
            <p className="stat-value large">{totals.total.toLocaleString()}</p>
            <p className="stat-label">누적</p>
          </div>
        </div>
      </section>

      <section className="card dg-8">
        <h2 className="card-title">서비스별</h2>
        <div className="signup-list">
          <div className="signup-row head">
            <span>서비스</span>
            <span className="num">오늘</span>
            <span className="num">이번 주</span>
            <span className="num">누적</span>
            <span className="num signup-spark-head">8주</span>
          </div>
          {services.map((s) => (
            <div className="signup-row" key={s.key}>
              <span className="signup-name">
                {s.name}
                <span className="signup-sub">{lastSignupText(s)}</span>
              </span>
              <span className={`num${s.today > 0 ? ' hot' : ''}`}>{s.today}</span>
              <span className={`num${s.thisWeek > 0 ? ' hot' : ''}`}>{s.thisWeek}</span>
              <span className="num">{s.total.toLocaleString()}</span>
              <Spark weekly={s.weekly} />
            </div>
          ))}
        </div>
      </section>

      <section className="card dg-4">
        <h2 className="card-title">주별 가입</h2>
        <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
          전체 서비스 합계 · 최근 {weeks.length}주
        </p>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--track)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'var(--cursor-fill)' }}
                contentStyle={{ borderRadius: 11, border: '1px solid var(--tooltip-border)', background: 'var(--tooltip-bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}
                formatter={(value) => [`${value ?? 0}명`, '신규 가입']}
                labelFormatter={(label) => `${label} 주`}
              />
              <Bar dataKey="명" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
