import type { ProgressBook } from '../../types'

// 읽고 있는 책 목록 (표지 + 진행률) — 독서 페이지와 홈(데스크톱)에서 공용.

export default function BookProgressList({ books }: { books: ProgressBook[] }) {
  if (books.length === 0) {
    return <p className="text-secondary" style={{ marginTop: 12 }}>읽고 있는 책이 없습니다.</p>
  }

  return (
    <ul className="book-list">
      {books.map((book) => {
        const ratio = book.totalPage && book.totalPage > 0 ? (book.readPage ?? 0) / book.totalPage : 0
        return (
          <li key={book.id} className="book-item">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt="" className="book-cover" />
            ) : (
              <div className="book-cover placeholder" />
            )}
            <div className="book-info">
              <p className="book-title">{book.title}</p>
              <p className="book-author">{book.author}</p>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
              </div>
            </div>
            <span className="book-percent">{Math.round(ratio * 100)}%</span>
          </li>
        )
      })}
    </ul>
  )
}
