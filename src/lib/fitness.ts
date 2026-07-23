import type { Workout } from '../types'

export const WORKOUT_TYPES: Record<string, string> = {
  weight: '헬스',
  running: '러닝',
  cycling: '사이클',
  swimming: '수영',
  walking: '걷기',
  hiking: '등산',
  etc: '기타',
}

export const fmtDate = (d: Date) => d.toISOString().slice(0, 10)

// 최근 8주 주별 운동 시간(분) 집계 — 운동 페이지와 홈(데스크톱) 공용.
// weekStart: 이번 주 일요일 00:00 기준.
export function buildWeeklyMinutes(workouts: Workout[], weekStart: Date) {
  const weeks: { name: string; 분: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date(weekStart.getTime() - i * 7 * 86400000)
    const end = new Date(start.getTime() + 6 * 86400000)
    const minutes = Math.round(
      workouts
        .filter((w) => w.workoutdate >= fmtDate(start) && w.workoutdate <= fmtDate(end))
        .reduce((s, w) => s + w.duration, 0) / 60,
    )
    weeks.push({ name: `${start.getMonth() + 1}/${start.getDate()}`, 분: minutes })
  }
  return weeks
}

export function thisWeekStart(today: Date): Date {
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay())
  return start
}
