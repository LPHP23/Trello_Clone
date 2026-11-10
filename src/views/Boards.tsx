import { Lock, MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useStore } from '../store'
import { Popover } from '../ui'
import { colorHex } from '../data'

export default function Boards() {
  const s = useStore()
  const admin = s.role === 'Admin'
  const hidden = s.data.boards.length - s.boards.length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Bảng</h1>
          <p className="muted">Mỗi team một bảng riêng, cùng cấu trúc và khác bộ danh sách.</p>
        </div>
        {admin ? (
          <button className="btn primary" onClick={() => s.setModal('newBoard')}>
            <Plus size={15} /> Tạo bảng
          </button>
        ) : (
          <span className="muted small">Chỉ Admin tạo được bảng</span>
        )}
      </div>

      <div className="board-grid">
        {s.boards.map((b) => {
          const cards = b.lists.flatMap((l) => l.cards.filter((c) => !c.archived).map((c) => ({ listId: l.id, c })))
          const done = cards.filter((x) => x.c.done || x.listId === b.doneList).length
          const pct = cards.length ? Math.round((done / cards.length) * 100) : 0
          return (
            <div className="board-tile" key={b.id} style={{ ['--tile' as string]: colorHex(b.color) }}>
              <a className="tile-link" href={`#/board/${b.id}`}>
                <span className="tile-head">
                  <span className="board-dot lg" style={{ background: colorHex(b.color) }} aria-hidden />
                  <h2>{b.name}</h2>
                  {b.visibility === 'private' && <Lock size={13} className="muted" aria-label="Bảng riêng tư" />}
                </span>
                <p className="muted tile-desc">{b.desc || 'Chưa có mô tả'}</p>
                <span className="bar" aria-label={`${pct}% hoàn thành`}>
                  <i style={{ width: `${pct}%` }} />
                </span>
                <span className="muted small tile-foot">
                  {b.lists.length} danh sách · {cards.length} việc · {pct}% xong
                  <span className="meta-item">
                    <Users size={12} /> {b.visibility === 'private' ? b.members.length : 'Cả workspace'}
                  </span>
                </span>
              </a>
              {admin && (
                <span className="tile-menu">
                  <Popover
                    trigger={({ toggle }) => (
                      <button className="icon-btn sm" onClick={toggle} aria-label={`Tùy chọn bảng ${b.name}`}>
                        <MoreHorizontal size={15} />
                      </button>
                    )}
                  >
                    {(close) => (
                      <div className="menu">
                        <button
                          onClick={() => {
                            s.setModal({ kind: 'boardSettings', boardId: b.id })
                            close()
                          }}
                        >
                          <Pencil size={14} /> Cài đặt bảng
                        </button>
                        <button
                          className="danger-text"
                          onClick={() => {
                            close()
                            if (window.confirm(`Xóa bảng “${b.name}” cùng toàn bộ công việc trong bảng?`)) s.deleteBoard(b.id)
                          }}
                        >
                          <Trash2 size={14} /> Xóa bảng
                        </button>
                      </div>
                    )}
                  </Popover>
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!s.boards.length && <p className="empty">Bạn chưa được thêm vào bảng nào. Hãy nhờ Admin mời bạn.</p>}
      {hidden > 0 && <p className="muted small hint-row">{hidden} bảng riêng tư khác không hiển thị vì bạn chưa phải thành viên của bảng.</p>}
    </div>
  )
}
