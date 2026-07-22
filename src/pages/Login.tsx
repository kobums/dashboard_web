import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'

export default function Login() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!key.trim()) return
    setChecking(true)
    setError('')
    try {
      // 토큰 유효성 확인 — 가벼운 인증 엔드포인트 호출
      await api.get('/workout?page=1&pagesize=1', {
        headers: { Authorization: `Bearer ${key.trim()}` },
      })
      setToken(key.trim())
      navigate('/', { replace: true })
    } catch {
      setError('액세스 키가 올바르지 않습니다. 다시 확인해 주세요.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="login-wrap">
      <form onSubmit={submit} className="login-form">
        <h1 className="display-title">gowoobro</h1>
        <p className="login-desc">개인 대시보드입니다. 액세스 키를 입력하세요.</p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="액세스 키"
          autoFocus
          className="login-input"
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={checking || !key.trim()} className="login-button">
          {checking ? '확인 중…' : '들어가기'}
        </button>
      </form>
    </div>
  )
}
