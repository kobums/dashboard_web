import { useState } from 'react'
import { api } from '../../lib/api'
import type { DietDay, DietItem } from '../../types'
import { fmtNum, kcalText, pfc } from '../../lib/diet'
import { shiftDay } from '../../lib/lift'
import Icon from '../common/Icon'

// 끼니별 기록 — 5끼니 고정 순서. 항목 탭 → 수정, 삭제는 시트 안 확인(브라우저 dialog 금지).
// 빈 끼니는 「어제 이 끼니 복사」로 같은 메뉴를 한 번에 넣을 수 있다.

// 음식 행은 노션 「식단 기록」 표 행이라 수정·삭제 가능. 「합계 보정」·끼니 메모 폴백 행(id 「페이지id#순번」)만 읽기 전용
const isNotionDayItem = (it: DietItem) => it.id.includes('#')
// 「합계 보정」 — 하루 합계에서 끼니별로 적힌 음식을 뺀 나머지 (끼니를 알 수 없어 간식 칸에 들어 있다)
const isAdjustItem = (it: DietItem) => isNotionDayItem(it) && it.food === '합계 보정'
// 노션 끼니 칸에만 적고 칼로리를 안 적은 끼니 — 0kcal 가 아니라 「모름」
const isUncounted = (it: DietItem) =>
  isNotionDayItem(it) && !isAdjustItem(it) && it.kcal === 0 && it.protein === 0 && it.carbs === 0 && it.fat === 0
const sumMacros = (items: DietItem[]) =>
  items.reduce(
    (t, it) => ({ kcal: t.kcal + it.kcal, protein: t.protein + it.protein, carbs: t.carbs + it.carbs, fat: t.fat + it.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )

export default function MealList({
  day,
  onAdd,
  onEdit,
  onChanged,
  className = '',
}: {
  day: DietDay
  onAdd: (meal: string) => void
  onEdit: (meal: string, item: DietItem) => void
  onChanged: () => void
  className?: string
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function remove(item: DietItem) {
    setBusy(item.id)
    setMessage('')
    try {
      const res = await api.post('/diet/log/delete', { id: item.id })
      if (res.data.code !== 'ok') setMessage(res.data.message || '삭제하지 못했습니다.')
      else setMessage(`${item.food} 삭제됨 (노션 휴지통에서 복구 가능)`)
      setConfirmId(null)
      onChanged()
    } catch {
      setMessage('삭제하지 못했습니다. 연결을 확인하세요.')
    } finally {
      setBusy(null)
    }
  }

  async function copyYesterday(meal: string) {
    setBusy(`copy:${meal}`)
    setMessage('')
    try {
      const res = await api.post('/diet/copy', { from: shiftDay(day.date, -1), to: day.date, meal })
      if (res.data.code !== 'ok') setMessage(res.data.message || '복사하지 못했습니다.')
      else if (!res.data.count) setMessage(`어제 ${meal} 기록이 없습니다.`)
      else setMessage(`어제 ${meal} ${res.data.count}개를 복사했습니다.`)
      onChanged()
    } catch {
      setMessage('복사하지 못했습니다. 연결을 확인하세요.')
    } finally {
      setBusy(null)
    }
  }

  // 보정 행은 간식이 아니라 끼니 목록 위에 따로 — 끼니 칸에만 적은 날엔 하루 합계 대부분이 여기 있다
  const adjust = day.meals.flatMap((m) => m.items.filter(isAdjustItem))
  const adjustTotal = sumMacros(adjust)
  const hasUncounted = day.meals.some((m) => m.items.some(isUncounted))
  const meals = day.meals.map((m) => {
    const items = m.items.filter((it) => !isAdjustItem(it))
    return { meal: m.meal, items, totals: sumMacros(items), uncounted: items.length > 0 && items.every(isUncounted) }
  })

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">끼니별 기록</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          {meals.reduce((n, m) => n + m.items.length, 0)}개 · {kcalText(day.totals.kcal)}
        </span>
      </div>
      {message && <p className="log-notice">{message}</p>}

      {adjust.length > 0 && (
        <div className="diet-unassigned">
          <div className="diet-unassigned-head">
            <span>{hasUncounted && adjustTotal.kcal > 0 ? '끼니 구분 없는 칼로리' : '합계 보정'}</span>
            <span>{kcalText(adjustTotal.kcal)}</span>
          </div>
          <p className="diet-item-sub">
            {pfc(adjustTotal)} ·{' '}
            {hasUncounted && adjustTotal.kcal > 0
              ? '노션에 끼니별 칼로리 없이 하루 합계만 있어 끼니로 나누지 못한 몫'
              : '노션 하루 합계와 끼니별 기록의 차이'}
          </p>
        </div>
      )}

      <div className="diet-meals">
        {meals.map((m) => (
          <div key={m.meal} className="diet-meal">
            <div className="diet-meal-head">
              <span className="diet-meal-name">{m.meal}</span>
              {m.items.length > 0 && (
                <span className="diet-meal-total">
                  {m.uncounted ? '칼로리 미기록' : `${kcalText(m.totals.kcal)} · 단 ${fmtNum(m.totals.protein)}g`}
                </span>
              )}
              <button className="diet-add-btn" onClick={() => onAdd(m.meal)} aria-label={`${m.meal} 추가`}>
                <Icon name="plus" />
              </button>
            </div>

            {m.items.length === 0 ? (
              <button
                className="text-button diet-copy"
                onClick={() => copyYesterday(m.meal)}
                disabled={busy === `copy:${m.meal}`}
              >
                {busy === `copy:${m.meal}` ? '복사 중…' : '어제 이 끼니 복사'}
              </button>
            ) : (
              <ul className="diet-items">
                {m.items.map((it) =>
                  confirmId === it.id ? (
                    <li key={it.id} className="diet-item diet-confirm">
                      <span>{it.food} 삭제할까요?</span>
                      <div className="log-footer-buttons">
                        <button className="log-secondary" onClick={() => setConfirmId(null)} disabled={busy === it.id}>
                          취소
                        </button>
                        <button className="form-submit log-danger" onClick={() => remove(it)} disabled={busy === it.id}>
                          {busy === it.id ? '삭제 중…' : '삭제'}
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={it.id} className="diet-item">
                      <button
                        className="diet-item-main"
                        onClick={() => onEdit(m.meal, it)}
                        disabled={isNotionDayItem(it)}
                        title={isNotionDayItem(it) ? '노션 「식단 기록」 끼니 칸에서 온 항목 — 노션에서 수정' : undefined}
                      >
                        <span className="diet-item-name">
                          {it.food}
                          {it.grams > 0 && <span className="diet-item-grams"> {fmtNum(it.grams)}g</span>}
                        </span>
                        <span className="diet-item-sub">
                          {isUncounted(it) ? '칼로리 미기록 — 노션 끼니 칸에 음식만 적힘' : `${kcalText(it.kcal)} · ${pfc(it)}`}
                        </span>
                      </button>
                      {!isNotionDayItem(it) && (
                        <button className="diet-item-del" onClick={() => setConfirmId(it.id)} aria-label={`${it.food} 삭제`}>
                          <Icon name="close" />
                        </button>
                      )}
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
