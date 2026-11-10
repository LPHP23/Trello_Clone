import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { Board, Card, Data, Role } from './types'
import { makeBoard, seedData, type Template } from './data'

const DATA_KEY = 'trello-clone-v2-data'
const UI_KEY = 'trello-clone-v2-ui'
const OLD_KEY = 'trello-clone-v1-data'

type UI = { nav: boolean; activity: boolean; seen: string[] }
export type OpenCard = { boardId: string; cardId: string } | null
export type Modal = 'newBoard' | 'invite' | null

const nowText = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

function loadData(): Data {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (Array.isArray(d.boards) && Array.isArray(d.members)) return d
    }
    // Chuyển dữ liệu từ bản v1 (một board duy nhất) nếu có
    const old = localStorage.getItem(OLD_KEY)
    if (old) {
      const o = JSON.parse(old)
      const base = seedData()
      if (Array.isArray(o.lists)) base.boards[0].lists = o.lists
      if (typeof o.user === 'string' && base.members.some((m) => m.name === o.user)) base.user = o.user
      return base
    }
  } catch {
    /* dùng dữ liệu mẫu */
  }
  return seedData()
}

function loadUi(): UI {
  const wide = window.innerWidth >= 1000
  try {
    const u = JSON.parse(localStorage.getItem(UI_KEY) || 'null')
    if (u) {
      return {
        nav: window.innerWidth < 900 ? false : !!u.nav,
        activity: !!u.activity && window.innerWidth >= 1100,
        seen: Array.isArray(u.seen) ? u.seen : [],
      }
    }
  } catch {
    /* mặc định */
  }
  return { nav: wide, activity: false, seen: [] }
}

export type Store = {
  data: Data
  user: string
  role: Role
  ui: UI
  openCard: OpenCard
  modal: Modal
  setOpenCard: (o: OpenCard) => void
  setModal: (m: Modal) => void
  notify: (msg: string) => void
  toggleNav: () => void
  toggleActivity: () => void
  markSeen: (ids: string[]) => void
  setUser: (name: string) => void
  reset: () => void
  // card
  patchCard: (boardId: string, cardId: string, patch: Partial<Card>, logText?: string) => void
  createCard: (boardId: string, listId: string, title: string) => void
  moveCard: (boardId: string, activeId: string, overId: string) => void
  archiveCard: (boardId: string, cardId: string) => void
  restoreCard: (boardId: string, cardId: string) => void
  addComment: (boardId: string, cardId: string, text: string) => void
  // list
  createList: (boardId: string, title: string) => void
  renameList: (boardId: string, listId: string, title: string) => void
  deleteList: (boardId: string, listId: string) => void
  toggleCollapse: (boardId: string, listId: string) => void
  collapseEmpty: (boardId: string, collapse: boolean) => void
  // board
  createBoard: (name: string, desc: string, template: Template) => string | null
  // members
  addMember: (email: string, role: Role) => boolean
  setMemberRole: (name: string, role: Role) => void
  removeMember: (name: string) => void
}

const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)

const DONE_COMMENT = /hoàn thành|evidence|xong|đã sửa/i

