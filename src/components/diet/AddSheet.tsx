import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/api'
import type { DietDay, DietItem, DietSearchItem, Macros } from '../../types'
import { fmtNum, kcalText, MEALS, pfc, scaleMacros, ZERO } from '../../lib/diet'
import Modal from '../common/Modal'
import Icon from '../common/Icon'

// 음식 추가/수정 시트 — 끼니 칩 + 탭(자주 먹은 · 검색 · 직접 입력) → 양 조절 편집기 → 노션 저장.
// 자주 먹은/검색 결과는 g 당 값으로 환산해 두고 양(±10g)을 바꾸면 영양소가 따라 바뀐다.
// 작성 중 편집기는 localStorage 에 임시 저장(신호 끊김 대비), 저장 성공 시 지운다.

type Tab = 'frequent' | 'search' | 'manual'

// 편집 대상: per/basis 가 있으면 양에 비례해 계산, 없으면 macros 를 직접 입력
interface Draft {
  id?: string
  food: string
  foodCode: string
  grams: number
  per: Macros | null
  basisGrams: number
  macros: Macros
  memo: string
}

const DRAFT_KEY = (date: string) => `diet-draft:${date}`

function loadDraft(date: string): { meal: string; draft: Draft } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(date))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(date: string, meal: string, draft: Draft | null) {
  try {
    if (draft) localStorage.setItem(DRAFT_KEY(date), JSON.stringify({ meal, draft }))
    else localStorage.removeItem(DRAFT_KEY(date))
  } catch {
    /* 저장소 불가(비공개 모드 등) — 임시 저장만 포기 */
  }
}

// 기존 값(양+영양소)에서 g 당 값을 역산 — 양을 바꾸면 비례 계산되게
function fromFixed(food: string, foodCode: string, grams: number, m: Macros, memo = '', id?: string): Draft {
  return grams > 0
    ? { id, food, foodCode, grams, per: m, basisGrams: grams, macros: m, memo }
    : { id, food, foodCode, grams: 0, per: null, basisGrams: 0, macros: m, memo }
}

