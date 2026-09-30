import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { DietTargets, Macros } from '../../types'
import Modal from '../common/Modal'

// 목표 설정 — 운동일/휴식일 칼로리·단백질·탄수화물·지방 + 기초대사량(추정 소모 계산용).

const FIELDS: { key: keyof Macros; label: string; unit: string }[] = [
  { key: 'kcal', label: '칼로리', unit: 'kcal' },
  { key: 'protein', label: '단백질', unit: 'g' },
  { key: 'carbs', label: '탄수화물', unit: 'g' },
  { key: 'fat', label: '지방', unit: 'g' },
]

export default function TargetsModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [targets, setTargets] = useState<DietTargets | null>(null)
  const [bmr, setBmr] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/diet/targets')
      .then((res) => {
        if (res.data.code === 'ok') {
          setTargets(res.data.targets)
          setBmr(res.data.bmr)
        } else setError(res.data.message || '불러오지 못했습니다.')
      })
      .catch(() => setError('불러오지 못했습니다.'))
  }, [])

  function set(kind: keyof DietTargets, key: keyof Macros, v: number) {
    setTargets((t) => (t ? { ...t, [kind]: { ...t[kind], [key]: Math.max(0, v) } } : t))
  }

  async function save() {
    if (!targets) return
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/diet/targets', { ...targets, bmr })
      if (res.data.code !== 'ok') setError(res.data.message || '저장하지 못했습니다.')
      else onSaved()
    } catch {
      setError('저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="목표 설정" onClose={onClose}>
      {!targets ? (
        <p className={error ? 'log-error' : 'log-empty-text'}>{error || '불러오는 중…'}</p>
      ) : (
        <div className="diet-targets">
          {(['training', 'rest'] as const).map((kind) => (
            <fieldset key={kind} className="diet-targets-group">
              <legend className="form-label">{kind === 'training' ? '운동일' : '휴식일'}</legend>
              <div className="diet-num-grid">
                {FIELDS.map((f) => (
                  <label key={f.key} className="diet-num">
                    <span className="form-label">{f.label}</span>
                    <span className="diet-num-input">
                      <input
                        className="form-input"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={targets[kind][f.key] || ''}
                        onChange={(e) => set(kind, f.key, Number(e.target.value) || 0)}
                      />
                      <span className="diet-num-unit">{f.unit}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <label className="diet-num">
            <span className="form-label">기초대사량 (인바디)</span>
            <span className="diet-num-input">
              <input
                className="form-input"
                type="number"
                inputMode="numeric"
                min={0}
                value={bmr || ''}
                onChange={(e) => setBmr(Math.max(0, Number(e.target.value) || 0))}
              />
              <span className="diet-num-unit">kcal</span>
            </span>
          </label>
          {error && <p className="log-error">{error}</p>}
          <div className="log-footer-buttons">
            <button className="log-secondary" onClick={onClose} disabled={saving}>
              취소
            </button>
            <button className="form-submit" onClick={save} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
