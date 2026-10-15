import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { LiftCalendarDay } from '../../types'
import { fmtVolume, kg, monthKey, shiftMonth } from '../../lib/lift'
import { WORKOUT_TYPES } from '../../lib/fitness'
import Modal from '../common/Modal'
import { SkBlock } from '../common/Skeleton'
import Icon from '../common/Icon'

// 운동 캘린더 — 노션 운동일(부위) + Apple 운동 시간 + 걸음을 날짜로 합친 월 그리드 (월요일 시작).
// 셀 탭 → 그날 상세 모달.

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const PART_SHORT: Record<string, string> = { 가슴: '가슴', 등: '등', '어깨·팔': '어깨', 하체: '하체', 유산소: '유산소' }

export default function LiftCalendar({ className = '' }: { className?: string }) {
  const [month, setMonth] = useState(() => monthKey(new Date()))
  const [days, setDays] = useState<LiftCalendarDay[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<LiftCalendarDay | null>(null)

  useEffect(() => {
    let alive = true
    api
      .get(`/lift/calendar?month=${month}`)
      .then((res) => {
        if (!alive) return
        if (res.data.code === 'ok') {
          setDays(res.data.days ?? [])
          setFailed(false)
        } else setFailed(true)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [month])

  const [y, m] = month.split('-').map(Number)
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7 // 월요일=0
  const now = new Date()
  const today = `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}` // 로컬 날짜 (toISOString 은 UTC)
  const isCurrent = month === monthKey(new Date())
  const liftDays = (days ?? []).filter((d) => d.lift || d.exercises.length > 0).length

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">캘린더</h2>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="이전 달">
            <Icon name="chevron-left" />
          </button>
          <span className="cal-month">
            {y}년 {m}월
          </span>
          <button
            className="cal-nav-btn"
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={isCurrent}
            aria-label="다음 달"
          >
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>

      {failed ? (
        <p className="text-tertiary" style={{ marginTop: 12 }}>
          캘린더를 불러오지 못했습니다.
        </p>
      ) : !days ? (
        <SkBlock height={300} />
      ) : (
        <>
          <div className="cal-grid">
            {WEEK_LABELS.map((w) => (
              <div key={w} className="cal-weekday">
                {w}
              </div>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <div key={`e${i}`} />
            ))}
            {days.map((d) => {
              const parts = d.lift?.parts ?? [...new Set(d.exercises.map((e) => e.part))]
              const active = parts.length > 0
              return (
                <button
                  key={d.date}
                  className={`cal-cell${active ? ' active' : ''}${d.date === today ? ' today' : ''}`}
                  onClick={() => setSelected(d)}
                  disabled={d.date > today}
                >
                  <span className="cal-day">{Number(d.date.slice(8, 10))}</span>
                  <span className="cal-parts">
                    {parts.map((p) => (
                      <span key={p}>{PART_SHORT[p] ?? p}</span>
                    ))}
                  </span>
                  {d.apple.minutes > 0 && <span className="cal-min">{Math.round(d.apple.minutes)}분</span>}
                  {d.steps > 0 && <span className="cal-steps">{(d.steps / 1000).toFixed(1)}k</span>}
                </button>
              )
            })}
          </div>
          <p className="compare-note">
            이번 달 웨이트 {liftDays}일 · 파란 칸 = 노션 운동일 · 분 = Apple 운동 시간 · k = 걸음(천)
          </p>
        </>
      )}

      {selected && (
        <Modal title={dayTitle(selected)} onClose={() => setSelected(null)}>
          <DayDetail d={selected} />
        </Modal>
      )}
    </section>
  )
}

function dayTitle(d: LiftCalendarDay): string {
  const date = new Date(d.date + 'T00:00:00')
  const label = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEK_LABELS[(date.getDay() + 6) % 7]})`
  return d.lift?.title ? `${label} · ${d.lift.title}` : label
}

function DayDetail({ d }: { d: LiftCalendarDay }) {
  const empty = !d.lift && d.exercises.length === 0 && d.apple.sessions === 0 && d.steps === 0 && d.weight === 0
  if (empty) return <p className="text-secondary" style={{ marginTop: 12 }}>기록이 없는 날입니다.</p>

  return (
    <div className="day-detail">
      {d.lift && (d.lift.condition || d.lift.cardio) && (
        <p className="text-secondary" style={{ fontSize: 14 }}>
          {[d.lift.condition && `컨디션 ${d.lift.condition}`, d.lift.cardio && `유산소 ${d.lift.cardio}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {d.exercises.length > 0 && (
        <ul className="lift-session-list">
          {d.exercises.map((e) => (
            <li key={e.name + e.mainText} className="lift-session">
              <div className="lift-session-head">
                <span className="lift-session-date">{e.name}</span>
                <span className="lift-session-stat">
                  {e.part === '유산소'
                    ? cardioText(e)
                    : `${e.e1rm > 0 ? kg(e.e1rm) + ' · ' : ''}${fmtVolume(e.volume, e.e1rm === 0)}`}
                </span>
              </div>
              {e.mainText && <p className="lift-session-sets">{e.mainText}</p>}
              {e.warmupText && <p className="lift-session-sub">웜업 {e.warmupText}</p>}
              {e.memo && <p className="lift-session-sub">{e.memo}</p>}
            </li>
          ))}
        </ul>
      )}

      <ul className="kv-list">
        {d.apple.sessions > 0 && (
          <li>
            <span className="kv-key">Apple 운동</span>
            <span className="kv-value">
              {d.apple.types.map((t) => WORKOUT_TYPES[t] ?? t).join('·')} {Math.round(d.apple.minutes)}분 ·{' '}
              {Math.round(d.apple.calories)}kcal
            </span>
          </li>
        )}
        {d.steps > 0 && (
          <li>
            <span className="kv-key">걸음</span>
            <span className="kv-value">{Math.round(d.steps).toLocaleString()}</span>
          </li>
        )}
        {d.weight > 0 && (
          <li>
            <span className="kv-key">체중</span>
            <span className="kv-value">{kg(d.weight)}</span>
          </li>
        )}
      </ul>

      {d.lift?.notionUrl && (
        <a className="lift-link" href={d.lift.notionUrl} target="_blank" rel="noreferrer">
          노션에서 보기
        </a>
      )}
    </div>
  )
}

function cardioText(e: { minutes: number; speed: number; incline: number; distance: number }): string {
  const parts = [
    e.minutes > 0 && `${e.minutes}분`,
    e.speed > 0 && `${e.speed}km/h`,
    e.incline > 0 && `경사 ${e.incline}`,
    e.distance > 0 && `${e.distance}km`,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '—'
}
