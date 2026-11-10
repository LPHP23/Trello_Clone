import React, { useState } from 'react'
import { Archive, Check, Eye, EyeOff, FileText, Plus, X } from 'lucide-react'
import { useStore } from './store'
import { Avatar } from './ui'
import type { Priority } from './types'

/** Làm nổi bật @tên trong bình luận. */
function renderText(text: string) {
  return text.split(/(@\p{L}+(?:\s\p{L}+)?)/gu).map((part, i) => (part.startsWith('@') ? <b key={i} className="mention">{part}</b> : <span key={i}>{part}</span>))
}

export default function CardDetail() {
  const s = useStore()
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  const [comment, setComment] = useState('')
  const [checkText, setCheckText] = useState('')
  const [fileText, setFileText] = useState('')
  const [labelText, setLabelText] = useState('')
  const [editTitle, setEditTitle] = useState(false)

  const o = s.openCard
  if (!o) return null
  const board = s.data.boards.find((b) => b.id === o.boardId)
  const list = board?.lists.find((l) => l.cards.some((c) => c.id === o.cardId))
  const card = list?.cards.find((c) => c.id === o.cardId)
  if (!board || !list || !card) return null

  const canEdit = s.role === 'Admin' || card.assignee === s.user
  const isAdmin = s.role === 'Admin'
  const patch = (p: Partial<typeof card>, log?: string) => s.patchCard(board.id, card.id, p, log)
  const close = () => s.setOpenCard(null)
  const done = card.checklist.filter((x) => x.done).length
  const pct = card.checklist.length ? Math.round((done / card.checklist.length) * 100) : 0
  const cardLogs = s.data.logs.filter((l) => l.cardId === card.id)
  const isDone = !!card.done || list.id === board.doneList

  const sendComment = () => {
    if (!comment.trim()) return
    s.addComment(board.id, card.id, comment)
    setComment('')
  }
  const addCheck = () => {
    if (!checkText.trim()) return
    patch({ checklist: [...card.checklist, { text: checkText.trim(), done: false }] })
    setCheckText('')
  }
  const addFile = () => {
    if (!fileText.trim()) return
    patch({ files: [...card.files, fileText.trim()] })
    setFileText('')
  }
  const addLabel = () => {
    const t = labelText.trim()
    if (!t || card.labels.includes(t)) return setLabelText('')
    patch({ labels: [...card.labels, t] })
    setLabelText('')
  }
  const enter = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      fn()
    }
  }

  return (
    <div className="backdrop right" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={card.title}>
        <header className="drawer-head">
          <span className="crumb-inline">
            <a href={`#/board/${board.id}`} onClick={close}>{board.name}</a>
            <span>›</span>
            <span>{list.title}</span>
          </span>
          <span className="spacer" />
          <button
            className={`btn tick-btn ${card.done ? 'on' : ''}`}
            onClick={() => s.toggleDone(board.id, card.id)}
            disabled={!isAdmin}
            title={isAdmin ? (card.done ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành') : 'Chỉ Admin được xác nhận hoàn thành'}
            aria-pressed={!!card.done}
          >
            <Check size={14} strokeWidth={3} />
            {card.done ? 'Đã hoàn thành' : 'Hoàn thành'}
          </button>
          <button
            className="icon-btn"
            onClick={() => patch({ watching: !card.watching })}
            title={card.watching ? 'Bỏ theo dõi' : 'Theo dõi công việc'}
            aria-pressed={!!card.watching}
          >
            {card.watching ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button className="icon-btn" onClick={() => s.archiveCard(board.id, card.id)} title="Lưu trữ" disabled={!canEdit}>
            <Archive size={16} />
          </button>
          <button className="icon-btn" onClick={close} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>

        <div className={`drawer-body ${isDone ? 'is-done' : ''}`}>
          {editTitle && canEdit ? (
            <input
              className="title-input"
              autoFocus
              value={card.title}
              onChange={(e) => patch({ title: e.target.value })}
              onBlur={() => setEditTitle(false)}
              onKeyDown={enter(() => setEditTitle(false))}
            />
          ) : (
            <h2 className={canEdit ? 'editable' : ''} onClick={() => canEdit && setEditTitle(true)} title={canEdit ? 'Bấm để sửa tên' : undefined}>
              {card.title}
            </h2>
          )}
          {card.done && (
            <p className="note done-note">
              <Check size={14} strokeWidth={3} /> {card.doneBy ?? 'Admin'} đã xác nhận hoàn thành{card.doneAt ? ` lúc ${card.doneAt}` : ''}.
            </p>
          )}
          {!canEdit && <p className="note">Chỉ Admin hoặc người phụ trách mới chỉnh sửa được công việc này. Bạn vẫn có thể bình luận.</p>}

          <div className="props">
            <label>
              <span>Người phụ trách</span>
              {isAdmin ? (
                <select
                  value={card.assignee}
                  onChange={(e) => patch({ assignee: e.target.value }, `đã giao “${card.title}” cho ${e.target.value}`)}
                >
                  {s.data.members.filter((m) => !m.pending).map((m) => (
                    <option key={m.name}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <span className="static">
                  <Avatar name={card.assignee} size={20} /> {card.assignee}
                </span>
              )}
            </label>
            <label>
              <span>Deadline</span>
              <input type="date" value={card.due} disabled={!canEdit} onChange={(e) => patch({ due: e.target.value })} />
            </label>
            <label>
              <span>Ưu tiên</span>
              <select value={card.priority} disabled={!canEdit} onChange={(e) => patch({ priority: e.target.value as Priority })}>
                <option>Cao</option>
                <option>Vừa</option>
                <option>Thấp</option>
              </select>
            </label>
            <div className="prop-labels">
              <span>Nhãn</span>
              <div className="tags">
                {card.labels.map((l) => (
                  <span className="tag removable" key={l}>
                    {l}
                    {canEdit && (
                      <button onClick={() => patch({ labels: card.labels.filter((x) => x !== l) })} aria-label={`Xóa nhãn ${l}`}>
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
                {canEdit && (
                  <input
                    className="tag-input"
                    placeholder="+ Nhãn"
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    onKeyDown={enter(addLabel)}
                    onBlur={addLabel}
                  />
                )}
              </div>
            </div>
          </div>

          <section>
            <h3>Mô tả</h3>
            <textarea
              rows={3}
              value={card.desc}
              disabled={!canEdit}
              placeholder="Thêm mô tả, mục tiêu và tiêu chí hoàn thành…"
              onChange={(e) => patch({ desc: e.target.value })}
            />
          </section>

          <section>
            <div className="section-row">
              <h3>Checklist</h3>
              {card.checklist.length > 0 && (
                <span className="muted small">
                  {done}/{card.checklist.length}
                </span>
              )}
            </div>
            {card.checklist.length > 0 && (
              <span className="bar" aria-label={`${pct}% checklist`}>
                <i style={{ width: `${pct}%` }} />
              </span>
            )}
            {card.checklist.map((item, i) => (
              <label className="check-row" key={i}>
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={!canEdit}
                  onChange={() => patch({ checklist: card.checklist.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })}
                />
                <span className={item.done ? 'checked' : ''}>{item.text}</span>
                {canEdit && (
                  <button type="button" onClick={() => patch({ checklist: card.checklist.filter((_, j) => j !== i) })} aria-label="Xóa mục">
                    <X size={13} />
                  </button>
                )}
              </label>
            ))}
            {canEdit && (
              <div className="add-inline">
                <Plus size={14} />
                <input placeholder="Thêm mục, Enter để lưu" value={checkText} onChange={(e) => setCheckText(e.target.value)} onKeyDown={enter(addCheck)} />
              </div>
            )}
          </section>

          <section>
            <h3>Tệp đính kèm</h3>
            {card.files.map((f, i) => (
              <div className="file-row" key={i}>
                <FileText size={15} />
                <span>{f}</span>
                {canEdit && (
                  <button onClick={() => patch({ files: card.files.filter((_, j) => j !== i) })} aria-label="Xóa tệp">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            {canEdit && (
              <div className="add-inline">
                <Plus size={14} />
                <input placeholder="Tên tệp hoặc link (PR, ảnh, video)…" value={fileText} onChange={(e) => setFileText(e.target.value)} onKeyDown={enter(addFile)} />
              </div>
            )}
            <p className="muted small">Bản demo chỉ lưu tên tệp. Tải tệp thật sẽ dùng Cloud Storage.</p>
          </section>

          <section>
            <div className="tabs">
              <button className={tab === 'comments' ? 'active' : ''} onClick={() => setTab('comments')}>
                Bình luận ({card.comments.length})
              </button>
              <button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>
                Hoạt động ({cardLogs.length})
              </button>
            </div>

            {tab === 'comments' ? (
              <>
                <div className="comment-box">
                  <Avatar name={s.user} size={26} />
                  <div>
                    <textarea
                      rows={2}
                      value={comment}
                      placeholder="Viết bình luận… dùng @Tên để nhắc thành viên"
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && sendComment()}
                    />
                    <div className="comment-actions">
                      <span className="muted small">Ctrl/⌘ + Enter để gửi</span>
                      <button className="btn primary" disabled={!comment.trim()} onClick={sendComment}>
                        Gửi
                      </button>
                    </div>
                  </div>
                </div>
                {[...card.comments].reverse().map((c, i) => (
                  <div className="log-row" key={i}>
                    <Avatar name={c.by} size={26} />
                    <p>
                      <b>{c.by}</b> <small className="inline">{c.time}</small>
                      <span className="comment-text">{renderText(c.text)}</span>
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <>
                {cardLogs.map((l) => (
                  <div className="log-row" key={l.id}>
                    <Avatar name={l.by} size={26} />
                    <p>
                      <b>{l.by}</b> {l.text}
                      <small>{l.time}</small>
                    </p>
                  </div>
                ))}
                {!cardLogs.length && <p className="empty">Chưa có hoạt động nào được ghi cho công việc này.</p>}
              </>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}
