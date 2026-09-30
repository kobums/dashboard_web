import { useState } from 'react'
import { api } from '../../lib/api'
import type { DietDay, DietItem } from '../../types'
import { fmtNum, kcalText, pfc } from '../../lib/diet'
import { shiftDay } from '../../lib/lift'

// 끼니별 기록 — 5끼니 고정 순서. 항목 탭 → 수정, 삭제는 시트 안 확인(브라우저 dialog 금지).
// 빈 끼니는 「어제 이 끼니 복사」로 같은 메뉴를 한 번에 넣을 수 있다.

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

  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">끼니별 기록</h2>
        <span className="text-secondary" style={{ fontSize: 14 }}>
          {day.meals.reduce((n, m) => n + m.items.length, 0)}개 · {kcalText(day.totals.kcal)}
        </span>
      </div>
      {message && <p className="log-notice">{message}</p>}

      <div className="diet-meals">
        {day.meals.map((m) => (
          <div key={m.meal} className="diet-meal">
            <div className="diet-meal-head">
              <span className="diet-meal-name">{m.meal}</span>
              {m.items.length > 0 && (
                <span className="diet-meal-total">
                  {kcalText(m.totals.kcal)} · 단 {fmtNum(m.totals.protein)}g
                </span>
              )}
              <button className="diet-add-btn" onClick={() => onAdd(m.meal)} aria-label={`${m.meal} 추가`}>
                +
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
                      <button className="diet-item-main" onClick={() => onEdit(m.meal, it)}>
                        <span className="diet-item-name">
                          {it.food}
                          {it.grams > 0 && <span className="diet-item-grams"> {fmtNum(it.grams)}g</span>}
                        </span>
                        <span className="diet-item-sub">
                          {kcalText(it.kcal)} · {pfc(it)}
                        </span>
                      </button>
                      <button className="diet-item-del" onClick={() => setConfirmId(it.id)} aria-label={`${it.food} 삭제`}>
                        ✕
                      </button>
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
