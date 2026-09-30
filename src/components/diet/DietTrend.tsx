import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DietSummary } from '../../types'
import { fmtNum, signed } from '../../lib/diet'
import { shortDate } from '../../lib/lift'

// 주간 추이 — 최근 28일 일별 칼로리·단백질 막대(단일 액센트) + 목표선(중립 잉크 점선) + 주별 요약.
// 기록 안 한 날은 막대 없이 비워 둔다(0 과 구분).

const tooltipStyle = {
  borderRadius: 11,
  border: '1px solid var(--tooltip-border)',
  background: 'var(--tooltip-bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 13,
}

const axisTick = { fill: 'var(--ink-48)', fontSize: 12 }

export default function DietTrend({ summary, className = '' }: { summary: DietSummary; className?: string }) {
  const data = summary.days.map((d) => ({
    name: shortDate(d.date),
    kcal: d.logged ? Math.round(d.totals.kcal) : null,
    kcalTarget: d.target.kcal,
    protein: d.logged ? Math.round(d.totals.protein) : null,
    proteinTarget: d.target.protein,
  }))
  const logged = summary.days.filter((d) => d.logged).length
  const weeks = [...summary.weekly].reverse()

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">주간 추이</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          최근 {summary.days.length}일 · 기록 {logged}일
        </span>
      </div>

      {logged === 0 ? (
        <p className="text-tertiary" style={{ marginTop: 12 }}>
          아직 식단 기록이 없습니다.
        </p>
      ) : (
        <>
          <p className="diet-chart-label">칼로리 (선: 목표)</p>
          <div className="chart-box diet-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--track)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} minTickGap={14} />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} />
                <Tooltip
                  cursor={{ fill: 'var(--cursor-fill)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v, k) => [`${Number(v).toLocaleString()}kcal`, k === 'kcal' ? '섭취' : '목표']}
                />
                <Bar dataKey="kcal" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Line type="stepAfter" dataKey="kcalTarget" stroke="var(--ink-48)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <p className="diet-chart-label">단백질 (선: 목표)</p>
          <div className="chart-box diet-chart diet-chart-sm">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--track)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} minTickGap={14} />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} />
                <Tooltip
                  cursor={{ fill: 'var(--cursor-fill)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v, k) => [`${v}g`, k === 'protein' ? '단백질' : '목표']}
                />
                <Bar dataKey="protein" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Line type="stepAfter" dataKey="proteinTarget" stroke="var(--ink-48)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <ul className="diet-weeks">
            {weeks.map((w) => (
              <li key={w.weekStart} className="diet-week">
                <span className="diet-week-name">{shortDate(w.weekStart)} 주</span>
                {w.loggedDays === 0 || !w.avg ? (
                  <span className="text-tertiary">기록 없음</span>
                ) : (
                  <dl className="diet-week-stats">
                    <div>
                      <dt>기록</dt>
                      <dd>{w.loggedDays}일</dd>
                    </div>
                    <div>
                      <dt>평균</dt>
                      <dd>{Math.round(w.avg.kcal).toLocaleString()}kcal</dd>
                    </div>
                    <div>
                      <dt>단백질</dt>
                      <dd>
                        {fmtNum(w.avg.protein)}g · 달성 {w.proteinHitDays}일
                      </dd>
                    </div>
                    <div>
                      <dt>적자</dt>
                      <dd>{w.avgBalance == null ? '—' : signed(w.avgBalance, 'kcal')}</dd>
                    </div>
                    <div>
                      <dt>체중</dt>
                      <dd>
                        {w.avgWeight == null ? '—' : `${fmtNum(w.avgWeight)}kg`}
                        {w.weightDelta != null && ` (${signed(w.weightDelta, 'kg', 1)})`}
                      </dd>
                    </div>
                  </dl>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
