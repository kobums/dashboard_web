import type { HeatDay } from '../components/common/Heatmap'
import type { LiftDailyRow, LiftSet, LiftWeek } from '../types'

// 웨이트(노션 운동 기록) 공용 헬퍼 — /api/lift/* 응답 표시용.

// 4분할 부위 — 주간 체크리스트·부위 필터 순서
export const LIFT_PARTS = ['가슴', '등', '어깨·팔', '하체'] as const

// 부위별 주간 본세트 권장 범위 (근비대 기준으로 흔히 쓰는 값 — 참고선)
export const WEEKLY_SET_GUIDE = { min: 10, max: 20 }

export const shortDate = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`

export const kg = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}kg`

export function fmtVolume(v: number, bodyweight = false): string {
  if (bodyweight) return `${Math.round(v)}회`
  return v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)}kg`
}

// 세트 배열을 짧은 문자열로 — 같은 무게는 묶는다: 50×15,11,10 / 60×4,4
export function fmtSets(sets: LiftSet[]): string {
  const groups: { w: string; reps: number[] }[] = []
  for (const s of sets) {
    const w = s.bodyweight ? 'BW' : String(s.weight)
    const last = groups[groups.length - 1]
    if (last && last.w === w) last.reps.push(s.reps)
    else groups.push({ w, reps: [s.reps] })
  }
  return groups.map((g) => `${g.w}×${g.reps.join(',')}`).join(' / ')
}

export function deltaText(v: number | null, unit = ''): string | null {
  if (v == null || v === 0) return v === 0 ? '동일' : null
  const abs = Math.abs(v)
  return `${v > 0 ? '▲' : '▼'}${Number.isInteger(abs) ? abs : abs.toFixed(1)}${unit}`
}

// "2026-09-29 12:00:00" → "N분 전" (서버는 Asia/Seoul 로컬 시각)
export function timeAgo(stamp: string): string {
  if (!stamp) return ''
  const t = new Date(stamp.replace(' ', 'T'))
  if (Number.isNaN(t.getTime())) return stamp
  const min = Math.round((Date.now() - t.getTime()) / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.round(h / 24)}일 전`
}

// 이번 주부터 거꾸로, 4분할을 모두 채운 연속 주 수. 이번 주가 아직 미완이면 지난주부터 센다.
export function fullSplitStreak(weekly: LiftWeek[]): number {
  const full = (w: LiftWeek) => LIFT_PARTS.every((p) => w.splitDone.includes(p))
  let i = weekly.length - 1
  if (i >= 0 && !full(weekly[i])) i--
  let n = 0
  for (; i >= 0 && full(weekly[i]); i--) n++
  return n
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

// ---- 입력 시트 (대시보드 → 노션) ----

export const CARDIO_PART = '유산소'

const trimW = (w: number) => String(Number(w.toFixed(2)))

// 서버 파서가 읽는 세트 표기로 직렬화 — 같은 무게 연속은 묶고, 횟수가 같으면 W×R×N.
// [50×15,50×11,50×10,60×4,60×4] → "50×15,11,10 / 60×4×2", 맨몸은 BW
export function serializeSets(sets: LiftSet[]): string {
  const groups: { w: string; reps: number[] }[] = []
  for (const s of sets) {
    const w = s.bodyweight ? 'BW' : trimW(s.weight)
    const last = groups[groups.length - 1]
    if (last && last.w === w) last.reps.push(s.reps)
    else groups.push({ w, reps: [s.reps] })
  }
  return groups
    .map(({ w, reps }) =>
      reps.every((r) => r === reps[0])
        ? `${w}×${reps[0]}${reps.length > 1 ? `×${reps.length}` : ''}`
        : `${w}×${reps.join(',')}`,
    )
    .join(' / ')
}

// Epley 추정 1RM — 본세트 최댓값 (맨몸 세트 제외)
export function bestE1rm(sets: LiftSet[]): number {
  let best = 0
  for (const s of sets) {
    if (s.bodyweight) continue
    const e = s.reps <= 1 ? s.weight : s.weight * (1 + s.reps / 30)
    if (e > best) best = e
  }
  return Math.round(best * 10) / 10
}

export const maxReps = (sets: LiftSet[]) => sets.reduce((m, s) => Math.max(m, s.reps), 0)

// 목표 세트 각각을 채운 본세트가 있는지 1:1 로 맞춘다 (서버 achievement 와 같은 규칙)
export function goalMet(goal: LiftSet[], main: LiftSet[]): boolean {
  if (goal.length === 0) return false
  const used = main.map(() => false)
  return goal.every((g) => {
    const i = main.findIndex((s, j) => !used[j] && (g.bodyweight || s.weight >= g.weight) && s.reps >= g.reps)
    if (i < 0) return false
    used[i] = true
    return true
  })
}

// 목표를 다 채웠을 때 다음 목표 — 무게 +2.5kg (맨몸은 +1회)
export const bumpGoal = (goal: LiftSet[]): LiftSet[] =>
  goal.map((g) => (g.bodyweight ? { ...g, reps: g.reps + 1 } : { ...g, weight: g.weight + 2.5 }))

export function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function shiftDay(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return localISO(new Date(y, m - 1, d + delta))
}

export function cardioText(v: { minutes: number; speed: number; incline: number; distance: number }): string {
  const parts: string[] = []
  if (v.minutes) parts.push(`${v.minutes}분`)
  if (v.speed) parts.push(`${v.speed}km/h`)
  if (v.incline) parts.push(`경사 ${v.incline}`)
  if (v.distance) parts.push(`${v.distance}km`)
  return parts.join(' · ')
}

// 첫 기록일 ~ 오늘을 하루 단위로 채운 웨이트 잔디 (농도 = 본세트 수).
// 세트가 없는 날(유산소만·캘린더만)도 운동한 날이라 가장 옅은 칸으로 보인다.
export function buildLiftHeatDays(days: LiftDailyRow[]): HeatDay[] {
  if (days.length === 0) return []
  const map = new Map(days.map((d) => [d.date, d]))
  const out: HeatDay[] = []
  const today = localISO(new Date())
  for (let key = days[0].date; key <= today; key = shiftDay(key, 1)) {
    const day = map.get(key)
    if (!day) {
      out.push({ date: key, total: 0, tooltip: `${key} · 쉼` })
      continue
    }
    const parts = [key]
    if (day.parts.length) parts.push(day.parts.join('·'))
    if (day.sets > 0) parts.push(`${day.sets}세트`)
    if (day.volume > 0) parts.push(`${Math.round(day.volume).toLocaleString()}kg`)
    if (day.sets === 0 && day.exercises > 0) parts.push(`${day.exercises}종목`)
    out.push({ date: key, total: Math.max(day.sets, 1), tooltip: parts.join(' · ') })
  }
  return out
}
