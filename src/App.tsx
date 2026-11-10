import React, { useEffect, useMemo, useState } from 'react'
import { Bell, FolderKanban, LayoutDashboard, LayoutGrid, PanelLeft, Plus, Search, Users } from 'lucide-react'
import { Provider, useStore } from './store'
import { Avatar, Modal, Popover, daysUntil } from './ui'
import type { Template } from './data'
import Dashboard from './views/Dashboard'
import Boards from './views/Boards'
import BoardView from './views/BoardView'
import Members from './views/Members'
import CardDetail from './CardDetail'

function useRoute() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const f = () => setHash(location.hash)
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const [name = '', id = ''] = hash.replace(/^#\/?/, '').split('/')
  return { name: name || 'dashboard', id }
}

export default function App() {
  return (
    <Provider>
      <Shell />
    </Provider>
  )
}

function Shell() {
  const s = useStore()
  const route = useRoute()
  const [search, setSearch] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch(true)
      } else if (e.key === 'Escape') {
        if (search) setSearch(false)
        else if (s.modal) s.setModal(null)
        else if (s.openCard) s.setOpenCard(null)
      } else if (!typing && e.key === '[') s.toggleNav()
      else if (!typing && e.key === '/') {
        e.preventDefault()
        setSearch(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Đóng menu trên màn hình hẹp sau khi chuyển trang
  useEffect(() => {
    if (window.innerWidth < 900 && s.ui.nav) s.toggleNav()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.name, route.id])

  let view: React.ReactNode
  if (route.name === 'boards') view = <Boards />
  else if (route.name === 'board') view = <BoardView id={route.id} key={route.id} />
  else if (route.name === 'members') view = <Members />
  else view = <Dashboard />

  return (
    <div className={`app ${s.ui.nav ? '' : 'nav-hidden'}`}>
      <Sidebar route={route} />
      <div className="scrim" onClick={s.toggleNav} />
      <div className="main">
        <Topbar route={route} onSearch={() => setSearch(true)} />
        <div className="content">{view}</div>
      </div>
      <CardDetail />
      {search && <SearchModal onClose={() => setSearch(false)} />}
      {s.modal === 'newBoard' && <NewBoardModal />}
      {s.modal === 'invite' && <InviteModal />}
    </div>
  )
}

function Sidebar({ route }: { route: { name: string; id: string } }) {
  const s = useStore()
  return (
    <aside className="sidebar" aria-label="Điều hướng" aria-hidden={!s.ui.nav}>
      <div className="brand">
        <span className="brand-mark">
          <LayoutGrid size={15} />
        </span>
        <span>
          <b>Northstar Studio</b>
          <small>Workspace nội bộ</small>
        </span>
      </div>

      <nav>
        <a className={`nav-item ${route.name === 'dashboard' ? 'active' : ''}`} href="#/">
          <LayoutDashboard size={16} /> Tổng quan
        </a>
        <a className={`nav-item ${route.name === 'boards' ? 'active' : ''}`} href="#/boards">
          <FolderKanban size={16} /> Tất cả bảng
        </a>
        <a className={`nav-item ${route.name === 'members' ? 'active' : ''}`} href="#/members">
          <Users size={16} /> Thành viên
        </a>
      </nav>

      <div className="nav-section">
        <span>Bảng</span>
        {s.role === 'Admin' && (
          <button className="icon-btn sm" onClick={() => s.setModal('newBoard')} aria-label="Tạo bảng">
            <Plus size={14} />
          </button>
        )}
      </div>
      <nav className="board-links">
        {s.data.boards.map((b) => (
          <a key={b.id} className={`nav-item ${route.name === 'board' && route.id === b.id ? 'active' : ''}`} href={`#/board/${b.id}`}>
            <span className="board-dot" /> {b.name}
          </a>
        ))}
      </nav>

      <p className="shortcuts">
        <kbd>[</kbd> ẩn/hiện menu · <kbd>⌘K</kbd> tìm kiếm
      </p>
    </aside>
  )
}

function Topbar({ route, onSearch }: { route: { name: string; id: string }; onSearch: () => void }) {
  const s = useStore()
  const board = s.data.boards.find((b) => b.id === route.id)
  const title =
    route.name === 'boards' ? 'Tất cả bảng' : route.name === 'members' ? 'Thành viên' : route.name === 'board' ? board?.name ?? 'Bảng' : 'Tổng quan'

  // Thông báo: việc sắp đến hạn của tôi + hoạt động của người khác trên việc tôi phụ trách (Admin thấy tất cả)
  const items = useMemo(() => {
    const out: { id: string; text: React.ReactNode; meta: string; who?: string }[] = []
    s.data.boards.forEach((b) =>
      b.lists.forEach((l) =>
        l.cards.forEach((c) => {
          if (!c.archived && c.assignee === s.user && c.due && l.id !== b.doneList && daysUntil(c.due) <= 1) {
            const n = daysUntil(c.due)
            out.push({
              id: `due-${c.id}-${c.due}`,
              text: <>“{c.title}” {n < 0 ? 'đã quá hạn' : n === 0 ? 'đến hạn hôm nay' : 'đến hạn ngày mai'}</>,
              meta: b.name,
            })
          }
        }),
      ),
    )
    s.data.logs.forEach((l) => {
      if (l.by === s.user) return
      const card = s.data.boards.find((b) => b.id === l.boardId)?.lists.flatMap((x) => x.cards).find((c) => c.id === l.cardId)
      if (!card && s.role !== 'Admin') return
      if (card && card.assignee !== s.user && s.role !== 'Admin') return
      out.push({ id: l.id, who: l.by, text: <>{l.text}</>, meta: `${l.time} · ${s.data.boards.find((b) => b.id === l.boardId)?.name ?? ''}` })
    })
    return out.slice(0, 8)
  }, [s.data, s.user, s.role])
  const unread = items.filter((i) => !s.ui.seen.includes(i.id)).length

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={s.toggleNav} aria-label={s.ui.nav ? 'Ẩn menu' : 'Hiện menu'} aria-pressed={s.ui.nav} title="Ẩn/hiện menu  [">
        <PanelLeft size={17} />
      </button>
      <div className="crumb">
        {route.name === 'board' ? (
          <>
            <a href="#/boards">Bảng</a>
            <span>›</span>
            <b>{title}</b>
          </>
        ) : (
          <b>{title}</b>
        )}
      </div>
      <span className="spacer" />

      <button className="search-btn" onClick={onSearch}>
        <Search size={14} />
        <span>Tìm công việc</span>
        <kbd>⌘K</kbd>
      </button>

      <Popover
        trigger={({ toggle }) => (
          <button className="icon-btn bell" onClick={toggle} aria-label="Thông báo">
            <Bell size={17} />
            {unread > 0 && <i className="badge">{unread}</i>}
          </button>
        )}
      >
        {() => (
          <div className="menu notif">
            <div className="menu-title">
              <b>Thông báo</b>
              {unread > 0 && (
                <button className="link-btn" onClick={() => s.markSeen(items.map((i) => i.id))}>
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
            {items.map((i) => (
              <div className={`notif-row ${s.ui.seen.includes(i.id) ? '' : 'unread'}`} key={i.id}>
                {i.who ? <Avatar name={i.who} size={24} /> : <span className="notif-dot" />}
                <p>
                  {i.who && <b>{i.who} </b>}
                  {i.text}
                  <small>{i.meta}</small>
                </p>
              </div>
            ))}
            {!items.length && <p className="empty">Chưa có thông báo mới.</p>}
          </div>
        )}
      </Popover>

      <Popover
        trigger={({ toggle }) => (
          <button className="me-btn" onClick={toggle} aria-label="Tài khoản">
            <Avatar name={s.user} size={28} />
          </button>
        )}
      >
        {(close) => (
          <div className="menu account">
            <div className="menu-title">
              <span>
                <b>{s.user}</b>
                <small className="muted">{s.role === 'Admin' ? 'Admin (PM, Leader, Reviewer)' : 'Member'}</small>
              </span>
            </div>
            <p className="menu-hint">Chế độ demo: chọn người dùng để thử quyền Admin và Member.</p>
            {s.data.members
              .filter((m) => !m.pending)
              .map((m) => (
                <button
                  key={m.name}
                  className={m.name === s.user ? 'current' : ''}
                  onClick={() => {
                    s.setUser(m.name)
                    close()
                  }}
                >
                  <Avatar name={m.name} size={20} /> {m.name}
                  <span className="muted small right">{m.role}</span>
                </button>
              ))}
            <hr />
            <button
              onClick={() => {
                close()
                if (window.confirm('Đặt lại toàn bộ dữ liệu mẫu? Các thay đổi trên trình duyệt này sẽ mất.')) s.reset()
              }}
            >
              Đặt lại dữ liệu mẫu
            </button>
          </div>
        )}
      </Popover>
    </header>
  )
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return []
    const out: { boardId: string; boardName: string; listTitle: string; id: string; title: string; assignee: string }[] = []
    s.data.boards.forEach((b) =>
      b.lists.forEach((l) =>
        l.cards.forEach((c) => {
          const hay = `${c.title} ${c.desc} ${c.assignee} ${c.labels.join(' ')} ${c.comments.map((x) => x.text).join(' ')}`.toLowerCase()
          if (!c.archived && hay.includes(k)) out.push({ boardId: b.id, boardName: b.name, listTitle: l.title, id: c.id, title: c.title, assignee: c.assignee })
        }),
      ),
    )
    return out.slice(0, 12)
  }, [q, s.data.boards])

  const pick = (r: (typeof results)[number]) => {
    onClose()
    s.setOpenCard({ boardId: r.boardId, cardId: r.id })
  }

  return (
    <div className="backdrop top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="search-modal" role="dialog" aria-modal="true" aria-label="Tìm kiếm">
        <div className="search-input">
          <Search size={16} />
          <input
            autoFocus
            value={q}
            placeholder="Tìm theo tên, mô tả, người phụ trách, nhãn, bình luận…"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && results[0] && pick(results[0])}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="search-results">
          {results.map((r) => (
            <button key={r.id} onClick={() => pick(r)}>
              <span>
                <b>{r.title}</b>
                <small className="muted">
                  {r.boardName} · {r.listTitle}
                </small>
              </span>
              <Avatar name={r.assignee} size={22} />
            </button>
          ))}
          {q.trim() && !results.length && <p className="empty">Không tìm thấy công việc phù hợp.</p>}
          {!q.trim() && <p className="empty">Gõ để tìm trong tất cả các bảng.</p>}
        </div>
      </div>
    </div>
  )
}