export function Provider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(loadData)
  const [ui, setUi] = useState<UI>(loadUi)
  const [openCard, setOpenCard] = useState<OpenCard>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [toast, setToast] = useState('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data))
    } catch {
      /* bỏ qua nếu trình duyệt chặn lưu trữ */
    }
  }, [data])
  useEffect(() => {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(ui))
    } catch {
      /* bỏ qua */
    }
  }, [ui])

  const user = data.user
  const role: Role = data.members.find((m) => m.name === user)?.role ?? 'Member'
  const isAdmin = role === 'Admin'

  const notify = (msg: string) => {
    setToast(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), 2600)
  }

  const withLog = (d: Data, text: string, boardId: string, cardId?: string): Data => ({
    ...d,
    logs: [{ id: uid('l'), text, by: d.user, time: nowText(), boardId, cardId }, ...d.logs].slice(0, 100),
  })
  const editBoard = (d: Data, boardId: string, fn: (b: Board) => Board): Data => ({
    ...d,
    boards: d.boards.map((b) => (b.id === boardId ? fn(b) : b)),
  })
  const editCard = (b: Board, cardId: string, fn: (c: Card) => Card): Board => ({
    ...b,
    lists: b.lists.map((l) => ({ ...l, cards: l.cards.map((c) => (c.id === cardId ? fn(c) : c)) })),
  })
  const findCard = (boardId: string, cardId: string) => {
    const b = data.boards.find((x) => x.id === boardId)
    for (const l of b?.lists ?? []) {
      const c = l.cards.find((x) => x.id === cardId)
      if (c) return c
    }
    return undefined
  }
  const canEditCard = (c: Card) => isAdmin || c.assignee === user

  const store: Store = {
    data,
    user,
    role,
    ui,
    openCard,
    modal,
    setOpenCard,
    setModal,
    notify,
    toggleNav: () => setUi((u) => ({ ...u, nav: !u.nav })),
    toggleActivity: () => setUi((u) => ({ ...u, activity: !u.activity })),
    markSeen: (ids) => setUi((u) => ({ ...u, seen: Array.from(new Set([...u.seen, ...ids])).slice(-300) })),
    setUser: (name) => setData((d) => (d.members.some((m) => m.name === name && !m.pending) ? { ...d, user: name } : d)),
    reset: () => {
      try {
        localStorage.removeItem(DATA_KEY)
        localStorage.removeItem(UI_KEY)
        localStorage.removeItem(OLD_KEY)
      } catch {
        /* bỏ qua */
      }
      location.reload()
    },

    patchCard: (boardId, cardId, patch, logText) =>
      setData((d) => {
        const next = editBoard(d, boardId, (b) => editCard(b, cardId, (c) => ({ ...c, ...patch })))
        return logText ? withLog(next, logText, boardId, cardId) : next
      }),

    createCard: (boardId, listId, title) => {
      const t = title.trim()
      if (!t) return
      const c: Card = {
        id: uid('c'), title: t, desc: '', assignee: user, due: '',
        labels: [], comments: [], files: [], checklist: [], priority: 'Vừa',
      }
      setData((d) =>
        withLog(
          editBoard(d, boardId, (b) => ({ ...b, lists: b.lists.map((l) => (l.id === listId ? { ...l, cards: [...l.cards, c] } : l)) })),
          `đã tạo công việc “${t}”`, boardId, c.id,
        ),
      )
    },

    moveCard: (boardId, activeId, overId) => {
      const board = data.boards.find((b) => b.id === boardId)
      if (!board) return
      const from = board.lists.find((l) => l.cards.some((c) => c.id === activeId))
      const to = board.lists.find((l) => l.id === overId) ?? board.lists.find((l) => l.cards.some((c) => c.id === overId))
      if (!from || !to) return
      const card = from.cards.find((c) => c.id === activeId)!

      if (!isAdmin) {
        if (card.assignee !== user) return notify('Bạn chỉ có thể di chuyển công việc được giao cho mình')
        if (from.id !== to.id) {
          if (board.rules && !(board.rules[from.id] ?? []).includes(to.id)) return notify('Chuyển danh sách này cần Admin duyệt')
          if (!board.rules && to.id === board.doneList) return notify('Chỉ Admin được chuyển công việc sang Hoàn thành')
          if (from.id === board.evidenceFrom && !card.comments.some((x) => DONE_COMMENT.test(x.text)))
            return notify('Hãy bình luận hoàn thành kèm evidence trước khi gửi review')
        }
      }

      setData((d) => {
        const moved = editBoard(d, boardId, (b) => {
          const lists = b.lists.map((l) => ({ ...l, cards: [...l.cards] }))
          const fl = lists.find((l) => l.id === from.id)!
          const tl = lists.find((l) => l.id === to.id)!
          const oldIndex = fl.cards.findIndex((c) => c.id === activeId)
          const overIndex = tl.cards.findIndex((c) => c.id === overId) // -1 khi thả vào vùng trống của list
          const [item] = fl.cards.splice(oldIndex, 1)
          tl.cards.splice(overIndex < 0 ? tl.cards.length : overIndex, 0, item)
          return { ...b, lists }
        })
        return from.id !== to.id ? withLog(moved, `đã chuyển “${card.title}” sang ${to.title}`, boardId, card.id) : moved
      })
    },

    archiveCard: (boardId, cardId) => {
      const c = findCard(boardId, cardId)
      if (!c) return
      if (!canEditCard(c)) return notify('Chỉ Admin hoặc người phụ trách được lưu trữ công việc')
      setData((d) => withLog(editBoard(d, boardId, (b) => editCard(b, cardId, (x) => ({ ...x, archived: true }))), `đã lưu trữ “${c.title}”`, boardId, cardId))
      setOpenCard(null)
      notify('Đã lưu trữ công việc')
    },

    restoreCard: (boardId, cardId) => {
      const c = findCard(boardId, cardId)
      if (!c) return
      if (!canEditCard(c)) return notify('Chỉ Admin hoặc người phụ trách được khôi phục')
      setData((d) => withLog(editBoard(d, boardId, (b) => editCard(b, cardId, (x) => ({ ...x, archived: false }))), `đã khôi phục “${c.title}”`, boardId, cardId))
    },

    addComment: (boardId, cardId, text) => {
      const t = text.trim()
      const c = findCard(boardId, cardId)
      if (!t || !c) return
      setData((d) =>
        withLog(
          editBoard(d, boardId, (b) => editCard(b, cardId, (x) => ({ ...x, comments: [...x.comments, { by: user, text: t, time: nowText() }] }))),
          `đã bình luận trong “${c.title}”`, boardId, cardId,
        ),
      )
    },

    createList: (boardId, title) => {
      const t = title.trim()
      if (!t) return
      if (!isAdmin) return notify('Chỉ Admin được tạo danh sách')
      setData((d) =>
        withLog(editBoard(d, boardId, (b) => ({ ...b, lists: [...b.lists, { id: uid('l'), title: t, cards: [] }] })), `đã tạo danh sách “${t}”`, boardId),
      )
    },

    renameList: (boardId, listId, title) => {
      const t = title.trim()
      if (!t || !isAdmin) return
      setData((d) => editBoard(d, boardId, (b) => ({ ...b, lists: b.lists.map((l) => (l.id === listId ? { ...l, title: t } : l)) })))
    },

    deleteList: (boardId, listId) => {
      if (!isAdmin) return notify('Chỉ Admin được xóa danh sách')
      const l = data.boards.find((b) => b.id === boardId)?.lists.find((x) => x.id === listId)
      if (!l) return
      if (l.cards.length) return notify('Chỉ xóa được danh sách không còn công việc')
      setData((d) => withLog(editBoard(d, boardId, (b) => ({ ...b, lists: b.lists.filter((x) => x.id !== listId) })), `đã xóa danh sách “${l.title}”`, boardId))
    },

    toggleCollapse: (boardId, listId) =>
      setData((d) => editBoard(d, boardId, (b) => ({ ...b, lists: b.lists.map((l) => (l.id === listId ? { ...l, collapsed: !l.collapsed } : l)) }))),

    collapseEmpty: (boardId, collapse) =>
      setData((d) =>
        editBoard(d, boardId, (b) => ({
          ...b,
          lists: b.lists.map((l) => ({ ...l, collapsed: collapse ? l.cards.filter((c) => !c.archived).length === 0 : false })),
        })),
      ),

    createBoard: (name, desc, template) => {
      const n = name.trim()
      if (!n) return null
      if (!isAdmin) {
        notify('Chỉ Admin được tạo bảng')
        return null
      }
      const id = uid('b')
      setData((d) => ({ ...d, boards: [...d.boards, makeBoard(id, n, desc.trim(), template)] }))
      return id
    },

    addMember: (email, r) => {
      const e = email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        notify('Địa chỉ Gmail chưa hợp lệ')
        return false
      }
      if (!isAdmin) {
        notify('Chỉ Admin được mời thành viên')
        return false
      }
      if (data.members.some((m) => m.email === e)) {
        notify('Thành viên này đã có trong danh sách')
        return false
      }
      const local = e.split('@')[0].replace(/[._-]+/g, ' ')
      const name = local.replace(/\b\p{L}/gu, (ch) => ch.toUpperCase())
      setData((d) => ({ ...d, members: [...d.members, { name, email: e, role: r, pending: true }] }))
      notify('Đã gửi lời mời tham gia')
      return true
    },

    setMemberRole: (name, r) => {
      if (!isAdmin) return notify('Chỉ Admin được đổi vai trò')
      const admins = data.members.filter((m) => m.role === 'Admin').length
      if (r === 'Member' && admins === 1 && data.members.find((m) => m.name === name)?.role === 'Admin')
        return notify('Cần giữ ít nhất một Admin')
      setData((d) => ({ ...d, members: d.members.map((m) => (m.name === name ? { ...m, role: r } : m)) }))
    },

    removeMember: (name) => {
      if (!isAdmin) return notify('Chỉ Admin được xóa thành viên')
      if (name === user) return notify('Bạn không thể tự xóa mình')
      setData((d) => ({ ...d, members: d.members.filter((m) => m.name !== name) }))
    },
  }

  return (
    <Ctx.Provider value={store}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <Check size={15} />
          {toast}
        </div>
      )}
    </Ctx.Provider>
  )
}
