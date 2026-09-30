import type { Macros } from '../types'

// 식단 유틸 — 끼니 순서, 시간대별 기본 끼니, 영양소 스케일·포맷.

export const MEALS = ['아침', '점심', '운동 전', '저녁', '간식'] as const

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

// 지금 시각으로 기본 끼니 추정 (저녁 운동 기준 하루 흐름)
export function mealByTime(now = new Date()): string {
  const m = now.getHours() * 60 + now.getMinutes()
  if (m < 10 * 60 + 30) return '아침'
  if (m < 14 * 60 + 30) return '점심'
  if (m < 18 * 60 + 30) return '운동 전'
  if (m < 21 * 60 + 30) return '저녁'
  return '간식'
}

const r1 = (v: number) => Math.round(v * 10) / 10

// 기준량(basisGrams) 당 값 → 먹은 양(grams) 기준
export function scaleMacros(per: Macros, basisGrams: number, grams: number): Macros {
  const f = basisGrams > 0 ? grams / basisGrams : 0
  return { kcal: r1(per.kcal * f), protein: r1(per.protein * f), carbs: r1(per.carbs * f), fat: r1(per.fat * f) }
}

export const fmtNum = (v: number) => (Number.isInteger(r1(v)) ? String(r1(v)) : r1(v).toFixed(1))

export const pfc = (m: Macros) => `단 ${fmtNum(m.protein)} · 탄 ${fmtNum(m.carbs)} · 지 ${fmtNum(m.fat)}`

export const kcalText = (v: number) => `${Math.round(v).toLocaleString()}kcal`

// "+120kcal 초과" / "380kcal 남음"
export function remainText(value: number, target: number, unit: string): string {
  const diff = Math.round(target - value)
  if (target <= 0) return ''
  if (diff < 0) return `+${Math.abs(diff).toLocaleString()}${unit} 초과`
  return `${diff.toLocaleString()}${unit} 남음`
}

export function signed(v: number, unit: string, digits = 0): string {
  const p = 10 ** digits
  const r = Math.round(v * p) / p
  if (r === 0) return `±0${unit}`
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toLocaleString()}${unit}`
}

export const DAY_TYPE_LABEL = { training: '운동일', rest: '휴식일' } as const
