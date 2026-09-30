import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { DietDay, DietItem, DietSummary } from '../types'
import { mealByTime } from '../lib/diet'
import { localISO, shiftDay } from '../lib/lift'
import { SkBlock, SkLines } from '../components/common/Skeleton'
import DietToday from '../components/diet/DietToday'
import MealList from '../components/diet/MealList'
import DietTrend from '../components/diet/DietTrend'
import DietWeight from '../components/diet/DietWeight'
import AddSheet from '../components/diet/AddSheet'
import TargetsModal from '../components/diet/TargetsModal'

// 식단 — 노션 「식단 일지」 복제본(/api/diet/*). 입력은 노션에 먼저 쓰고 동기화 후 반영.
// 섹션: 날짜 · 목표 대비 · 끼니별 기록 · 주간 추이 · 체중과 함께.

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토']

function dateLabel(iso: string, today: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = DAY_LABEL[new Date(y, m - 1, d).getDay()]
  const rel = iso === today ? ' · 오늘' : iso === shiftDay(today, -1) ? ' · 어제' : ''
  return `${m}월 ${d}일 (${wd})${rel}`
}

export default function Diet() {
  const today = localISO(new Date())
  const [date, setDate] = useState(today)
  const [day, setDay] = useState<DietDay | null>(null)
  const [dayFailed, setDayFailed] = useState('')
  const [summary, setSummary] = useState<DietSummary | null>(null)
  const [sheet, setSheet] = useState<{ meal: string; item: DietItem | null } | null>(null)
  const [showTargets, setShowTargets] = useState(false)

  const loadDay = useCallback(() => {
    api
      .get('/diet/day', { params: { date } })
      .then((res) => {
        if (res.data.code === 'ok') {
          setDay(res.data as DietDay)
          setDayFailed('')
        } else setDayFailed(res.data.message || '불러오지 못했습니다.')
      })
      .catch(() => setDayFailed('불러오지 못했습니다.'))
  }, [date])

  const loadSummary = useCallback(() => {
    api
      .get('/diet/summary', { params: { days: 28 } })
      .then((res) => res.data.code === 'ok' && setSummary(res.data as DietSummary))
      .catch(() => {})
  }, [])

  useEffect(loadDay, [loadDay])
  useEffect(loadSummary, [loadSummary])

  function changed() {
    loadDay()
    loadSummary()
  }

  const shown = day && day.date === date ? day : null

  return (
    <div className="stack desktop-grid">
      <div className="page-head">
        <div>
          <h1 className="display-title">식단</h1>
          <div className="diet-date-nav">
            <button className="stepper-btn" onClick={() => setDate(shiftDay(date, -1))} aria-label="전날">
              ‹
            </button>
            <span className="diet-date-label">{dateLabel(date, today)}</span>
            <button className="stepper-btn" onClick={() => setDate(shiftDay(date, 1))} disabled={date >= today} aria-label="다음날">
              ›
            </button>
          </div>
        </div>
        <div className="page-actions">
          <button className="page-action page-action-secondary" onClick={() => setShowTargets(true)}>
            목표 설정
          </button>
          <button className="page-action" onClick={() => setSheet({ meal: mealByTime(), item: null })} disabled={!shown}>
            기록 추가
          </button>
        </div>
      </div>

      {!shown ? (
        dayFailed ? (
          <section className="card">
            <p className="text-tertiary">{dayFailed}</p>
          </section>
        ) : (
          <section className="card">
            <SkLines rows={2} />
            <SkBlock height={160} />
          </section>
        )
      ) : (
        <>
          <DietToday className="dg-4" day={shown} />
          <MealList
            className="dg-8"
            day={shown}
            onAdd={(meal) => setSheet({ meal, item: null })}
            onEdit={(meal, item) => setSheet({ meal, item })}
            onChanged={changed}
          />
        </>
      )}

      {summary ? (
        <>
          <DietTrend className="dg-6" summary={summary} />
          <DietWeight className="dg-6" summary={summary} />
        </>
      ) : (
        <section className="card">
          <SkBlock height={208} />
        </section>
      )}

      {sheet && shown && (
        <AddSheet
          day={shown}
          initialMeal={sheet.meal}
          editing={sheet.item}
          onClose={() => setSheet(null)}
          onSaved={() => {
            setSheet(null)
            changed()
          }}
        />
      )}
      {showTargets && (
        <TargetsModal
          onClose={() => setShowTargets(false)}
          onSaved={() => {
            setShowTargets(false)
            changed()
          }}
        />
      )}
    </div>
  )
}
