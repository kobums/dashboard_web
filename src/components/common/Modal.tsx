import { useEffect } from 'react'

// 모달 — 오버레이 dim 으로 구분 (DESIGN: 카드에 그림자 금지 → 그림자 대신 오버레이).
// ESC·배경 클릭으로 닫기. sheet: 모바일에서 아래에서 올라오는 높은 시트 (입력 화면용), head: 제목 옆 추가 요소.

export default function Modal({
  title,
  onClose,
  children,
  sheet = false,
  head,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  sheet?: boolean
  head?: React.ReactNode
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className={`modal-overlay${sheet ? ' modal-overlay-sheet' : ''}`} onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal-card${sheet ? ' modal-sheet' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          {head}
          <h2 className="card-title modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
