import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { isoDate } from './data'

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const pick = parts.length > 1 ? parts.slice(-2) : parts
  return pick.map((p) => p[0]).join('').toUpperCase()
}

export function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }} title={name} aria-label={name}>
      {initials(name)}
    </span>
  )
}

export const daysUntil = (due: string) =>
  Math.round((Date.parse(due + 'T00:00:00') - Date.parse(isoDate(0) + 'T00:00:00')) / 86400000)

export function dueInfo(due: string) {
  if (!due) return null
  const n = daysUntil(due)
  const text =
    n === 0 ? 'Hôm nay' : n === 1 ? 'Ngày mai' : new Date(due + 'T12:00:00').toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
  return { text, overdue: n < 0, soon: n >= 0 && n <= 2, days: n }
}

export function DueChip({ due }: { due: string }) {
  const info = dueInfo(due)
  if (!info) return null
  const title = info.overdue ? `Quá hạn ${-info.days} ngày` : info.soon ? 'Sắp đến hạn' : 'Deadline'
  return (
    <span className={`due ${info.overdue ? 'overdue' : ''}`} title={title}>
      {info.text}
    </span>
  )
}

/** Menu nổi: đóng khi bấm ra ngoài hoặc nhấn Esc. */
export function Popover({
  trigger,
  children,
  align = 'right',
}: {
  trigger: (o: { open: boolean; toggle: () => void }) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])
  return (
    <div className="pop-wrap" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && <div className={`popover ${align}`}>{children(() => setOpen(false))}</div>}
    </div>
  )
}

export function Modal({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="backdrop center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