function NewBoardModal() {
  const s = useStore()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [tpl, setTpl] = useState<Template>('basic')
  const submit = () => {
    const id = s.createBoard(name, desc, tpl)
    if (id) {
      s.setModal(null)
      location.hash = `#/board/${id}`
    }
  }
  return (
    <Modal title="Tạo bảng" sub="Chọn mẫu danh sách, Admin có thể thêm hoặc đổi tên danh sách sau." onClose={() => s.setModal(null)}>
      <label className="field">
        Tên bảng
        <input autoFocus value={name} placeholder="Ví dụ: QA Team" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </label>
      <label className="field">
        Mô tả (không bắt buộc)
        <input value={desc} onChange={(e) => setDesc(e.target.value)} />
      </label>
      <label className="field">
        Mẫu danh sách
        <select value={tpl} onChange={(e) => setTpl(e.target.value as Template)}>
          <option value="basic">Cơ bản: Cần làm, Đang làm, Chờ duyệt, Hoàn thành</option>
          <option value="dev">Developer: 12 danh sách theo quy trình của team</option>
        </select>
      </label>
      <div className="modal-actions">
        <button className="btn" onClick={() => s.setModal(null)}>
          Hủy
        </button>
        <button className="btn primary" disabled={!name.trim()} onClick={submit}>
          Tạo bảng
        </button>
      </div>
    </Modal>
  )
}

function InviteModal() {
  const s = useStore()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Admin' | 'Member'>('Member')
  const submit = () => {
    if (s.addMember(email, role)) s.setModal(null)
  }
  return (
    <Modal title="Mời thành viên" sub="Người ngoài team chỉ vào được khi Admin mời qua Gmail." onClose={() => s.setModal(null)}>
      <label className="field">
        Địa chỉ Gmail
        <input autoFocus type="email" value={email} placeholder="ten@gmail.com" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </label>
      <label className="field">
        Vai trò
        <select value={role} onChange={(e) => setRole(e.target.value as 'Admin' | 'Member')}>
          <option>Member</option>
          <option>Admin</option>
        </select>
      </label>
      <div className="modal-actions">
        <button className="btn" onClick={() => s.setModal(null)}>
          Hủy
        </button>
        <button className="btn primary" disabled={!email.trim()} onClick={submit}>
          Gửi lời mời
        </button>
      </div>
    </Modal>
  )
}
