import { Bar, BarChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LiftWeek } from '../../types'
import { fullSplitStreak, LIFT_PARTS, shortDate, WEEKLY_SET_GUIDE } from '../../lib/lift'

// 부위별 주간 볼륨 — 이번 주 4분할 체크 + 연속 완수 주, 부위별 12주 본세트 수 스몰 멀티플
// (단일 액센트라 부위를 색으로 가르지 않고 차트를 나눈다), 권장 10~20세트 밴드, 주간 유산소.

const tooltipStyle = {
  borderRadius: 11,
  border: '1px solid var(--tooltip-border)',
  background: 'var(--tooltip-bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 13,
}

export default function WeeklyVolume({ weekly, className = '' }: { weekly: LiftWeek[]; className?: string }) {
  if (weekly.length === 0) {
    return (
      <section className={`card ${className}`}>
        <h2 className="card-title">부위별 주간 볼륨</h2>
        <p className="text-secondary" style={{ marginTop: 12 }}>
          아직 주간 기록이 없습니다.
        </p>
      </section>
    )
  }

  const thisWeek = weekly[weekly.length - 1]
  const streak = fullSplitStreak(weekly)
  const maxSets = Math.max(WEEKLY_SET_GUIDE.max + 2, ...weekly.flatMap((w) => LIFT_PARTS.map((p) => w.sets[p] ?? 0)))
  const cardioData = weekly.map((w) => ({ name: shortDate(w.weekStart), 분: w.cardioMinutes }))

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">부위별 주간 볼륨</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          월요일 시작 · 본세트 수
        </span>
      </div>

      <div className="split-row">
        <ul className="split-check">
          {LIFT_PARTS.map((p) => {
            const done = thisWeek.splitDone.includes(p)
            return (
              <li key={p} className={done ? 'done' : ''}>
                <span className="split-mark">{done ? '✓' : ''}</span>
                <span>{p}</span>
                <span className="split-sets">{thisWeek.sets[p] ?? 0}세트</span>
              </li>
            )
          })}
        </ul>
        <div className="split-stats">
          <div>
            <p className="stat-value">{thisWeek.days}일</p>
            <p className="stat-label">이번 주 운동</p>
          </div>
          <div>
            <p className="stat-value">{streak}주</p>
            <p className="stat-label">4분할 연속 완수</p>
          </div>
        </div>
      </div>

      <div className="part-multiples">
        {LIFT_PARTS.map((p) => {
          const data = weekly.map((w) => ({ name: shortDate(w.weekStart), 세트: w.sets[p] ?? 0 }))
          return (
            <div key={p} className="part-multiple">
              <p className="part-multiple-title">
                {p}
                <span>{thisWeek.sets[p] ?? 0}</span>
              </p>
              <div className="part-multiple-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
                    <ReferenceArea
                      y1={WEEKLY_SET_GUIDE.min}
                      y2={WEEKLY_SET_GUIDE.max}
                      fill="var(--track)"
                      fillOpacity={0.6}
                      ifOverflow="extendDomain"
                    />
                    <XAxis dataKey="name" hide />
                    <YAxis
                      domain={[0, maxSets]}
                      ticks={[0, WEEKLY_SET_GUIDE.min, WEEKLY_SET_GUIDE.max]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--ink-48)', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--cursor-fill)' }}
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value ?? 0}세트`, p]}
                      labelFormatter={(l) => `${l} 주`}
                    />
                    <Bar dataKey="세트" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>
      <p className="compare-note">회색 띠 = 주 {WEEKLY_SET_GUIDE.min}~{WEEKLY_SET_GUIDE.max}세트 (근비대 권장 범위 참고선) · 최근 12주</p>

      <h3 className="lift-subtitle">주간 유산소</h3>
      <div className="chart-box" style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cardioData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: 'var(--cursor-fill)' }}
              contentStyle={tooltipStyle}
              formatter={(value) => [`${value ?? 0}분`, '유산소']}
            />
            <Bar dataKey="분" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
