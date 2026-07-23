import type { Workout } from '../../types'
import { WORKOUT_TYPES } from '../../lib/fitness'

// 운동 기록 목록 (타입 배지 + 날짜·시간·거리·칼로리) — 운동 페이지와 홈 공용.
// onRemove 를 주면 수동 기록에 삭제 버튼 표시 (운동 페이지 전용).

export default function WorkoutList({
  workouts,
  limit,
  onRemove,
}: {
  workouts: Workout[]
  limit?: number
  onRemove?: (w: Workout) => void
}) {
  const list = [...workouts]
    .sort((a, b) => (a.workoutdate < b.workoutdate ? 1 : -1))
    .slice(0, limit ?? workouts.length)

  if (list.length === 0) {
    return <p className="text-secondary" style={{ marginTop: 12 }}>아직 운동 기록이 없습니다.</p>
  }

  return (
    <ul className="workout-list">
      {list.map((w) => (
        <li key={w.id} className="workout-item">
          <div className="workout-type">{WORKOUT_TYPES[w.type] ?? w.type}</div>
          <div className="workout-info">
            <p className="workout-meta">
              {w.workoutdate} · {Math.round(w.duration / 60)}분
              {w.distance > 0 && ` · ${w.distance}km`}
              {w.calories > 0 && ` · ${w.calories}kcal`}
              {w.source === 'apple' && ' ·  Health'}
            </p>
            {(w.memo || w.title) && <p className="workout-memo">{w.memo || w.title}</p>}
          </div>
          {onRemove && w.source === 'manual' && (
            <button className="workout-delete" onClick={() => onRemove(w)} aria-label="기록 삭제">
              삭제
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
