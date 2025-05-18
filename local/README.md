# ETL Project – Node.js + PostgreSQL + MongoDB

## 🧩 Mô hình xử lý

1. **Trích xuất (Extract)**:
   - Từ PostgreSQL (`pgClient`)
   - Từ RESTful API (qua `axios`)
   - Từ batch lỗi cần retry (từ MongoDB `batch_monitor`)

2. **Chuyển đổi (Transform)**:
   - Validate dữ liệu: `email`, `phone`, `id`, `enum`, `ngày`
   - Loại bỏ bản ghi không hợp lệ
   - Mã hóa (encrypt) thông tin nhạy cảm như email, phone

3. **Tải dữ liệu (Load)**:
   - Ghi vào MongoDB `customers` (dùng `upsert`)
   - Ghi log lịch sử và lỗi (collection `audit_log` và `batch_monitor`)

## 🚀 Chạy thử

```bash
# Cài đặt
npm install

# Khởi động ETL
npm run start
