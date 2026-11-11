import { useState } from 'react'
import { ArrowRight, Check, LayoutGrid, Lock, ShieldCheck, Users } from 'lucide-react'
import { useStore } from '../store'
import { Avatar } from '../ui'

/** Logo Google vẽ bằng SVG để không phải tải ảnh ngoài. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.8-2 5.1-4.4 6.7v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.4z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.8-12.3-9H4.3v5.7C7.9 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.7 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-2.9.7-4.3v-5.7H4.3A22 22 0 0 0 2 24c0 3.6.9 6.9 2.3 9.9l7.4-5.6z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 7.9 6.9 4.3 14.1l7.4 5.7c1.7-5.3 6.6-9 12.3-9z" />
    </svg>
  )
}

const perks = [
  { icon: LayoutGrid, text: 'Mỗi team một bảng riêng, cùng một quy trình' },
  { icon: ShieldCheck, text: 'Phân quyền Admin và Member rõ ràng theo từng thao tác' },
  { icon: Lock, text: 'Bảng riêng tư chỉ người được thêm vào mới thấy' },
]

export default function Auth() {
  const s = useStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const accounts = s.data.members
  const matched = accounts.find((m) => m.email.toLowerCase() === email.trim().toLowerCase())

  const submit = () => {
    if (tab === 'register') {
      s.register(name, email)
      return
    }
    if (!matched) return s.notify('Chưa có tài khoản với email này, hãy chọn một tài khoản demo bên dưới')
    if (!password.trim()) return s.notify('Hãy nhập mật khẩu')
    s.signIn(matched.name)
  }

  return (
    <div className="auth">
      <aside className="auth-brand">
        <span className="brand">
          <span className="brand-mark">
            <LayoutGrid size={16} />
          </span>
          <span>
            <b>Northstar Studio</b>
            <small>Workspace nội bộ</small>
          </span>
        </span>

        <div className="auth-pitch">
          <h1>Quản lý công việc của team trong một chỗ</h1>
          <p>Bảng Kanban theo đúng quy trình Developer của team, kèm nhật ký hoạt động và xác nhận hoàn thành.</p>
          <ul>
            {perks.map((p) => (
              <li key={p.text}>
                <p.icon size={15} />
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <small className="auth-foot">Bản demo cho báo cáo thực tập · Lý Thanh Thu</small>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
              Đăng nhập
            </button>
            <button role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
              Đăng ký
            </button>
          </div>

          <h2>{tab === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h2>
          <p className="muted">
            {tab === 'login' ? 'Đăng nhập để vào workspace của team.' : 'Tài khoản mới vào workspace với vai trò Member.'}
          </p>

          <button className="btn google" onClick={() => s.notify('Bản demo chưa gắn Firebase Auth. Hãy chọn một tài khoản bên dưới.')}>
            <GoogleMark /> Tiếp tục với Google
          </button>
          <span className="auth-or">hoặc dùng email</span>

          {tab === 'register' && (
            <label className="field">
              Họ và tên
              <input value={name} placeholder="Nguyễn Văn A" onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="field">
            Email
            <input type="email" value={email} placeholder="ten@team.vn" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </label>
          {tab === 'login' && (
            <label className="field">
              Mật khẩu
              <input
                type="password"
                value={password}
                placeholder="Nhập gì cũng được, bản demo chưa kiểm tra"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </label>
          )}

          <button className="btn primary block" onClick={submit}>
            {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowRight size={15} />
          </button>

          <div className="auth-pick">
            <span className="auth-pick-head">
              <Users size={14} /> Hoặc chọn nhanh một tài khoản demo
            </span>
            {accounts.map((m) => (
              <button key={m.email} className="pick-row" onClick={() => s.signIn(m.name)}>
                <Avatar name={m.name} size={30} />
                <span className="pick-main">
                  <b>{m.name}</b>
                  <small className="muted">{m.email}</small>
                </span>
                <span className={`role-chip ${m.role === 'Admin' ? 'admin' : ''}`}>{m.role}</span>
                {s.user === m.name && <Check size={15} className="pick-current" />}
              </button>
            ))}
            <small className="muted">
              Admin là PM, Leader và Reviewer. Member là thành viên thực hiện công việc. Chọn tài khoản khác nhau để xem phân quyền đổi theo.
            </small>
          </div>
        </div>
      </main>
    </div>
  )
}
