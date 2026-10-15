import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { LiftCardioValues, LiftCatalogItem, LiftFormEntry, LiftSet } from '../../types'
import {
  bestE1rm,
  bumpGoal,
  CARDIO_PART,
  cardioText,
  goalMet,
  kg,
  maxReps,
  serializeSets,
  shortDate,
} from '../../lib/lift'
import ExerciseArt from './ExerciseArt'
import Icon from '../common/Icon'

// 종목 1개 기록 편집기 — 근력(웜업/본세트 세트 빌더 + 다음 목표) 또는 유산소(시간·속도·경사·거리).
// 헬스장에서 한 손으로 쓰는 전제: 큰 +/− 스테퍼, 지난 기록·목표로 미리 채움, 입력 중 상태는 localStorage 초안.

type Mode = 'warmup' | 'main'

interface Draft extends LiftCardioValues {
  warmup: LiftSet[]
  main: LiftSet[]
  target: string
  targetTouched: boolean
  memo: string
  weight: number
  reps: number
  bw: boolean
  mode: Mode
}

export interface SavedResult {
  name: string
  pr: string | null // "e1RM 83.3kg (지난번 75kg)" 같은 신기록 문구
}

const draftKey = (date: string, name: string) => `lift-draft:${date}:${name}`

function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Draft) : null
  } catch {
    return null
  }
}

function writeDraft(key: string, d: Draft | null) {
  try {
    if (d) localStorage.setItem(key, JSON.stringify(d))
    else localStorage.removeItem(key)
  } catch {
    // 프라이빗 모드 등 — 초안 없이 동작
  }
}

function initialDraft(item: LiftCatalogItem, entry: LiftFormEntry | null): Draft {
  const last = item.last
  const first = item.goal[0] ?? last?.main[0]
  const src = entry ?? last
  return {
    warmup: entry?.warmup ?? [],
    main: entry?.main ?? [],
    target: entry?.target ?? last?.target ?? '',
    targetTouched: entry != null,
    memo: entry?.memo ?? '',
    weight: first?.weight ?? 20,
    reps: first?.reps ?? 10,
    bw: first?.bodyweight ?? item.bodyweight,
    mode: 'main',
    minutes: src?.minutes ?? 0,
    speed: src?.speed ?? 0,
    incline: src?.incline ?? 0,
    distance: src?.distance ?? 0,
  }
}

const round = (v: number, step: number) => Math.round(v / step) * step

