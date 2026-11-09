import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SignupWeek } from '../../types'

// 서비스 탭(목록·상세) 공용 조각. 증감은 ▲▼ + 중립 잉크 (DESIGN: 두 번째 액센트 금지).

export function Delta({ now, before }: { now: number; before: number }) {
  const diff = now - before
  if (diff === 0) return <span className="compare-delta">지난주 같은 시점과 동일</span>
  return (
    <span className="compare-delta">
      지난주 같은 시점 대비 {diff > 0 ? '▲' : '▼'} {Math.abs(diff)}
    </span>
  )
}

export function Spark({ weekly }: { weekly: SignupWeek[] }) {
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

export function BarCard({
  title,
  sub,
  data,
  label,
  tooltipLabel = (l) => l,
  className = 'dg-4',
}: {
  title: string
  sub: string
  data: { name: string; 명: number }[]
  label: string
  tooltipLabel?: (l: string) => string
  className?: string
}) {
  return (
    <section className={`card ${className}`}>
      <h2 className="card-title">{title}</h2>
      <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
        {sub}
      </p>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--track)" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              minTickGap={12}
              tick={{ fill: 'var(--ink-48)', fontSize: 12 }}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'var(--cursor-fill)' }}
              contentStyle={{ borderRadius: 11, border: '1px solid var(--tooltip-border)', background: 'var(--tooltip-bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}
              formatter={(value) => [`${value ?? 0}명`, label]}
              labelFormatter={(l) => tooltipLabel(String(l))}
            />
            <Bar dataKey="명" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export function daysAgoText(prefix: string, ts: string, empty: string): string {
  if (!ts) return empty
  const days = Math.floor((Date.now() - new Date(ts.replace(' ', 'T')).getTime()) / 86400000)
  if (days <= 0) return `${prefix} 오늘`
  return `${prefix} ${days}일 전`
}

// "2026-11-09" → "11/9"
export function shortDate(date: string) {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`
}
