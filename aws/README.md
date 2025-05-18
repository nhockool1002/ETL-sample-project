# AWS ETL Project

Triển khai dự án ETL Node.js sử dụng các dịch vụ AWS như:

## ☁️ Dịch vụ AWS sử dụng

- **AWS Lambda**: Chạy các job ETL (Extract / Transform / Load)
- **AWS Secrets Manager**: Quản lý biến môi trường, API token
- **Amazon RDS**: PostgreSQL nguồn
- **Amazon S3** (tuỳ chọn): Lưu dữ liệu dạng batch
- **Amazon CloudWatch**: Logging

## 🔄 Kịch bản triển khai

- Từng job như `jobExtract`, `jobTransformLoad` được triển khai thành một hàm Lambda riêng.
- Secrets được nạp từ Secrets Manager trong runtime (`getSecretValue`)
- Log đẩy về CloudWatch tự động qua console.log hoặc Winston nếu cần

## 🛠️ Chạy thử cục bộ

```bash
cd aws-src
npm install
npx ts-node src/jobExtract.ts