export default function AddSheet({
  day,
  initialMeal,
  editing,
  onClose,
  onSaved,
}: {
  day: DietDay
  initialMeal: string
  editing: DietItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const restored = useMemo(() => (editing ? null : loadDraft(day.date)), [day.date, editing])
  const [meal, setMeal] = useState(restored?.meal ?? initialMeal)
  const [tab, setTab] = useState<Tab>('frequent')
  const [draft, setDraft] = useState<Draft | null>(
    editing
      ? fromFixed(editing.food, editing.foodCode, editing.grams, editing, editing.memo, editing.id)
      : (restored?.draft ?? null),
  )
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing && touched) saveDraft(day.date, meal, draft)
  }, [draft, meal, touched, editing, day.date])

  function pick(d: Draft) {
    setDraft(d)
    setTouched(true)
    setError('')
  }

  function update(patch: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d))
    setTouched(true)
  }

  const macros: Macros = draft ? (draft.per ? scaleMacros(draft.per, draft.basisGrams, draft.grams) : draft.macros) : ZERO

  async function save() {
    if (!draft) return
    if (!draft.food.trim()) {
      setError('음식 이름을 입력하세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/diet/log', {
        id: draft.id,
        date: day.date,
        meal,
        food: draft.food.trim(),
        grams: draft.grams,
        ...macros,
        foodCode: draft.foodCode,
        memo: draft.memo.trim(),
      })
      if (res.data.code !== 'ok') {
        setError(res.data.message || '저장하지 못했습니다.')
        return
      }
      saveDraft(day.date, meal, null)
      onSaved()
    } catch {
      setError('저장하지 못했습니다. 입력은 남아 있으니 다시 저장을 눌러 주세요.')
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    saveDraft(day.date, meal, null)
    setDraft(null)
    setTouched(false)
  }

  const title = editing ? '식단 수정' : '식단 기록'

  return (
    <Modal
      title={title}
      onClose={onClose}
      sheet
      head={
        draft && !editing ? (
          <button className="modal-close" onClick={discard} aria-label="뒤로">
            <Icon name="chevron-left" />
          </button>
        ) : undefined
      }
    >
      <div className="diet-sheet">
        <div className="year-chips diet-meal-chips">
          {MEALS.map((m) => (
            <button key={m} className={`year-chip${m === meal ? ' active' : ''}`} onClick={() => setMeal(m)}>
              {m}
            </button>
          ))}
        </div>

        {!draft ? (
          <>
            <div className="diet-tabs" role="tablist">
              {(
                [
                  ['frequent', '자주 먹은'],
                  ['search', '검색'],
                  ['manual', '직접 입력'],
                ] as [Tab, string][]
              ).map(([t, label]) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={`diet-tab${tab === t ? ' active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === 'frequent' && <FrequentTab day={day} meal={meal} onPick={pick} />}
            {tab === 'search' && <SearchTab enabled={day.searchEnabled} onPick={pick} />}
            {tab === 'manual' && (
              <button
                className="form-submit diet-manual-start"
                onClick={() => pick({ food: '', foodCode: '', grams: 0, per: null, basisGrams: 0, macros: ZERO, memo: '' })}
              >
                직접 입력하기
              </button>
            )}
          </>
        ) : (
          <Editor
            draft={draft}
            macros={macros}
            restored={!editing && !!restored && !touched}
            onChange={update}
            onDiscard={discard}
          />
        )}

        {error && <p className="log-error">{error}</p>}

        {draft && (
          <div className="log-footer diet-footer">
            <div className="log-footer-buttons">
              <button className="log-secondary" onClick={editing ? onClose : discard} disabled={saving}>
                취소
              </button>
              <button className="form-submit" onClick={save} disabled={saving}>
                {saving ? '저장 중…' : `${meal}에 저장 · ${kcalText(macros.kcal)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function FrequentTab({ day, meal, onPick }: { day: DietDay; meal: string; onPick: (d: Draft) => void }) {
  const [filter, setFilter] = useState('')
  const list = useMemo(() => {
    const q = filter.trim()
    const base = q ? day.frequent.filter((f) => f.food.includes(q)) : day.frequent
    // 지금 고른 끼니에서 자주 먹은 것을 위로
    return [...base].sort((a, b) => Number(b.meal === meal) - Number(a.meal === meal) || b.count - a.count)
  }, [day.frequent, filter, meal])

  if (day.frequent.length === 0) {
    return <p className="log-empty-text">아직 기록이 없습니다. 검색이나 직접 입력으로 시작하세요.</p>
  }
  return (
    <>
      {day.frequent.length > 6 && (
        <input className="form-input" placeholder="음식 이름으로 찾기" value={filter} onChange={(e) => setFilter(e.target.value)} />
      )}
      <ul className="log-catalog">
        {list.map((f) => (
          <li key={`${f.food}|${f.grams}`}>
            <button className="log-catalog-item" onClick={() => onPick(fromFixed(f.food, f.foodCode, f.grams, f))}>
              <span className="log-catalog-name">
                {f.food}
                {f.grams > 0 && <span className="diet-item-grams"> {fmtNum(f.grams)}g</span>}
              </span>
              <span className="log-catalog-sub">
                {kcalText(f.kcal)} · {pfc(f)} · {f.count}회{f.meal ? ` · 주로 ${f.meal}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function SearchTab({ enabled, onPick }: { enabled: boolean; onPick: (d: Draft) => void }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<DietSearchItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const seq = useRef(0)

  useEffect(() => {
    const query = q.trim()
    if (!enabled || query.length < 1) {
      setItems(null)
      return
    }
    const my = ++seq.current
    const t = setTimeout(() => {
      setLoading(true)
      setError('')
      api
        .get('/diet/search', { params: { q: query } })
        .then((res) => {
          if (my !== seq.current) return
          if (res.data.code !== 'ok') setError(res.data.message || '검색하지 못했습니다.')
          else setItems(res.data.items ?? [])
        })
        .catch(() => my === seq.current && setError('검색하지 못했습니다. 연결을 확인하세요.'))
        .finally(() => my === seq.current && setLoading(false))
    }, 350)
    return () => clearTimeout(t)
  }, [q, enabled])

  if (!enabled) {
    return (
      <p className="log-empty-text">
        음식 검색은 식약처 식품영양성분DB API 키가 필요합니다. 공공데이터포털에서 「식품의약품안전처_식품영양성분DB정보」 활용 신청 후 서버 환경변수{' '}
        <code>FOOD_API_KEY</code> 를 설정하세요. 그 전에는 자주 먹은 음식과 직접 입력을 쓸 수 있어요.
      </p>
    )
  }

  return (
    <>
      <input
        className="form-input"
        placeholder="예: 닭가슴살, 현미밥, 그릭요거트"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {loading && <p className="log-empty-text">검색 중…</p>}
      {error && <p className="log-error">{error}</p>}
      {items && !loading && items.length === 0 && <p className="log-empty-text">결과가 없습니다. 다른 이름으로 찾아보세요.</p>}
      {items && items.length > 0 && (
        <ul className="log-catalog">
          {items.map((it) => (
            <li key={it.foodCode + it.name}>
              <button
                className="log-catalog-item"
                onClick={() =>
                  onPick({
                    food: it.name,
                    foodCode: it.foodCode,
                    grams: it.servingGrams > 0 ? it.servingGrams : it.basisGrams || 100,
                    per: it.per,
                    basisGrams: it.basisGrams || 100,
                    macros: ZERO,
                    memo: '',
                  })
                }
              >
                <span className="log-catalog-name">
                  {it.name}
                  {it.maker && <span className="diet-item-grams"> {it.maker}</span>}
                </span>
                <span className="log-catalog-sub">
                  {it.basis || `${it.basisGrams}g`} 당 {kcalText(it.per.kcal)} · {pfc(it.per)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function NumField({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <label className="diet-num">
      <span className="form-label">{label}</span>
      <span className="diet-num-input">
        <input
          className="form-input"
          type="number"
          inputMode="decimal"
          min={0}
          value={value || ''}
          placeholder="0"
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        />
        <span className="diet-num-unit">{unit}</span>
      </span>
    </label>
  )
}

function Editor({
  draft,
  macros,
  restored,
  onChange,
  onDiscard,
}: {
  draft: Draft
  macros: Macros
  restored: boolean
  onChange: (p: Partial<Draft>) => void
  onDiscard: () => void
}) {
  const scaled = draft.per != null
  const setGrams = (g: number) => onChange({ grams: Math.max(0, Math.round(g)) })

  return (
    <div className="diet-editor">
      {restored && (
        <p className="log-restored">
          저장 안 된 입력을 불러왔습니다.{' '}
          <button className="text-button" onClick={onDiscard}>
            처음부터
          </button>
        </p>
      )}

      <label>
        <span className="form-label">음식</span>
        <input className="form-input" value={draft.food} onChange={(e) => onChange({ food: e.target.value })} placeholder="예: 닭가슴살" />
      </label>

      <div>
        <span className="form-label">양</span>
        <div className="stepper-row stepper-big">
          <button className="stepper-btn" onClick={() => setGrams(draft.grams - 10)} disabled={draft.grams <= 0} aria-label="10g 줄이기">
            <Icon name="minus" />
          </button>
          <span className="stepper-value">
            <input
              className="diet-grams-input"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.grams || ''}
              placeholder="0"
              onChange={(e) => setGrams(Number(e.target.value) || 0)}
              aria-label="양(g)"
            />
            <span className="stepper-unit">g</span>
          </span>
          <button className="stepper-btn" onClick={() => setGrams(draft.grams + 10)} aria-label="10g 늘리기">
            <Icon name="plus" />
          </button>
        </div>
      </div>

      {scaled ? (
        <div className="diet-macros-preview">
          <strong>{kcalText(macros.kcal)}</strong>
          <span>{pfc(macros)}</span>
          <button className="text-button" onClick={() => onChange({ per: null, basisGrams: 0, macros })}>
            숫자 직접 고치기
          </button>
        </div>
      ) : (
        <div className="diet-num-grid">
          <NumField label="칼로리" unit="kcal" value={draft.macros.kcal} onChange={(v) => onChange({ macros: { ...draft.macros, kcal: v } })} />
          <NumField label="단백질" unit="g" value={draft.macros.protein} onChange={(v) => onChange({ macros: { ...draft.macros, protein: v } })} />
          <NumField label="탄수화물" unit="g" value={draft.macros.carbs} onChange={(v) => onChange({ macros: { ...draft.macros, carbs: v } })} />
          <NumField label="지방" unit="g" value={draft.macros.fat} onChange={(v) => onChange({ macros: { ...draft.macros, fat: v } })} />
        </div>
      )}

      {/* 메모 칸 없음 — 노션 「식단 기록」 표에 메모 열이 없다 (하루 메모는 노션 페이지 「메모」 속성에) */}
    </div>
  )
}
