import { ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { Avatar, DueChip, daysUntil } from '../ui'
import type { Board, Card, List } from '../types'

type Row = { b: Board; l: List; c: Card }

export default function Dashboard() {
  const s = useStore()
  const { boards, logs } = s.data
  const mine: Row[] = []
  const approve: Row[] = []
  let doneMine = 0

  boards.forEach((b) =>
    b.lists.forEach((l) =>
      l.cards.forEach((c) => {
        if (c.archived) return
        const isDone = l.id === b.doneList
        if (c.assignee === s.user) (isDone ? (doneMine += 1) : mine.push({ b, l, c }))
        if (s.role === 'Admin' && b.approveList && l.id === b.approveList) approve.push({ b, l, c })
      }),
    ),
  )
  mine.sort((a, z) => (a.c.due || '9').localeCompare(z.c.due || '9'))

  const overdue = mine.filter((r) => r.c.due && daysUntil(r.c.due) < 0).length
  const soon = mine.filter((r) => r.c.due && daysUntil(r.c.due) >= 0 && daysUntil(r.c.due) <= 3).length
  const firstName = s.user.split(' ').slice(-1)[0]
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

  const stats: { label: string; value: number; warn?: boolean }[] = [
    { label: 'Việc đang mở', value: mine.length },
    { label: 'Quá hạn', value: overdue, warn: overdue > 0 },
    { label: 'Hạn trong 3 ngày', value: soon },
    s.role === 'Admin' ? { label: 'Chờ duyệt', value: approve.length } : { label: 'Đã hoàn thành', value: doneMine },
  ]

  const open = (r: Row) => s.setOpenCard({ boardId: r.b.id, cardId: r.c.id })
  const rowEl = (r: Row) => (
    <button key={r.c.id} className="task-row" onClick={() => open(r)}>
      <span className="task-row-main">
        <span className="task-row-title">{r.c.title}</span>
        <span className="task-row-where">
          {r.b.name} · {r.l.title}
        </span>
      </span>
      <DueChip due={r.c.due} />
      <Avatar name={r.c.assignee} size={22} />
    </button>
  )

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Xin chào, {firstName}</h1>
          <p className="muted">{today}</p>
        </div>
      </div>

      <div className="stats">
        {stats.map((x) => (
          <div className="stat" key={x.label}>
            <span className="stat-label">{x.label}</span>
            <span className={`stat-value ${x.warn ? 'warn' : ''}`}>{x.value}</span>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-col">
          <section className="panel">
            <h2>Việc của tôi</h2>
            {mine.length ? (
              mine.map(rowEl)
            ) : (
              <p className="empty">Bạn chưa có việc nào đang mở. <a href="#/boards">Xem các bảng</a></p>
            )}
          </section>
          {s.role === 'Admin' && (
            <section className="panel">
              <h2>Chờ duyệt</h2>
              {approve.length ? approve.map(rowEl) : <p className="empty">Không có công việc nào chờ duyệt.</p>}
            </section>
          )}
        </div>

        <div className="dash-col side">
          <section className="panel">
            <h2>Tiến độ các bảng</h2>
            {boards.map((b) => {
              const all = b.lists.flatMap((l) => l.cards.filter((c) => !c.archived).map(() => l.id))
              const done = all.filter((id) => id === b.doneList).length
              const pct = all.length ? Math.round((done / all.length) * 100) : 0
              return (
                <a className="progress-row" href={`#/board/${b.id}`} key={b.id}>
                  <span className="progress-top">
                    <b>{b.name}</b>
                    <span className="muted">
                      {done}/{all.length} xong
                    </span>
                    <ChevronRight size={14} />
                  </span>
                  <span className="bar" aria-label={`${pct}% hoàn thành`}>
                    <i style={{ width: `${pct}%` }} />
                  </span>
                </a>
              )
            })}
          </section>

          <section className="panel">
            <h2>Hoạt động gần đây</h2>
            {logs.slice(0, 6).map((l) => (
              <div className="log-row" key={l.id}>
                <Avatar name={l.by} size={24} />
                <p>
                  <b>{l.by}</b> {l.text}
                  <small>
                    {l.time} · {boards.find((b) => b.id === l.boardId)?.name}
                  </small>
                </p>
              </div>
            ))}
            {!logs.length && <p className="empty">Chưa có hoạt động.</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
