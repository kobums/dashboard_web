import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { LiftCatalogItem, LiftForm, LiftFormEntry } from '../../types'
import { CARDIO_PART, cardioText, localISO, shiftDay, shortDate } from '../../lib/lift'
import Modal from '../common/Modal'
import { SkLines } from '../common/Skeleton'
import LogEditor, { type SavedResult } from './LogEditor'
import ExerciseArt from './ExerciseArt'

// 오늘 기록 시트 — 대시보드에서 노션 운동 일지로 기록한다.
// 흐름: 날짜·컨디션 → 그날 기록 목록(탭=수정, 삭제) → 종목 추가(부위 → 종목) → 편집기.
// 저장은 종목 단위로 즉시 노션에 반영되므로 운동 도중 앱을 닫아도 그때까지의 기록은 남는다.

type View = { kind: 'list' } | { kind: 'pick' } | { kind: 'edit'; item: LiftCatalogItem; entry: LiftFormEntry | null }

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  const today = localISO(new Date())
  const rel = iso === today ? '오늘' : iso === shiftDay(today, -1) ? '어제' : ''
  return `${m}월 ${d}일 (${wd})${rel ? ` · ${rel}` : ''}`
}

export default function LogSheet({ onClose }: { onClose: (changed: boolean) => void }) {
  const today = localISO(new Date())
  const [date, setDate] = useState(today)
  const [form, setForm] = useState<LiftForm | null>(null)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState<View>({ kind: 'list' })
  const [changed, setChanged] = useState(false)
  const [notice, setNotice] = useState<{ text: string; pr: boolean } | null>(null)
  const [busy, setBusy] = useState('') // 진행 중인 요청 표시 (컨디션/삭제)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [pickPart, setPickPart] = useState('')
  const [newName, setNewName] = useState('')

  const load = useCallback(() => {
    setLoadError('')
    api
      .get(`/lift/form?date=${date}`)
      .then((res) => {
        if (res.data.code === 'ok') setForm(res.data as LiftForm)
        else setLoadError(res.data.message || '불러오지 못했습니다.')
      })
      .catch(() => setLoadError('불러오지 못했습니다. 연결을 확인하세요.'))
  }, [date])

  useEffect(() => {
    setForm(null)
    setView({ kind: 'list' })
    load()
  }, [load])

  const close = useCallback(() => onClose(changed), [onClose, changed])

  async function setCondition(condition: string) {
    if (!form) return
    const next = form.day?.condition === condition ? '' : condition
    setBusy('condition')
    setForm({ ...form, day: { id: form.day?.id ?? '', title: form.day?.title ?? '', parts: form.day?.parts ?? [], condition: next } })
    try {
      const res = await api.post('/lift/day', { date, condition: next })
      if (res.data.code !== 'ok') setNotice({ text: res.data.message || '컨디션 저장 실패', pr: false })
      else setChanged(true)
    } catch {
      setNotice({ text: '컨디션 저장 실패 — 연결을 확인하세요.', pr: false })
    } finally {
      setBusy('')
    }
  }

  async function remove(entry: LiftFormEntry) {
    setBusy(entry.id)
    try {
      const res = await api.post('/lift/log/delete', { id: entry.id })
      if (res.data.code !== 'ok') {
        setNotice({ text: res.data.message || '삭제하지 못했습니다.', pr: false })
        return
      }
      setChanged(true)
      setConfirmDelete(null)
      setNotice({ text: `${entry.name} 삭제됨 (노션 휴지통에서 복구 가능)`, pr: false })
      load()
    } catch {
      setNotice({ text: '삭제하지 못했습니다. 연결을 확인하세요.', pr: false })
    } finally {
      setBusy('')
    }
  }

  function onSaved(r: SavedResult) {
    setChanged(true)
    setView({ kind: 'list' })
    setNotice(r.pr ? { text: `PR! ${r.name} ${r.pr}`, pr: true } : { text: `${r.name} 저장됨`, pr: false })
    load()
  }

  const catalogByName = useMemo(() => new Map(form?.catalog.map((c) => [c.name, c]) ?? []), [form])

  function openEntry(entry: LiftFormEntry) {
    const item = catalogByName.get(entry.name) ?? { name: entry.name, part: entry.part, bodyweight: false, last: null, goal: [] }
    setNotice(null)
    setView({ kind: 'edit', item, entry })
  }

  function openItem(item: LiftCatalogItem) {
    const entry = form?.entries.find((e) => e.name === item.name) ?? null
    setNotice(null)
    setView({ kind: 'edit', item, entry })
  }

  function startPick() {
    setPickPart(form?.suggestedPart || form?.parts[0] || '')
    setNewName('')
    setNotice(null)
    setView({ kind: 'pick' })
  }

  const title =
    view.kind === 'edit' ? view.item.name : view.kind === 'pick' ? '종목 추가' : dateLabel(date)

  const back =
    view.kind !== 'list' ? (
      <button className="modal-close" onClick={() => setView({ kind: 'list' })} aria-label="뒤로">
        ‹
      </button>
    ) : null

  return (
    <Modal title={title} onClose={close} sheet head={back}>
      {!form ? (
        loadError ? (
          <div className="log-empty">
            <p className="log-error">{loadError}</p>
            <button className="log-secondary" onClick={load}>
              다시 시도
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <SkLines rows={4} />
          </div>
        )
      ) : view.kind === 'edit' ? (
        <LogEditor
          key={view.item.name + (view.entry?.id ?? '')}
          date={date}
          item={view.item}
          entry={view.entry}
          onSaved={onSaved}
          onCancel={() => setView({ kind: 'list' })}
        />
      ) : view.kind === 'pick' ? (
        <div className="log-pick">
          <div className="year-chips">
            {form.parts.map((p) => (
              <button
                key={p}
                className={`year-chip${p === pickPart ? ' active' : ''}`}
                onClick={() => setPickPart(p)}
              >
                {p}
                {p === form.suggestedPart && ' · 추천'}
              </button>
            ))}
          </div>
          <ul className="log-catalog">
            {form.catalog
              .filter((c) => c.part === pickPart)
              .sort((a, b) => (b.last?.date ?? '').localeCompare(a.last?.date ?? ''))
              .map((c) => {
                const done = form.entries.some((e) => e.name === c.name)
                return (
                  <li key={c.name}>
                    <button className="log-catalog-item has-art" onClick={() => openItem(c)}>
                      <ExerciseArt name={c.name} size="sm" placeholder />
                      <span className="log-catalog-text">
                        <span className="log-catalog-name">
                          {c.name}
                          {done && <span className="log-done"> ✓ 기록함</span>}
                        </span>
                        <span className="log-catalog-sub">
                          {c.last
                            ? `${shortDate(c.last.date)} · ${
                                c.part === CARDIO_PART ? cardioText(c.last) || '기록' : c.last.mainText || '—'
                              }`
                            : '기록 없음'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
          </ul>
          <form
            className="log-new"
            onSubmit={(e) => {
              e.preventDefault()
              const name = newName.trim()
              if (!name) return
              openItem(catalogByName.get(name) ?? { name, part: pickPart, bodyweight: false, last: null, goal: [] })
            }}
          >
            <input
              className="form-input"
              value={newName}
              placeholder={`새 종목 (${pickPart || '부위'})`}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="form-submit" type="submit" disabled={!newName.trim()}>
              추가
            </button>
          </form>
        </div>
      ) : (
        <div className="log-list">
          <div className="log-date-nav">
            <button className="stepper-btn" onClick={() => setDate(shiftDay(date, -1))} aria-label="전날">
              ‹
            </button>
            <span className="log-date-label">{form.day?.title || (form.entries.length ? '' : '기록 없음')}</span>
            <button
              className="stepper-btn"
              onClick={() => setDate(shiftDay(date, 1))}
              disabled={date >= today}
              aria-label="다음날"
            >
              ›
            </button>
          </div>

          <div className="log-conditions">
            <span className="form-label">컨디션</span>
            <div className="year-chips">
              {form.conditions.map((c) => (
                <button
                  key={c}
                  className={`year-chip${form.day?.condition === c ? ' active' : ''}`}
                  onClick={() => setCondition(c)}
                  disabled={busy === 'condition'}
                  aria-pressed={form.day?.condition === c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {notice && <p className={`log-notice${notice.pr ? ' log-notice-pr' : ''}`}>{notice.text}</p>}

          {form.entries.length === 0 ? (
            <p className="log-empty-text">
              아직 기록이 없습니다.
              {form.suggestedPart && ` 오늘은 ${form.suggestedPart} 차례예요.`}
            </p>
          ) : (
            <ul className="log-entries">
              {form.entries.map((e) => (
                <li key={e.id} className="log-entry">
                  {confirmDelete === e.id ? (
                    <div className="log-confirm">
                      <span>{e.name} 삭제할까요?</span>
                      <div className="log-footer-buttons">
                        <button className="log-secondary" onClick={() => setConfirmDelete(null)} disabled={busy === e.id}>
                          취소
                        </button>
                        <button className="form-submit log-danger" onClick={() => remove(e)} disabled={busy === e.id}>
                          {busy === e.id ? '삭제 중…' : '삭제'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button className="log-entry-main" onClick={() => openEntry(e)}>
                        <span className="log-catalog-name">{e.name}</span>
                        <span className="log-catalog-sub">
                          {e.part === CARDIO_PART ? cardioText(e) || e.memo || '기록' : e.mainText || '—'}
                        </span>
                        {e.target && <span className="log-catalog-sub">다음 {e.target}</span>}
                      </button>
                      <button className="log-entry-delete" onClick={() => setConfirmDelete(e.id)} aria-label={`${e.name} 삭제`}>
                        삭제
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <button className="form-submit log-add" onClick={startPick}>
            + 종목 추가
          </button>
        </div>
      )}
    </Modal>
  )
}
