# Trello Clone v1.0

Ứng dụng web bảng công việc cho team nội bộ, dựng theo phạm vi v1.0 trong tài liệu dự án. Giao diện tối ưu cho desktop và dùng board Developer làm mẫu.

## Chạy ứng dụng

Yêu cầu Node.js 20 trở lên và pnpm.

```sh
pnpm install
pnpm dev
```

Mở URL Vite hiển thị trong terminal. Tạo bản production bằng `pnpm build` và xem trước bằng `pnpm preview`.

## Có trong bản hiện tại

- Board Developer với template 12 danh sách.
- Tạo card, kéo thả card, sửa tiêu đề/mô tả, assignee, deadline, ưu tiên, checklist, nhãn, tệp và bình luận.
- Admin và Member demo; thành viên chỉ thao tác card được giao, luật chuyển list được kiểm tra ở giao diện.
- Activity feed, thông báo, tìm kiếm và dữ liệu được lưu cục bộ trong trình duyệt.
- Giao diện tiếng Việt, gồm board, panel chi tiết card và feed hoạt động.

## Trạng thái tích hợp

Đây là bản chạy thử v1.0 dùng dữ liệu mẫu và `localStorage`. Đăng nhập Google, lời mời Gmail thực, đồng bộ giữa nhiều người dùng, Firestore, Cloud Functions, Storage, Security Rules, App Check và triển khai Firebase chưa được kết nối. Chế độ chọn người dùng trên thanh trên cùng chỉ mô phỏng vai trò để xem luồng giao diện; không phải cơ chế xác thực hoặc phân quyền an toàn. Không đưa dữ liệu nhạy cảm vào bản demo này.

Để đưa lên môi trường team dùng thật, cần cấu hình Firebase theo ba môi trường riêng, chuyển lưu trữ sang Firestore/Storage, thực thi luật chuyển list và ghi activity ở server, rồi bật Google Auth, App Check và Security Rules như tài liệu thiết kế yêu cầu.
# Trello_Clone
