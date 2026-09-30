import type { DietDay, Macros } from '../../types'
import ActivityRing from '../common/ActivityRing'
import { DAY_TYPE_LABEL, fmtNum, kcalText, remainText } from '../../lib/diet'

// 오늘 목표 대비 — 칼로리 링 + 단백질/탄수화물/지방 막대. 전부 단일 액센트,
// 초과는 색이 아니라 "+120kcal 초과" 라벨로 표시(DESIGN: 두 번째 액센트 금지).

const BARS: { key: keyof Macros; label: string }[] = [
  { key: 'protein', label: '단백질' },
  { key: 'carbs', label: '탄수화물' },
  { key: 'fat', label: '지방' },
]

export default function DietToday({ day, className = '' }: { day: DietDay; className?: string }) {
  const { totals, targets } = day
  const kcalProgress = targets.kcal > 0 ? totals.kcal / targets.kcal : 0

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">목표 대비</h2>
        <span className="diet-daytype" title={day.dayTypeReason}>
          {DAY_TYPE_LABEL[day.dayType]} · {day.dayTypeReason}
        </span>
      </div>

      <div className="diet-today">
        <ActivityRing progress={kcalProgress} color="var(--accent)" size={148} strokeWidth={14}>
          <div className="ring-center">
            <span className="ring-value large">{Math.round(totals.kcal).toLocaleString()}</span>
            <span className="ring-sub">/ {kcalText(targets.kcal)}</span>
          </div>
        </ActivityRing>

        <div className="diet-bars">
          <p className="diet-remain">{remainText(totals.kcal, targets.kcal, 'kcal')}</p>
          {BARS.map(({ key, label }) => {
            const v = totals[key]
            const t = targets[key]
            const pct = t > 0 ? Math.min(v / t, 1) * 100 : 0
            return (
              <div key={key} className="diet-bar">
                <div className="diet-bar-head">
                  <span>{label}</span>
                  <span>
                    <strong>{fmtNum(v)}</strong> / {fmtNum(t)}g
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="diet-bar-note">{remainText(v, t, 'g')}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
