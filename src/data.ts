import type { Board, Card, Data, List, Member, Template, Visibility } from './types'

export const names = ['Minh Anh', 'Quang Huy', 'Thanh Thu', 'Gia Bảo', 'Khánh Linh']
const emailIds = ['minhanh', 'quanghuy', 'thanhthu', 'giabao', 'khanhlinh']

const seedMembers = (): Member[] =>
  names.map((name, i) => ({
    name,
    email: `${emailIds[i]}@team.vn`,
    role: i === 0 ? 'Admin' : 'Member',
    boards: null,
  }))

/* ---------- Màu nhận diện bảng (CF3) ----------
   Màu chỉ dùng cho chấm và viền bảng, không đổ nền cả trang, để giao diện vẫn ít màu. */

export const boardColors: { id: string; label: string; hex: string }[] = [
  { id: 'slate', label: 'Xám', hex: '#6b7280' },
  { id: 'indigo', label: 'Chàm', hex: '#4a5bd4' },
  { id: 'teal', label: 'Xanh ngọc', hex: '#0f766e' },
  { id: 'moss', label: 'Xanh rêu', hex: '#4d7c2f' },
  { id: 'amber', label: 'Hổ phách', hex: '#b45309' },
  { id: 'plum', label: 'Tím mận', hex: '#7c3f8f' },
]

export const colorHex = (id: string) => boardColors.find((c) => c.id === id)?.hex ?? boardColors[0].hex

const pad = (n: number) => String(n).padStart(2, '0')

/** Ngày dạng YYYY-MM-DD theo giờ máy, lệch `offset` ngày so với hôm nay. */
export const isoDate = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const card = (id: string, title: string, assignee: string, dueOffset: number | null, extra: Partial<Card> = {}): Card => ({
  id,
  title,
  desc: '',
  assignee,
  due: dueOffset === null ? '' : isoDate(dueOffset),
  labels: [],
  comments: [],
  files: [],
  checklist: [],
  priority: 'Vừa',
  ...extra,
})

const list = (id: string, title: string, cards: Card[] = []): List => ({ id, title, cards })

/* ---------- Developer board (template theo Quy trình Trello Developer Board) ---------- */

export const devListDefs: [string, string][] = [
  ['backlog', 'Dev Backlog'],
  ['ready', 'Ready for Dev'],
  ['accepted', 'Dev Accepted'],
  ['onboarding', 'Onboarding & Research'],
  ['documentation', 'Documentation'],
  ['week', 'This Week'],
  ['progress', 'In Progress'],
  ['review', 'Code Review'],
  ['qa', 'Tech QA'],
  ['rework', 'Rework / Bug Fix'],
  ['pm', 'Pending PM Review'],
  ['done', 'Done'],
]

const devConfig = {
  rules: {
    ready: ['accepted'],
    accepted: ['week'],
    week: ['progress'],
    progress: ['review'],
    rework: ['review'],
  } as Record<string, string[]>,
  evidenceFrom: 'progress',
  doneList: 'done',
  approveList: 'pm',
}

const devSample: Record<string, Card[]> = {
  backlog: [
    card('c1', 'Thiết kế luồng đăng nhập Google', names[1], 4, {
      desc: 'Hoàn thiện màn hình đăng nhập và xử lý trạng thái người dùng.',
      labels: ['Frontend', 'Auth'],
      priority: 'Cao',
      comments: [{ by: names[0], text: 'Ưu tiên luồng đăng nhập và trạng thái lỗi nhé.', time: '09:20' }],
      checklist: [
        { text: 'Thiết kế trạng thái loading', done: true },
        { text: 'Hiển thị lỗi đăng nhập', done: false },
      ],
    }),
    card('c2', 'Rà soát quy tắc bảo mật Firestore', names[2], 6, {
      desc: 'Kiểm tra quyền truy cập theo board và vai trò.',
      labels: ['Security'],
    }),
  ],
  ready: [
    card('c3', 'Tạo cấu trúc board Developer', names[0], 3, {
      desc: 'Dựng board và các danh sách theo quy trình của team.',
      labels: ['Product'],
      files: ['board-flow.pdf'],
      comments: [{ by: names[1], text: 'Template list đã được chốt.', time: 'Hôm qua' }],
      checklist: [
        { text: 'Chốt tên list', done: true },
        { text: 'Tạo board staging', done: false },
      ],
    }),
  ],
  week: [
    card('c4', 'Thêm thành viên bằng Gmail', names[4], 1, {
      desc: 'Admin mời thành viên vào board và gán quyền.',
      labels: ['Frontend', 'Team'],
      priority: 'Cao',
    }),
  ],
  progress: [
    card('c5', 'Thiết kế giao diện bảng công việc', names[2], 2, {
      desc: 'Bố cục board gọn, ít màu, ẩn được thanh bên.',
      labels: ['Design'],
      priority: 'Cao',
      files: ['board-preview.png'],
      comments: [{ by: names[2], text: 'Đang hoàn thiện phần thông báo.', time: '10:05' }],
      checklist: [
        { text: 'Thanh điều hướng', done: true },
        { text: 'Thẻ công việc', done: true },
        { text: 'Bảng hoạt động', done: false },
      ],
    }),
  ],
  review: [
    card('c6', 'Lưu thứ tự card sau khi kéo thả', names[1], -1, {
      desc: 'Cập nhật thứ tự và lưu trạng thái board.',
      labels: ['Frontend'],
    }),
  ],
  pm: [
    card('c7', 'Chốt template danh sách Developer', names[3], 0, {
      desc: 'Đối chiếu 12 danh sách với Quy trình Trello Developer Board.',
      labels: ['Product'],
      comments: [{ by: names[3], text: 'Đã hoàn thành. Evidence: ảnh chụp board và link PR.', time: '08:50' }],
    }),
  ],
}

