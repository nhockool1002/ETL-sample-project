# ETL Project Sample (Node.js)

Dự án mẫu mô phỏng quy trình ETL (Extract – Transform – Load) từ nhiều nguồn dữ liệu như PostgreSQL, API và Batch Monitor, với khả năng mở rộng sang AWS Cloud.

## 📦 Cấu trúc thư mục

etl-project-sample-nodejs/

├── src/

├── aws-src/ # Triển khai tương thích AWS

├── .gitignore

├── README.md # Mô tả tổng quan dự án

└── README_AWS.md # Chi tiết triển khai AWS



## 🔧 Tính năng chính

- **Extract** dữ liệu từ:
  - PostgreSQL
  - REST API
  - MongoDB (batch monitor để retry lỗi)

- **Transform + Validation**:
  - Kiểm tra định dạng email, số điện thoại, ngày tháng
  - Mã hóa thông tin nhạy cảm (AES-256)

- **Load**:
  - Lưu vào MongoDB, cơ chế upsert

- **Incremental Load**:
  - Dựa theo `lastRun` metadata
  - Có thể nâng cấp lên CDC nếu cần

- **Batch Monitor**:
  - Ghi nhận lỗi ETL để xử lý lại

- **Audit Log**:
  - Dễ tích hợp thêm ghi log vào MongoDB

- **Đa môi trường**:
  - Triển khai độc lập hoặc AWS Lambda/SecretsManager

## 🚀 Chạy thử (local)

```bash
cp .env.example .env
npm install
npm start
