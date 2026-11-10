import React, { useEffect, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCorners, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Activity, Archive, Check, CheckCheck, ChevronDown, ChevronRight, Filter, Flag, GripVertical, Lock,
  MessageCircle, MoreHorizontal, Paperclip, Pencil, Plus, Rows3, Trash2, X,
} from 'lucide-react'
import { useStore } from '../store'
import { Avatar, DueChip, Popover, daysUntil } from '../ui'
import { colorHex } from '../data'
import type { Board, Card, List } from '../types'

type Filter = { assignee: string; due: '' | 'overdue' | 'week'; hideDone: boolean }

// Chặn "click mở card" ngay sau khi vừa thả một lần kéo
const drag = { active: false }

export default function BoardView({ id }: { id: string }) {
  const s = useStore()
  const board = s.data.boards.find((b) => b.id === id)
  const [filter, setFilter] = useState<Filter>({ assignee: '', due: '', hideDone: false })
  const [archivedOpen, setArchivedOpen] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!board) {
    return (
      <div className="page">
        <h1>Không tìm thấy bảng</h1>
        <p className="muted">
          Bảng này không tồn tại hoặc đã bị xóa. <a href="#/boards">Quay lại danh sách bảng</a>
        </p>
      </div>
    )
  }

  if (!s.canSee(board)) {
    return (
      <div className="page">
        <h1>Bảng riêng tư</h1>
        <p className="muted">
          Bạn chưa được thêm vào bảng này. Hãy nhờ Admin mời bạn. <a href="#/boards">Quay lại danh sách bảng</a>
        </p>
      </div>
    )
  }

  const match = (c: Card, listId: string) => {
    if (filter.hideDone && (c.done || listId === board.doneList)) return false
    if (filter.assignee && c.assignee !== filter.assignee) return false
    if (filter.due === 'overdue') return !!c.due && daysUntil(c.due) < 0
    if (filter.due === 'week') return !!c.due && daysUntil(c.due) >= 0 && daysUntil(c.due) <= 7
    return true
  }
  const filtering = !!(filter.assignee || filter.due || filter.hideDone)
  const archived = board.lists.flatMap((l) => l.cards.filter((c) => c.archived).map((c) => ({ c, l })))
  const boardLogs = s.data.logs.filter((l) => l.boardId === board.id).slice(0, 40)

  const onDragEnd = (e: DragEndEvent) => {
    window.setTimeout(() => (drag.active = false), 60)
    if (!e.over || e.active.id === e.over.id) return
    s.moveCard(board.id, String(e.active.id), String(e.over.id))
  }

  return (
    <div className="board-shell">
      <div className="board-main">
        <div className="board-toolbar">
          <span className="board-dot lg" style={{ background: colorHex(board.color) }} aria-hidden />
          <h1>{board.name}</h1>
          {board.visibility === 'private' && (
            <span className="muted" title="Bảng riêng tư, chỉ thành viên của bảng xem được">
              <Lock size={13} />
            </span>
          )}
          <span className="muted desc">{board.desc}</span>
          <span className="spacer" />

          <Popover
            trigger={({ toggle }) => (
              <button className={`btn ${filtering ? 'on' : ''}`} onClick={toggle}>
                <Filter size={14} /> Lọc{filtering && <i className="dot" />}
              </button>
            )}
          >
            {(close) => (
              <div className="menu wide">
                <label>
                  Người phụ trách
                  <select value={filter.assignee} onChange={(e) => setFilter({ ...filter, assignee: e.target.value })}>
                    <option value="">Tất cả</option>
                    {s.data.members.filter((m) => !m.pending).map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                        {m.name === s.user ? ' (tôi)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Deadline
                  <select value={filter.due} onChange={(e) => setFilter({ ...filter, due: e.target.value as Filter['due'] })}>
                    <option value="">Tất cả</option>
                    <option value="overdue">Quá hạn</option>
                    <option value="week">Trong 7 ngày</option>
                  </select>
                </label>
                <label className="check-line">
                  <input type="checkbox" checked={filter.hideDone} onChange={(e) => setFilter({ ...filter, hideDone: e.target.checked })} />
                  Ẩn việc đã hoàn thành
                </label>
                <div className="menu-actions">
                  <button className="btn" disabled={!filtering} onClick={() => setFilter({ assignee: '', due: '', hideDone: false })}>
                    Xóa lọc
                  </button>
                  <button className="btn primary" onClick={close}>
                    Xong
                  </button>
                </div>
              </div>
            )}
          </Popover>

          <button className={`btn ${s.ui.activity ? 'on' : ''}`} onClick={s.toggleActivity} aria-pressed={s.ui.activity}>
            <Activity size={14} /> Hoạt động
          </button>

          <Popover
            trigger={({ toggle }) => (
              <button className="icon-btn bordered" onClick={toggle} aria-label="Tùy chọn bảng">
                <MoreHorizontal size={16} />
              </button>
            )}
          >
            {(close) => (
              <div className="menu">
                <button
                  onClick={() => {
                    s.collapseEmpty(board.id, true)
                    close()
                  }}
                >
                  <Rows3 size={14} /> Thu gọn danh sách trống
                </button>
                <button
                  onClick={() => {
                    s.collapseEmpty(board.id, false)
                    close()
                  }}
                >
                  <Rows3 size={14} /> Mở rộng tất cả
                </button>
                <button
                  onClick={() => {
                    setArchivedOpen(true)
                    close()
                  }}
                >
                  <Archive size={14} /> Đã lưu trữ ({archived.length})
                </button>
                {s.role === 'Admin' && (
                  <>
                    <hr />
                    <button
                      onClick={() => {
                        s.setModal({ kind: 'boardSettings', boardId: board.id })
                        close()
                      }}
                    >
                      <Pencil size={14} /> Cài đặt bảng
                    </button>
                    <button
                      className="danger-text"
                      onClick={() => {
                        close()
                        if (window.confirm(`Xóa bảng “${board.name}” cùng toàn bộ công việc trong bảng?`)) {
                          s.deleteBoard(board.id)
                          location.hash = '#/boards'
                        }
                      }}
                    >
                      <Trash2 size={14} /> Xóa bảng
                    </button>
                  </>
                )}
              </div>
            )}
          </Popover>
        </div>

        <div className="board-scroll">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={() => (drag.active = true)}
            onDragCancel={() => (drag.active = false)}
            onDragEnd={onDragEnd}
          >
            <div className="columns">
              {board.lists.map((l) => (
                <Column key={l.id} board={board} list={l} match={match} />
              ))}
              {s.role === 'Admin' && <AddList boardId={board.id} />}
            </div>
          </DndContext>
        </div>
      </div>

      {s.ui.activity && (
        <aside className="activity" aria-label="Hoạt động">
          <div className="activity-head">
            <b>Hoạt động</b>
            <button className="icon-btn" onClick={s.toggleActivity} aria-label="Ẩn hoạt động">
              <X size={16} />
            </button>
          </div>
          <div className="activity-list">
            {boardLogs.map((l) => (
              <div className="log-row" key={l.id}>
                <Avatar name={l.by} size={24} />
                <p>
                  <b>{l.by}</b> {l.text}
                  <small>{l.time}</small>
                </p>
              </div>
            ))}
            {!boardLogs.length && <p className="empty">Chưa có hoạt động trong bảng này.</p>}
          </div>
        </aside>
      )}

      {archivedOpen && (
        <div className="backdrop center" onMouseDown={(e) => e.target === e.currentTarget && setArchivedOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Công việc đã lưu trữ">
            <div className="modal-head">
              <div>
                <h3>Đã lưu trữ</h3>
                <p>Khôi phục để đưa công việc về lại danh sách cũ.</p>
              </div>
              <button className="icon-btn" onClick={() => setArchivedOpen(false)} aria-label="Đóng">
                <X size={17} />
              </button>
            </div>
            {archived.length ? (
              archived.map(({ c, l }) => (
                <div className="archived-row" key={c.id}>
                  <span>
                    <b>{c.title}</b>
                    <small className="muted">{l.title}</small>
                  </span>
                  <button className="btn" onClick={() => s.restoreCard(board.id, c.id)}>
                    Khôi phục
                  </button>
                </div>
              ))
            ) : (
              <p className="empty">Chưa có công việc nào được lưu trữ.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Column({ board, list, match }: { board: Board; list: List; match: (c: Card, listId: string) => boolean }) {
  const s = useStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(list.title)
  const cards = list.cards.filter((c) => !c.archived)
  const shown = cards.filter((c) => match(c, list.id))
  const admin = s.role === 'Admin'

  const { setNodeRef, isOver } = useDroppable({ id: list.id })

  if (list.collapsed) {
    return (
      <button
        ref={setNodeRef as React.Ref<HTMLButtonElement>}
        className={`column-collapsed ${isOver ? 'over' : ''}`}
        onClick={() => s.toggleCollapse(board.id, list.id)}
        title="Mở rộng danh sách"
      >
        <ChevronRight size={14} />
        <span className="count">{cards.length}</span>
        <span className="vtitle">{list.title}</span>
      </button>
    )
  }

  const commitName = () => {
    if (name.trim() && name.trim() !== list.title) s.renameList(board.id, list.id, name)
    else setName(list.title)
    setEditing(false)
  }

  return (
    <section className="column" aria-label={list.title}>
      <div className="column-head">
        <button className="icon-btn sm" onClick={() => s.toggleCollapse(board.id, list.id)} aria-label="Thu gọn danh sách" title="Thu gọn">
          <ChevronDown size={15} />
        </button>
        {editing ? (
          <input
            className="inline-input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') {
                setName(list.title)
                setEditing(false)
              }
            }}
          />
        ) : (
          <h2 title={list.title}>{list.title}</h2>
        )}
        <span className="count">{shown.length === cards.length ? cards.length : `${shown.length}/${cards.length}`}</span>
        {admin && (
          <Popover
            trigger={({ toggle }) => (
              <button className="icon-btn sm" onClick={toggle} aria-label="Tùy chọn danh sách">
                <MoreHorizontal size={15} />
              </button>
            )}
          >
            {(close) => (
              <div className="menu">
                <button
                  onClick={() => {
                    setName(list.title)
                    setEditing(true)
                    close()
                  }}
                >
                  Đổi tên
                </button>
                <button
                  className="danger-text"
                  onClick={() => {
                    s.deleteList(board.id, list.id)
                    close()
                  }}
                >
                  Xóa danh sách
                </button>
              </div>
            )}
          </Popover>
        )}
      </div>

      <SortableContext items={shown.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`card-stack ${isOver ? 'over' : ''}`}>
          {shown.map((c) => (
            <TaskCard
              key={c.id}
              card={c}
              done={!!c.done || list.id === board.doneList}
              canTick={admin}
              onTick={() => s.toggleDone(board.id, c.id)}
              onOpen={() => s.setOpenCard({ boardId: board.id, cardId: c.id })}
            />
          ))}
        </div>
      </SortableContext>

      <AddCard boardId={board.id} listId={list.id} />
    </section>
  )
}

type TaskCardProps = { card: Card; done: boolean; canTick: boolean; onTick: () => void; onOpen: () => void }

function TaskCard({ card, done, canTick, onTick, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const checked = card.checklist.filter((x) => x.done).length
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }}
      className={`task-card ${done ? 'is-done' : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => !drag.active && onOpen()}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      {card.labels.length > 0 && (
        <div className="tags">
          {card.labels.map((l) => (
            <span className="tag" key={l}>
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="card-title">
        <button
          type="button"
          className={`tick ${card.done ? 'on' : ''}`}
          disabled={!canTick}
          title={canTick ? (card.done ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành') : 'Chỉ Admin xác nhận hoàn thành'}
          aria-label={card.done ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
          aria-pressed={!!card.done}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onTick()
          }}
        >
          <Check size={11} strokeWidth={3} />
        </button>
        <h3>{card.title}</h3>
      </div>
      <div className="meta">
        <DueChip due={card.due} />
        {card.priority === 'Cao' && (
          <span className="meta-item" title="Ưu tiên cao">
            <Flag size={12} />
          </span>
        )}
        {card.checklist.length > 0 && (
          <span className="meta-item" title="Checklist">
            <CheckCheck size={13} />
            {checked}/{card.checklist.length}
          </span>
        )}
        {card.comments.length > 0 && (
          <span className="meta-item" title="Bình luận">
            <MessageCircle size={13} />
            {card.comments.length}
          </span>
        )}
        {card.files.length > 0 && (
          <span className="meta-item" title="Tệp đính kèm">
            <Paperclip size={13} />
            {card.files.length}
          </span>
        )}
        <span className="spacer" />
        <Avatar name={card.assignee} size={22} />
      </div>
      <GripVertical className="grip" size={14} aria-hidden />
    </article>
  )
}

function AddCard({ boardId, listId }: { boardId: string; listId: string }) {
  const s = useStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  const submit = () => {
    if (!title.trim()) return
    s.createCard(boardId, listId, title)
    setTitle('')
    ref.current?.focus()
  }
  if (!open)
    return (
      <button className="add-btn" onClick={() => setOpen(true)}>
        <Plus size={15} /> Thêm công việc
      </button>
    )
  return (
    <div className="composer">
      <textarea
        ref={ref}
        rows={2}
        value={title}
        placeholder="Nhập tên công việc, Enter để thêm"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
          if (e.key === 'Escape') {
            e.stopPropagation()
            setOpen(false)
            setTitle('')
          }
        }}
      />
      <div className="composer-actions">
        <button className="btn primary" onClick={submit} disabled={!title.trim()}>
          Thêm
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            setOpen(false)
            setTitle('')
          }}
          aria-label="Hủy"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

function AddList({ boardId }: { boardId: string }) {
  const s = useStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  if (!open)
    return (
      <button className="add-list" onClick={() => setOpen(true)}>
        <Plus size={15} /> Thêm danh sách
      </button>
    )
  const submit = () => {
    if (!title.trim()) return
    s.createList(boardId, title)
    setTitle('')
    setOpen(false)
  }
  return (
    <div className="column add-list-form">
      <input
        className="inline-input"
        autoFocus
        value={title}
        placeholder="Tên danh sách"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') {
            e.stopPropagation()
            setOpen(false)
            setTitle('')
          }
        }}
      />
      <div className="composer-actions">
        <button className="btn primary" onClick={submit} disabled={!title.trim()}>
          Thêm
        </button>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Hủy">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
