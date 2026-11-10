import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { Avatar } from '../ui'
import type { Role } from '../types'

export default function Members() {
  const s = useStore()
  const admin = s.role === 'Admin'
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Thành viên</h1>
          <p className="muted">Admin gồm PM, Leader và Reviewer. Người ngoài team chỉ vào được khi Admin mời qua Gmail.</p>
        </div>
        {admin ? (
          <button className="btn primary" onClick={() => s.setModal('invite')}>
            <Plus size={15} /> Mời thành viên
          </button>
        ) : (
          <span className="muted small">Chỉ Admin mời được thành viên</span>
        )}
      </div>

      <div className="panel table">
        <div className="trow thead">
          <span>Thành viên</span>
          <span>Vai trò</span>
          <span />
        </div>
        {s.data.members.map((m) => (
          <div className="trow" key={m.email}>
            <span className="person">
              <Avatar name={m.name} size={30} />
              <span>
                <b>{m.name}</b>
                <small className="muted">
                  {m.email}
                  {m.pending && ' · Đã mời, chờ chấp nhận'}
                </small>
              </span>
            </span>
            <span>
              {admin ? (
                <select value={m.role} onChange={(e) => s.setMemberRole(m.name, e.target.value as Role)} aria-label={`Vai trò của ${m.name}`}>
                  <option>Admin</option>
                  <option>Member</option>
                </select>
              ) : (
                m.role
              )}
            </span>
            <span className="end">
              {admin && m.name !== s.user && (
                <button className="icon-btn" title="Xóa khỏi team" onClick={() => s.removeMember(m.name)}>
                  <Trash2 size={15} />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
