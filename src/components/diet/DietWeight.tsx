import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DietSummary } from '../../types'
import { fmtNum, signed } from '../../lib/diet'
import { shortDate } from '../../lib/lift'

// 체중과 함께 — 주 평균 적자(막대, 왼쪽 축) vs 주 평균 체중(선, 오른쪽 축).
// 노션 계획: 하루 약 700kcal 적자 → 주 0.6~0.8kg 감량. 실제 페이스를 한 줄로 읽어 준다.

const tooltipStyle = {
  borderRadius: 11,
  border: '1px solid var(--tooltip-border)',
  background: 'var(--tooltip-bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 13,
}

const axisTick = { fill: 'var(--ink-48)', fontSize: 12 }

const PLAN_MIN = 0.6
const PLAN_MAX = 0.8

function reading(summary: DietSummary): string {
  const withBal = summary.weekly.filter((w) => w.avgBalance != null)
  const withW = summary.weekly.filter((w) => w.avgWeight != null)
  const parts: string[] = []
  if (withBal.length) {
    const avg = withBal.reduce((s, w) => s + (w.avgBalance ?? 0), 0) / withBal.length
    parts.push(`주 평균 ${signed(avg, 'kcal')} ${avg <= 0 ? '적자' : '흑자'}`)
  }
  if (withW.length >= 2) {
    const first = withW[0].avgWeight ?? 0
    const last = withW[withW.length - 1].avgWeight ?? 0
    const perWeek = (last - first) / (withW.length - 1)
    const loss = -perWeek
    const pace =
      loss >= PLAN_MIN && loss <= PLAN_MAX
        ? '계획 페이스'
        : loss > PLAN_MAX
          ? '계획보다 빠름 — 탄수화물 조금 늘리기 검토'
          : loss > 0
            ? '계획보다 느림 — 탄수화물 30g 줄이기 검토'
            : '감량 정체 — 섭취 기록 점검'
    parts.push(`체중 ${signed(perWeek, 'kg', 1)}/주 · ${pace} (계획 ${PLAN_MIN}~${PLAN_MAX}kg)`)
  } else if (withW.length === 1) {
    parts.push('체중은 2주 이상 쌓이면 주간 변화를 보여줘요')
  }
  return parts.join(' · ')
}

export default function DietWeight({ summary, className = '' }: { summary: DietSummary; className?: string }) {
  const data = summary.weekly.map((w) => ({
    name: shortDate(w.weekStart),
    balance: w.avgBalance == null ? null : Math.round(w.avgBalance),
    weight: w.avgWeight,
  }))
  const hasData = data.some((d) => d.balance != null || d.weight != null)
  // 적자 축: 0 을 포함하고 250kcal 간격 눈금 (recharts 자동 눈금은 −550/−350 처럼 어긋남)
  const bals = data.map((d) => d.balance).filter((v): v is number => v != null)
  const balMin = Math.min(0, Math.floor(Math.min(0, ...bals) / 250) * 250)
  const balMax = Math.max(0, Math.ceil(Math.max(0, ...bals) / 250) * 250)
  const balTicks: number[] = []
  for (let v = balMin; v <= balMax; v += 250) balTicks.push(v)

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">체중과 함께</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          추정 소모 = 기초대사 {summary.bmr.toLocaleString()} + 활동 + 소화(10%)
        </span>
      </div>

      {!hasData ? (
        <p className="text-tertiary" style={{ marginTop: 12 }}>
          식단과 체중 기록이 쌓이면 주간 적자와 체중 변화를 겹쳐 보여줘요.
        </p>
      ) : (
        <>
          <p className="lift-insight">{reading(summary) || '데이터를 모으는 중입니다.'}</p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: -8, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--track)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
                {/* 막대가 0 에서 시작하도록 0 을 항상 포함 (적자 −201 이 −150 기준에서 거의 안 보이던 문제) */}
                <YAxis
                  yAxisId="b"
                  domain={[balMin, balMax]}
                  ticks={balTicks}
                  tickLine={false}
                  axisLine={false}
                  tick={axisTick}
                />
                <YAxis yAxisId="w" orientation="right" domain={['auto', 'auto']} tickLine={false} axisLine={false} tick={axisTick} />
                <ReferenceLine yAxisId="b" y={0} stroke="var(--ink-48)" />
                <Tooltip
                  cursor={{ fill: 'var(--cursor-fill)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v, k) =>
                    k === 'balance' ? [signed(Number(v), 'kcal'), '평균 적자/흑자'] : [`${fmtNum(Number(v))}kg`, '평균 체중']
                  }
                />
                <Bar yAxisId="b" dataKey="balance" fill="var(--accent)" fillOpacity={0.35} radius={[4, 4, 4, 4]} maxBarSize={28} />
                <Line yAxisId="w" type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="lift-legend">
            <span className="diet-legend-bar" /> 주 평균 적자 (왼쪽, 음수 = 적자)
            <span className="lift-legend-line" /> 주 평균 체중 (오른쪽)
          </p>
        </>
      )}
    </section>
  )
}
