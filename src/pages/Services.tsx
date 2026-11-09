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
import type { SignupService, SignupSummary, SignupWeek } from '../types'

// 서비스별 신규 가입·활성 유저 — 공용 MariaDB 의 각 서비스 테이블 집계 (/api/signups/summary, 5분 캐시).
// 활성 유저 = 기간 안에 활동 흔적(로그인 토큰·콘텐츠 생성/수정)이 있는 고유 유저. 주는 월요일 시작.
// 증감은 ▲▼ + 중립 잉크 (DESIGN: 두 번째 액센트 금지).

function Delta({ now, before }: { now: number; before: number }) {
  const diff = now - before
  if (diff === 0) return <span className="compare-delta">지난주 같은 시점과 동일</span>
  return (
    <span className="compare-delta">
      지난주 같은 시점 대비 {diff > 0 ? '▲' : '▼'} {Math.abs(diff)}
    </span>
  )
}

function Spark({ weekly }: { weekly: SignupWeek[] }) {
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

function WeeklyChart({ data, title, sub, label }: { data: { name: string; 명: number }[]; title: string; sub: string; label: string }) {
  return (
    <section className="card dg-4">
      <h2 className="card-title">{title}</h2>
      <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
        {sub}
      </p>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--track)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'var(--cursor-fill)' }}
              contentStyle={{ borderRadius: 11, border: '1px solid var(--tooltip-border)', background: 'var(--tooltip-bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}
              formatter={(value) => [`${value ?? 0}명`, label]}
              labelFormatter={(l) => `${l} 주`}
            />
            <Bar dataKey="명" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function daysAgoText(prefix: string, ts: string, empty: string): string {
  if (!ts) return empty
  const days = Math.floor((Date.now() - new Date(ts.replace(' ', 'T')).getTime()) / 86400000)
  if (days <= 0) return `${prefix} 오늘`
  return `${prefix} ${days}일 전`
}

function weekLabel(start: string) {
  return `${Number(start.slice(5, 7))}/${Number(start.slice(8, 10))}`
}

function sumWeekly(services: SignupService[], pick: (s: SignupService) => SignupWeek[] | undefined) {
  const weeks = services[0]?.weekly ?? []
  return weeks.map((w, i) => ({
    name: weekLabel(w.start),
    명: services.reduce((sum, s) => sum + (pick(s)?.[i]?.count ?? 0), 0),
  }))
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

  const { totals, activityTotals: act } = data
  const bySignup = [...data.services].sort(
    (a, b) => b.thisWeek - a.thisWeek || b.today - a.today || b.total - a.total,
  )
  const byActivity = [...data.services].sort(
    (a, b) =>
      (b.activity ? 1 : 0) - (a.activity ? 1 : 0) ||
      (b.activity?.last30 ?? 0) - (a.activity?.last30 ?? 0) ||
      (b.activity?.thisWeek ?? 0) - (a.activity?.thisWeek ?? 0) ||
      b.total - a.total,
  )
  const weekCount = data.services[0]?.weekly.length ?? 0

  return (
    <div className="stack desktop-grid">
      <h1 className="display-title">서비스</h1>

      <section className="card dg-6">
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

      <section className="card dg-6">
        <div className="card-head">
          <h2 className="card-title">활성 유저</h2>
          <span className="text-secondary" style={{ fontSize: 14 }}>
            로그인·기록을 남긴 고유 유저
          </span>
        </div>
        <div className="stat-grid signup-stats">
          <div>
            <p className="stat-value large">{act.today}</p>
            <p className="stat-label">오늘</p>
          </div>
          <div>
            <p className="stat-value large">{act.thisWeek}</p>
            <p className="stat-label">이번 주</p>
            <Delta now={act.thisWeek} before={act.lastWeekSoFar} />
          </div>
          <div>
            <p className="stat-value large">{act.lastWeek}</p>
            <p className="stat-label">지난주</p>
          </div>
          <div>
            <p className="stat-value large">{act.last30}</p>
            <p className="stat-label">최근 30일</p>
          </div>
        </div>
      </section>

      <section className="card dg-8">
        <h2 className="card-title">서비스별 활성도</h2>
        <div className="signup-list">
          <div className="signup-row wide head">
            <span>서비스</span>
            <span className="num">오늘</span>
            <span className="num">이번 주</span>
            <span className="num">30일</span>
            <span className="num">활성률</span>
            <span className="num signup-spark-head">8주</span>
          </div>
          {byActivity.map((s) => {
            const a = s.activity
            if (!a || a.error) {
              return (
                <div className="signup-row wide" key={s.key}>
                  <span className="signup-name">
                    {s.name}
                    <span className="signup-sub">{a?.error ?? '활동 기록 없음'}</span>
                  </span>
                  <span className="num text-tertiary">–</span>
                  <span className="num text-tertiary">–</span>
                  <span className="num text-tertiary">–</span>
                  <span className="num text-tertiary">–</span>
                  <span className="signup-spark" />
                </div>
              )
            }
            const rate = s.total > 0 ? Math.round((a.last30 / s.total) * 100) : 0
            return (
              <div className="signup-row wide" key={s.key}>
                <span className="signup-name">
                  {s.name}
                  <span className="signup-sub">{daysAgoText('마지막 활동', a.lastActive, '활동 없음')}</span>
                </span>
                <span className={`num${a.today > 0 ? ' hot' : ''}`}>{a.today}</span>
                <span className={`num${a.thisWeek > 0 ? ' hot' : ''}`}>{a.thisWeek}</span>
                <span className="num">{a.last30}</span>
                <span className="num">{rate}%</span>
                <Spark weekly={a.weekly} />
              </div>
            )
          })}
        </div>
        <p className="text-tertiary" style={{ fontSize: 12, marginTop: 12 }}>
          활성률 = 최근 30일 활성 유저 ÷ 누적 가입. 8주 막대는 주별 활성 유저.
        </p>
      </section>

      <WeeklyChart
        data={sumWeekly(data.services, (s) => s.activity?.weekly)}
        title="주별 활성 유저"
        sub={`서비스별 합계 · 최근 ${weekCount}주`}
        label="활성 유저"
      />

      <section className="card dg-8">
        <h2 className="card-title">서비스별 가입</h2>
        <div className="signup-list">
          <div className="signup-row head">
            <span>서비스</span>
            <span className="num">오늘</span>
            <span className="num">이번 주</span>
            <span className="num">누적</span>
            <span className="num signup-spark-head">8주</span>
          </div>
          {bySignup.map((s) => (
            <div className="signup-row" key={s.key}>
              <span className="signup-name">
                {s.name}
                <span className="signup-sub">
                  {s.error ?? daysAgoText('마지막 가입', s.lastSignup, '가입 없음')}
                </span>
              </span>
              <span className={`num${s.today > 0 ? ' hot' : ''}`}>{s.today}</span>
              <span className={`num${s.thisWeek > 0 ? ' hot' : ''}`}>{s.thisWeek}</span>
              <span className="num">{s.total.toLocaleString()}</span>
              <Spark weekly={s.weekly} />
            </div>
          ))}
        </div>
      </section>

      <WeeklyChart
        data={sumWeekly(data.services, (s) => s.weekly)}
        title="주별 가입"
        sub={`전체 서비스 합계 · 최근 ${weekCount}주`}
        label="신규 가입"
      />
    </div>
  )
}
