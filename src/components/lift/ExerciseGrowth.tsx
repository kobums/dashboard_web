import { useState } from 'react'
import type { LiftExerciseSummary } from '../../types'
import { deltaText, fmtVolume, kg, LIFT_PARTS, shortDate } from '../../lib/lift'
import ExerciseArt from './ExerciseArt'

// 종목별 성장 — 부위 세그먼트 + 종목 카드 그리드. 카드를 누르면 상세(onSelect).
// 증감은 ▲▼ + 중립 잉크 (DESIGN: 두 번째 액센트 금지), 수치 강조만 --accent.

export default function ExerciseGrowth({
  exercises,
  onSelect,
  className = '',
}: {
  exercises: LiftExerciseSummary[]
  onSelect: (name: string) => void
  className?: string
}) {
  const [part, setPart] = useState<string>('전체')
  const parts = ['전체', ...LIFT_PARTS.filter((p) => exercises.some((e) => e.part === p))]
  const list = part === '전체' ? exercises : exercises.filter((e) => e.part === part)

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">종목별 성장</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          추정 1RM(Epley) 기준
        </span>
      </div>

      {exercises.length === 0 ? (
        <p className="text-secondary" style={{ marginTop: 12 }}>
          아직 동기화된 근력 기록이 없습니다.
        </p>
      ) : (
        <>
          <div className="year-chips">
            {parts.map((p) => (
              <button key={p} className={`year-chip${p === part ? ' active' : ''}`} onClick={() => setPart(p)}>
                {p}
              </button>
            ))}
          </div>

          <div className="lift-grid">
            {list.map((e) => (
              <ExerciseCard key={e.name} ex={e} onClick={() => onSelect(e.name)} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function ExerciseCard({ ex, onClick }: { ex: LiftExerciseSummary; onClick: () => void }) {
  const bw = ex.bodyweight
  const headline = bw ? `${ex.last.topReps}회` : kg(ex.last.e1rm)
  const delta = deltaText(ex.deltaE1rm, bw ? '회' : 'kg')
  const volDelta = ex.deltaVolumePct == null ? null : deltaText(ex.deltaVolumePct, '%')

  return (
    <button className="lift-card" onClick={onClick}>
      <div className="lift-card-head">
        <span className="lift-card-name">{ex.name}</span>
        <span className="lift-tag">{ex.part}</span>
      </div>

      <div className="lift-card-main">
        <span className="lift-card-value">{headline}</span>
        <span className="lift-card-unit">{bw ? '최다 횟수' : 'e1RM'}</span>
        {delta && <span className="lift-delta">{delta}</span>}
        <ExerciseArt name={ex.name} size="sm" />
      </div>

      <p className="lift-card-sets">{ex.last.mainText || '—'}</p>

      <ul className="lift-card-meta">
        <li>
          <span>볼륨</span>
          <span>
            {fmtVolume(ex.last.volume, bw)}
            {volDelta && <em> {volDelta}</em>}
          </span>
        </li>
        <li>
          <span>최고</span>
          <span>
            {bw ? `${ex.best.reps}회` : kg(ex.best.e1rm)} · {shortDate(ex.best.date)}
          </span>
        </li>
        {ex.lastAchievement && (
          <li>
            <span>목표 달성</span>
            <span>
              {ex.lastAchievement.hit}/{ex.lastAchievement.total}세트
              {ex.lastAchievement.hit >= ex.lastAchievement.total && ' ✓'}
            </span>
          </li>
        )}
        <li>
          <span>다음 목표</span>
          <span className={ex.nextTarget ? 'lift-target' : 'text-tertiary'}>{ex.nextTarget || '없음'}</span>
        </li>
      </ul>

      <p className="lift-card-foot">
        {ex.sessions}회차 · 마지막 {shortDate(ex.lastDate)}
      </p>
    </button>
  )
}
