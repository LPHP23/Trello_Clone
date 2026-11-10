export type Role = 'Admin' | 'Member'
export type Priority = 'Cao' | 'Vừa' | 'Thấp'

export type Comment = { by: string; text: string; time: string }
export type CheckItem = { text: string; done: boolean }

export type Card = {
  id: string
  title: string
  desc: string
  assignee: string
  due: string
  labels: string[]
  comments: Comment[]
  files: string[]
  checklist: CheckItem[]
  priority: Priority
  archived?: boolean
  watching?: boolean
}

export type List = { id: string; title: string; cards: Card[]; collapsed?: boolean }

export type Board = {
  id: string
  name: string
  desc: string
  lists: List[]
  /** Member được chuyển card từ list → các list này. null = tự do (trừ list Done). */
  rules: Record<string, string[]> | null
  /** List mà Member phải comment hoàn thành (kèm evidence) trước khi chuyển card đi. */
  evidenceFrom: string | null
  doneList: string
  /** List chờ Admin duyệt, hiển thị trong mục "Chờ duyệt" ở Tổng quan. */
  approveList: string | null
}

export type Member = { name: string; email: string; role: Role; pending?: boolean }

export type Log = {
  id: string
  text: string
  by: string
  time: string
  boardId: string
  cardId?: string
}

export type Data = { boards: Board[]; members: Member[]; logs: Log[]; user: string }
