export type Role = 'Admin' | 'Member'
export type Priority = 'Cao' | 'Vừa' | 'Thấp'
/** workspace: mọi thành viên workspace xem được. private: chỉ người có tên trong board.members. */
export type Visibility = 'workspace' | 'private'
/** Mẫu danh sách khi tạo bảng mới. */
export type Template = 'basic' | 'dev'

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
  /** Admin đã tick xác nhận hoàn thành. */
  done?: boolean
  doneBy?: string
  doneAt?: string
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
  /** Mã màu nhận diện bảng (CF3). */
  color: string
  /** Quyền riêng tư của bảng (CF3). */
  visibility: Visibility
  /** Thành viên của bảng riêng tư. Bỏ qua khi visibility = 'workspace'. */
  members: string[]
}

export type Member = {
  name: string
  email: string
  role: Role
  pending?: boolean
  /** null = vào được mọi bảng của workspace. Mảng = khách, chỉ vào được các bảng này (CF2). */
  boards: string[] | null
}

export type Log = {
  id: string
  text: string
  by: string
  time: string
  boardId: string
  cardId?: string
}

export type Data = { boards: Board[]; members: Member[]; logs: Log[]; user: string }
