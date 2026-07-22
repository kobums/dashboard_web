import { useState } from 'react'
import { api } from '../../lib/api'
import { WORKOUT_TYPES } from '../../pages/Fitness'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function WorkoutForm({ onSaved }: { onSaved: () => void }) {
  const [type, setType] = useState('weight')
  const [date, setDate] = useState(todayStr())
  const [minutes, setMinutes] = useState('')
  const [distance, setDistance] = useState('')
  const [calories, setCalories] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const durationMin = Number(minutes)
    if (!date || !durationMin) {
      setMessage('날짜와 운동 시간은 필수입니다.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await api.post('/workout', {
        type,
        workoutdate: date,
        duration: Math.round(durationMin * 60),
        distance: Number(distance) || 0,
        calories: Math.round(Number(calories)) || 0,
        memo,
        source: 'manual',
      })
      setMinutes('')
      setDistance('')
      setCalories('')
      setMemo('')
      setMessage('저장했습니다.')
      onSaved()
    } catch {
      setMessage('저장하지 못했습니다. 잠시 후 다시 시도하세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="workout-form">
      <div className="form-row">
        <label className="form-field">
          <span className="form-label">종류</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="form-input">
            {Object.entries(WORKOUT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-input" />
        </label>
      </div>
      <div className="form-row">
        <label className="form-field">
          <span className="form-label">시간 (분)</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="60"
            className="form-input"
          />
        </label>
        <label className="form-field">
          <span className="form-label">거리 (km)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="선택"
            className="form-input"
          />
        </label>
        <label className="form-field">
          <span className="form-label">칼로리</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="선택"
            className="form-input"
          />
        </label>
      </div>
      <label className="form-field">
        <span className="form-label">메모</span>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="하체, 5km 인터벌…"
          className="form-input"
        />
      </label>
      <div className="form-footer">
        {message && <span className="form-message">{message}</span>}
        <button type="submit" disabled={saving} className="form-submit">
          {saving ? '저장 중…' : '기록 저장'}
        </button>
      </div>
    </form>
  )
}
