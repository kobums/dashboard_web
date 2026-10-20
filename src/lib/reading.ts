import type { CalendarDay, ReadingDay } from '../types'
import type { HeatDay } from '../components/common/Heatmap'
import { fmtDate } from './fitness'

// 독서 일별 데이터 가공 — 잔디·일별/주별 차트용.

// 최초 기록일 ~ 오늘을 하루 단위로 채운 잔디 데이터 (농도 = 읽은 페이지).
// 타이머 없이 진행률만 올린 날은 분·세션이 0 이라 페이지 기준이어야 「읽은 날」이 다 잡힌다.
export function buildReadingHeatDays(days: ReadingDay[]): HeatDay[] {
  if (days.length === 0) return []
  const map = new Map(days.map((d) => [d.date, d]))
  const out: HeatDay[] = []
  const start = new Date(days[0].date + 'T00:00:00')
  const today = new Date()
  for (let d = start; d <= today; d = new Date(d.getTime() + 86400000)) {
    const key = fmtDate(d)
    const day = map.get(key)
    out.push({
      date: key,
      total: day?.pages ?? 0,
      tooltip: day ? readingTooltip(day) : `${key} · 독서 없음`,
    })
  }
  return out
}

function readingTooltip(day: ReadingDay): string {
  const parts = [day.date, `${day.pages}p`]
  if (day.sessions > 0) parts.push(`${day.minutes}분`, `${day.sessions}세션`)
  return parts.join(' · ')
}

// 개발 캘린더 → 잔디 데이터 (기존 GitHub/GitLab 툴팁 형식)
export function buildDevHeatDays(calendar: CalendarDay[]): HeatDay[] {
  return calendar.map((day) => {
    const parts = [day.date]
    if (day.github) parts.push(`GitHub ${day.github}`)
    if (day.gitlab) parts.push(`GitLab ${day.gitlab}`)
    if (!day.github && !day.gitlab) parts.push('활동 없음')
    return { date: day.date, total: day.total, tooltip: parts.join(' · ') }
  })
}

// 최근 N일 일별 읽은 페이지
export function buildReadingDaily(days: ReadingDay[], n = 14) {
  const map = new Map(days.map((d) => [d.date, d.pages]))
  const today = new Date()
  const out: { name: string; 페이지: number }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    out.push({ name: `${d.getMonth() + 1}/${d.getDate()}`, 페이지: map.get(fmtDate(d)) ?? 0 })
  }
  return out
}

// 최근 8주 주별 읽은 페이지 (weekStart = 이번 주 일요일)
export function buildReadingWeekly(days: ReadingDay[], weekStart: Date) {
  const out: { name: string; 페이지: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date(weekStart.getTime() - i * 7 * 86400000)
    const end = new Date(start.getTime() + 6 * 86400000)
    const s = fmtDate(start)
    const e = fmtDate(end)
    const pages = days.filter((d) => d.date >= s && d.date <= e).reduce((sum, d) => sum + d.pages, 0)
    out.push({ name: `${start.getMonth() + 1}/${start.getDate()}`, 페이지: pages })
  }
  return out
}
