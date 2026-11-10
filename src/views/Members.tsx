import { useState } from 'react'
import { Check, Copy, Link2, Minus, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { Avatar, Popover } from '../ui'
import type { Role } from '../types'

/** CF2 – ma trận phân quyền, hiển thị để cả team cùng thấy ai làm được gì. */
const matrix: { action: string; admin: boolean; member: boolean; note?: string }[] = [
  { action: 'Xem bảng được chia sẻ', admin: true, member: true },
  { action: 'Tạo, sửa, xóa công việc của mình', admin: true, member: true },
  { action: 'Bình luận và đính kèm evidence', admin: true, member: true },
  { action: 'Kéo công việc theo luồng cho phép', admin: true, member: true, note: 'Member chỉ kéo việc của mình, theo đúng luật của bảng' },
  { action: 'Giao việc cho người khác', admin: true, member: false },
  { action: 'Xác nhận hoàn thành (tick)', admin: true, member: false },
  { action: 'Tạo, đổi tên, xóa danh sách', admin: true, member: false },
  { action: 'Tạo, sửa, xóa bảng và đổi quyền riêng tư', admin: true, member: false },
  { action: 'Mời và xóa thành viên, đổi vai trò', admin: true, member: false },
]

export default function Members() {
  const s = useStore()
  const admin = s.role === 'Admin'
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(s.inviteLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      s.notify('Trình duyệt chặn sao chép, hãy chọn và copy thủ công')
    }
  }

  const scopeLabel = (boards: string[] | null) => {
    if (!boards) return 'Toàn workspace'
    const names = boards.map((id) => s.data.boards.find((b) => b.id === id)?.name ?? id)
    return names.length ? `Khách · ${names.join(', ')}` : 'Khách · chưa gán bảng'
  }

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

      {admin && (
        <section className="panel invite-panel">
          <div className="section-row">
            <h2>
              <Link2 size={14} /> Link mời vào workspace
            </h2>
            <button className="btn" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Đã sao chép' : 'Sao chép link'}
            </button>
          </div>
          <input className="invite-link" readOnly value={s.inviteLink} onFocus={(e) => e.currentTarget.select()} aria-label="Link mời" />
          <p className="muted small">
            Người mở link sẽ đăng nhập Google rồi vào workspace với vai trò Member. Bản demo chưa gắn Firebase Auth nên link chưa hoạt động thật.
          </p>
        </section>
      )}

      <section className="panel table">
        <div className="trow thead four">
          <span>Thành viên</span>
          <span>Phạm vi truy cập</span>
          <span>Vai trò</span>
          <span />
        </div>
        {s.data.members.map((m) => (
          <div className="trow four" key={m.email}>
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
            <span className="muted small">
              {admin ? (
                <Popover
                  trigger={({ toggle }) => (
                    <button className="btn scope-btn" onClick={toggle}>
                      {scopeLabel(m.boards)}
                    </button>
                  )}
                >
                  {() => (
                    <div className="menu wide">
                      <span className="menu-hint">Chọn bảng mà {m.name} được vào. Bỏ chọn hết nghĩa là vào được toàn workspace.</span>
                      {s.data.boards.map((b) => {
                        const on = !!m.boards?.includes(b.id)
                        return (
                          <label className="check-line" key={b.id}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => {
                                const cur = m.boards ?? []
                                const next = on ? cur.filter((x) => x !== b.id) : [...cur, b.id]
                                s.setMemberBoards(m.name, next.length ? next : null)
                              }}
                            />
                            {b.name}
                          </label>
                        )
                      })}
                      <button className="btn" onClick={() => s.setMemberBoards(m.name, null)} disabled={!m.boards}>
                        <Minus size={13} /> Bỏ giới hạn, cho vào toàn workspace
                      </button>
                    </div>
                  )}
                </Popover>
              ) : (
                scopeLabel(m.boards)
              )}
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
                <button
                  className="icon-btn"
                  title="Xóa khỏi workspace"
                  onClick={() => {
                    const open = s.data.boards.flatMap((b) => b.lists.flatMap((l) => l.cards)).filter((c) => !c.archived && c.assignee === m.name).length
                    const warn = open ? `\n\n${m.name} đang phụ trách ${open} công việc. Hãy giao lại trước khi xóa.` : ''
                    if (window.confirm(`Xóa ${m.name} khỏi workspace?${warn}`)) s.removeMember(m.name)
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </span>
          </div>
        ))}
      </section>

      <section className="panel table">
        <div className="trow thead perm">
          <span>Thao tác</span>
          <span>Admin</span>
          <span>Member</span>
        </div>
        {matrix.map((r) => (
          <div className="trow perm" key={r.action}>
            <span>
              {r.action}
              {r.note && <small className="muted block">{r.note}</small>}
            </span>
            <span className={r.admin ? 'yes' : 'no'}>{r.admin ? <Check size={15} /> : <Minus size={15} />}</span>
            <span className={r.member ? 'yes' : 'no'}>{r.member ? <Check size={15} /> : <Minus size={15} />}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