const devBoard = (): Board => ({
  id: 'dev',
  name: 'Developer',
  desc: 'Theo dõi công việc và tiến độ phát triển sản phẩm.',
  lists: devListDefs.map(([id, title]) => list(id, title, devSample[id] ?? [])),
  ...devConfig,
  color: 'indigo',
  visibility: 'workspace',
  members: [...names],
})

/* ---------- Designer board (cùng cấu trúc ứng dụng, khác bộ list) ---------- */

const designBoard = (): Board => ({
  id: 'design',
  name: 'Designer',
  desc: 'Thiết kế, model, asset và art QA.',
  lists: [
    list('d-backlog', 'Design Backlog', [
      card('d1', 'Bộ icon thanh điều hướng', names[4], 3, { labels: ['Asset'], desc: 'Icon cho thanh bên và thanh trên.' }),
    ]),
    list('d-progress', 'In Progress', [
      card('d2', 'Model Storage Basket', names[3], 2, { labels: ['Model'], priority: 'Cao' }),
    ]),
    list('d-qa', 'Art QA', [
      card('d3', 'Kiểm tra màu sắc bảng công việc', names[0], 1, { labels: ['Art QA'] }),
    ]),
    list('d-ready', 'Ready for Dev'),
    list('d-done', 'Done'),
  ],
  rules: {
    'd-backlog': ['d-progress'],
    'd-progress': ['d-qa'],
    'd-qa': ['d-ready', 'd-progress'],
  },
  evidenceFrom: 'd-progress',
  doneList: 'd-done',
  approveList: null,
  color: 'teal',
  visibility: 'workspace',
  members: [...names],
})

/* ---------- Tạo board mới từ mẫu ---------- */

export type { Template } from './types'

type NewBoard = { name: string; desc: string; template: Template; color: string; visibility: Visibility; members: string[] }

export function makeBoard(id: string, o: NewBoard): Board {
  const common = { id, name: o.name, desc: o.desc, color: o.color, visibility: o.visibility, members: o.members }
  if (o.template === 'dev') {
    return { ...common, lists: devListDefs.map(([lid, title]) => list(lid, title)), ...devConfig }
  }
  return {
    ...common,
    lists: [list('todo', 'Cần làm'), list('doing', 'Đang làm'), list('review', 'Chờ duyệt'), list('done', 'Hoàn thành')],
    rules: null,
    evidenceFrom: null,
    doneList: 'done',
    approveList: 'review',
  }
}

export function seedData(): Data {
  return {
    boards: [devBoard(), designBoard()],
    members: seedMembers(),
    user: names[0],
    logs: [
      { id: 'l1', text: 'đã chuyển “Lưu thứ tự card sau khi kéo thả” sang Code Review', by: names[0], time: '10:42', boardId: 'dev', cardId: 'c6' },
      { id: 'l2', text: 'đã bình luận trong “Thiết kế giao diện bảng công việc”', by: names[2], time: '10:05', boardId: 'dev', cardId: 'c5' },
      { id: 'l3', text: 'đã giao “Thêm thành viên bằng Gmail”', by: names[0], time: '09:30', boardId: 'dev', cardId: 'c4' },
    ],
  }
}
