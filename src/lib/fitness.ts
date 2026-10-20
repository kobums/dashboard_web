import type { HeatDay } from '../components/common/Heatmap'
import type { FitnessDay, LiftCalendarDay, Workout } from '../types'

export const WORKOUT_TYPES: Record<string, string> = {
  weight: '헬스',
  running: '러닝',
  cycling: '사이클',
  swimming: '수영',
  walking: '걷기',
  hiking: '등산',
  etc: '기타',
}

// 로컬(한국) 날짜 YYYY-MM-DD. toISOString 은 UTC 라 오전 9시 전엔 하루 전 날짜가 나와
// 아침에 폰으로 열면 오늘 기록이 빠지고 이번 주 범위가 하루 어긋났다.
export const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
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

// 웨이트만 노션에 적고 Apple 운동이 없는 날 — 운동 시간을 모르니 잔디에선 중간 농도로 보이게 이만큼으로 친다.
export const LIFT_ONLY_MINUTES = 45

// 첫 기록일 ~ 오늘을 하루 단위로 채운 운동 잔디 (농도 = 운동 분)
export function buildFitnessHeatDays(days: FitnessDay[]): HeatDay[] {
  if (days.length === 0) return []
  const map = new Map(days.map((d) => [d.date, d]))
  const out: HeatDay[] = []
  const [y, m, dd] = days[0].date.split('-').map(Number)
  const today = fmtDate(new Date())
  for (let d = new Date(y, m - 1, dd); fmtDate(d) <= today; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const key = fmtDate(d)
    const day = map.get(key)
    if (!day) {
      out.push({ date: key, total: 0, tooltip: `${key} · 운동 없음` })
      continue
    }
    const parts = [key]
    if (day.count > 0) {
      const types = day.types
        .split(',')
        .filter(Boolean)
        .map((t) => WORKOUT_TYPES[t] ?? t)
      parts.push(`${day.minutes}분`, `${day.count}회${types.length ? ` (${types.join('·')})` : ''}`)
    }
    if (day.lift) parts.push('웨이트')
    out.push({
      date: key,
      total: day.minutes > 0 ? day.minutes : day.lift ? LIFT_ONLY_MINUTES : 0,
      tooltip: parts.join(' · '),
    })
  }
  return out
}
