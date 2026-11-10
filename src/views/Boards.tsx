import { Plus } from 'lucide-react'
import { useStore } from '../store'

export default function Boards() {
  const s = useStore()
  const { boards } = s.data
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Bảng</h1>
          <p className="muted">Mỗi team một bảng riêng, cùng cấu trúc và khác bộ danh sách.</p>
        </div>
        {s.role === 'Admin' ? (
          <button className="btn primary" onClick={() => s.setModal('newBoard')}>
            <Plus size={15} /> Tạo bảng
          </button>
        ) : (
          <span className="muted small">Chỉ Admin tạo được bảng</span>
        )}
      </div>

      <div className="board-grid">
        {boards.map((b) => {
          const cards = b.lists.flatMap((l) => l.cards.filter((c) => !c.archived).map(() => l.id))
          const done = cards.filter((id) => id === b.doneList).length
          const pct = cards.length ? Math.round((done / cards.length) * 100) : 0
          return (
            <a className="board-tile" href={`#/board/${b.id}`} key={b.id}>
              <h2>{b.name}</h2>
              <p className="muted tile-desc">{b.desc || 'Chưa có mô tả'}</p>
              <span className="bar" aria-label={`${pct}% hoàn thành`}>
                <i style={{ width: `${pct}%` }} />
              </span>
              <span className="muted small">
                {b.lists.length} danh sách · {cards.length} việc · {pct}% xong
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