export default function LogEditor({
  date,
  item,
  entry,
  onSaved,
  onCancel,
}: {
  date: string
  item: LiftCatalogItem
  entry: LiftFormEntry | null
  onSaved: (r: SavedResult) => void
  onCancel: () => void
}) {
  const key = draftKey(date, item.name)
  const [d, setD] = useState<Draft>(() => readDraft(key) ?? initialDraft(item, entry))
  const [restored] = useState(() => readDraft(key) != null)
  const [dirty, setDirty] = useState(false) // 손대기 전엔 초안을 남기지 않는다
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const cardio = item.part === CARDIO_PART
  const last = item.last

  useEffect(() => {
    if (dirty) writeDraft(key, d)
  }, [key, d, dirty])

  const patch = (p: Partial<Draft>) => {
    setDirty(true)
    setD((prev) => ({ ...prev, ...p }))
  }

  // 다음 목표 제안: 목표를 다 채웠으면 +2.5kg, 아니면 기존 목표 유지 (사용자가 고치면 그대로)
  const suggestedTarget = useMemo(() => {
    if (item.goal.length > 0 && goalMet(item.goal, d.main)) return serializeSets(bumpGoal(item.goal))
    return last?.target ?? ''
  }, [item.goal, d.main, last])
  const target = d.targetTouched ? d.target : suggestedTarget

  function addSet() {
    const set: LiftSet = { weight: d.bw ? 0 : d.weight, reps: d.reps, bodyweight: d.bw }
    if (d.mode === 'warmup') {
      const warmup = [...d.warmup, set]
      // 다음 웜업은 지난번 같은 순번 웜업으로 미리 채운다
      const next = last?.warmup[warmup.length]
      patch(next ? { warmup, weight: next.weight, reps: next.reps } : { warmup })
    } else {
      patch({ main: [...d.main, set] })
    }
  }

  function switchMode(mode: Mode) {
    if (mode === d.mode) return
    if (mode === 'warmup') {
      const next = last?.warmup[d.warmup.length]
      patch(next ? { mode, weight: next.weight, reps: next.reps, bw: false } : { mode })
    } else {
      const first = item.goal[0] ?? last?.main[0]
      patch(first ? { mode, weight: first.weight, reps: first.reps, bw: first.bodyweight } : { mode })
    }
  }

  const removeSet = (mode: Mode, i: number) => patch({ [mode]: d[mode].filter((_, j) => j !== i) })

  async function save() {
    if (!cardio && d.main.length === 0) {
      setError('본세트를 한 개 이상 추가하세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        id: entry?.id,
        date,
        name: item.name,
        part: item.part,
        warmup: cardio ? '' : serializeSets(d.warmup),
        main: cardio ? '' : serializeSets(d.main),
        target: cardio ? '' : target.trim(),
        minutes: d.minutes,
        speed: d.speed,
        incline: d.incline,
        distance: d.distance,
        memo: d.memo.trim(),
      }
      const res = await api.post('/lift/log', body)
      if (res.data.code !== 'ok') {
        setError(res.data.message || '저장하지 못했습니다.')
        return
      }
      writeDraft(key, null)
      onSaved({ name: item.name, pr: cardio ? null : prText(d.main, last?.main ?? []) })
    } catch {
      setError('저장하지 못했습니다. 연결을 확인하고 다시 눌러 주세요. (입력은 보존됩니다)')
    } finally {
      setSaving(false)
    }
  }

  function discardDraft() {
    writeDraft(key, null)
    setDirty(false)
    setD(initialDraft(item, entry))
  }

  function cancel() {
    writeDraft(key, null)
    onCancel()
  }

  return (
    <div className="log-editor">
      <div className="log-editor-meta">
        <ExerciseArt name={item.name} size="md" animate />
        <span className="log-part">{item.part || '부위 없음'}</span>
        {last ? (
          <p className="log-last">
            지난번 <strong>{cardio ? cardioText(last) || '기록' : last.mainText || '—'}</strong> ({shortDate(last.date)})
          </p>
        ) : (
          <p className="log-last">첫 기록</p>
        )}
        {!cardio && last?.target && (
          <p className="log-last">
            이번 목표 <strong>{last.target}</strong>
          </p>
        )}
        {restored && (
          <p className="log-restored">
            저장 안 된 입력을 불러왔습니다.{' '}
            <button className="text-button" onClick={discardDraft}>
              처음부터
            </button>
          </p>
        )}
      </div>

      {cardio ? (
        <div className="log-cardio">
          <Stepper label="시간" unit="분" value={d.minutes} step={5} onChange={(v) => patch({ minutes: v })} />
          <Stepper label="속도" unit="km/h" value={d.speed} step={0.5} onChange={(v) => patch({ speed: v })} />
          <Stepper label="경사" unit="" value={d.incline} step={1} onChange={(v) => patch({ incline: v })} />
          <Stepper label="거리" unit="km" value={d.distance} step={0.5} onChange={(v) => patch({ distance: v })} />
        </div>
      ) : (
        <>
          <div className="year-chips log-mode" role="tablist">
            {(['warmup', 'main'] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={d.mode === m}
                className={`year-chip${d.mode === m ? ' active' : ''}`}
                onClick={() => switchMode(m)}
              >
                {m === 'warmup' ? `웜업 ${d.warmup.length}` : `본세트 ${d.main.length}`}
              </button>
            ))}
            <button
              className={`year-chip log-bw${d.bw ? ' active' : ''}`}
              aria-pressed={d.bw}
              onClick={() => patch({ bw: !d.bw })}
            >
              BW 맨몸
            </button>
          </div>

          <div className="log-steppers">
            {!d.bw && (
              <Stepper
                label="무게"
                unit="kg"
                value={d.weight}
                step={2.5}
                big
                onChange={(v) => patch({ weight: v })}
              />
            )}
            <Stepper label="횟수" unit="회" value={d.reps} step={1} big integer onChange={(v) => patch({ reps: v })} />
          </div>

          <button className="log-add-set" onClick={addSet}>
            {d.mode === 'warmup' ? '웜업' : '본세트'} 추가 · {d.bw ? 'BW' : kg(d.weight)} × {d.reps}
          </button>

          <SetChips label="웜업" sets={d.warmup} onRemove={(i) => removeSet('warmup', i)} />
          <SetChips label="본세트" sets={d.main} onRemove={(i) => removeSet('main', i)} />

          <label className="form-field log-field">
            <span className="form-label">
              다음 목표{' '}
              {!d.targetTouched && item.goal.length > 0 && goalMet(item.goal, d.main) && (
                <span className="log-hint">목표 달성 → +2.5kg 제안</span>
              )}
            </span>
            <input
              className="form-input"
              value={target}
              placeholder="예: 55×12~15×4"
              onChange={(e) => patch({ target: e.target.value, targetTouched: true })}
            />
          </label>
        </>
      )}

      <label className="form-field log-field">
        <span className="form-label">메모</span>
        <input
          className="form-input"
          value={d.memo}
          placeholder="기구 세팅·느낌"
          onChange={(e) => patch({ memo: e.target.value })}
        />
      </label>

      <div className="log-footer">
        {error && <p className="log-error">{error}</p>}
        <div className="log-footer-buttons">
          <button className="log-secondary" onClick={cancel} disabled={saving}>
            취소
          </button>
          <button className="form-submit log-save" onClick={save} disabled={saving}>
            {saving ? '노션에 저장 중…' : entry ? '수정 저장' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 새 본세트가 지난 회차를 넘었으면 신기록 문구 (e1RM, 맨몸은 최다 횟수)
function prText(main: LiftSet[], lastMain: LiftSet[]): string | null {
  if (lastMain.length === 0 || main.length === 0) return null
  if (main.every((s) => s.bodyweight)) {
    const now = maxReps(main)
    const before = maxReps(lastMain)
    return now > before ? `최다 ${now}회 (지난번 ${before}회)` : null
  }
  const now = bestE1rm(main)
  const before = bestE1rm(lastMain)
  return now > before ? `e1RM ${kg(now)} (지난번 ${kg(before)})` : null
}

function SetChips({ label, sets, onRemove }: { label: string; sets: LiftSet[]; onRemove: (i: number) => void }) {
  if (sets.length === 0) return null
  return (
    <div className="log-sets">
      <span className="form-label">
        {label} <span className="log-preview">{serializeSets(sets)}</span>
      </span>
      <div className="log-set-chips">
        {sets.map((s, i) => (
          <button key={i} className="log-set-chip" onClick={() => onRemove(i)} aria-label={`${label} ${i + 1}세트 삭제`}>
            {s.bodyweight ? 'BW' : Number(s.weight.toFixed(2))}×{s.reps}
            <span aria-hidden="true"> ✕</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Stepper({
  label,
  unit,
  value,
  step,
  big = false,
  integer = false,
  onChange,
}: {
  label: string
  unit: string
  value: number
  step: number
  big?: boolean
  integer?: boolean
  onChange: (v: number) => void
}) {
  // 직접 입력 중엔 문자열로 들고 있다가(“67.” 같은 중간 상태 허용) 숫자로 반영
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  const set = (v: number) => onChange(Math.max(0, integer ? Math.round(v) : round(v, 0.25)))

  return (
    <div className={`stepper${big ? ' stepper-big' : ''}`}>
      <span className="form-label">{label}</span>
      <div className="stepper-row">
        <button className="stepper-btn" onClick={() => set(value - step)} aria-label={`${label} ${step} 줄이기`}>
          <Icon name="minus" />
        </button>
        <label className="stepper-value">
          <input
            inputMode={integer ? 'numeric' : 'decimal'}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              const n = Number(e.target.value)
              if (e.target.value !== '' && !Number.isNaN(n)) onChange(Math.max(0, n))
            }}
            onBlur={() => setText(String(value))}
            aria-label={label}
          />
          {unit && <span className="stepper-unit">{unit}</span>}
        </label>
        <button className="stepper-btn" onClick={() => set(value + step)} aria-label={`${label} ${step} 늘리기`}>
          <Icon name="plus" />
        </button>
      </div>
    </div>
  )
}
