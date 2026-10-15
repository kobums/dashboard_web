import type { LiftCalendarDay, Workout } from '../types'

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

// 최근 N일 일별 운동 시간(분) — 운동 페이지 일별 차트용.
export function buildDailyMinutes(workouts: Workout[], days = 14) {
  const today = new Date()
  const out: { name: string; 분: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const key = fmtDate(d)
    const minutes = Math.round(
      workouts.filter((w) => w.workoutdate === key).reduce((s, w) => s + w.duration, 0) / 60,
    )
    out.push({ name: `${d.getMonth() + 1}/${d.getDate()}`, 분: minutes })
  }
  return out
}

export function thisWeekStart(today: Date): Date {
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay())
  return start
}

// 노션 운동 일지(웨이트 탭) → 운동 목록 행. 홈 「최근 운동 기록」에서 Apple 기록과 합칠 때 쓴다.
// 근력 종목은 하루 1행(웨이트 · 부위 · 종목 수), 유산소 행(주짓수·러닝·축구·풋살 등)은 종목마다 1행.
// id 는 Apple 기록과 겹치지 않게 음수.
export function liftDaysToWorkouts(days: LiftCalendarDay[]): Workout[] {
  const out: Workout[] = []
  for (const day of days) {
    const strength = day.exercises.filter((e) => e.part !== '유산소')
    if (strength.length > 0) {
      const parts = [...new Set(strength.map((e) => e.part).filter(Boolean))]
      out.push({
        id: -(out.length + 1),
        type: '웨이트',
        title: '',
        workoutdate: day.date,
        starttime: '',
        duration: 0,
        calories: 0,
        distance: 0,
        memo: `${parts.join('·')} · ${strength.length}종목`,
        source: 'notion',
      })
    }
    for (const e of day.exercises.filter((x) => x.part === '유산소')) {
      out.push({
        id: -(out.length + 1),
        type: e.name,
        title: '',
        workoutdate: day.date,
        starttime: '',
        duration: Math.round(e.minutes * 60),
        calories: 0,
        distance: e.distance,
        memo: e.memo,
        source: 'notion',
      })
    }
  }
  return out
}
