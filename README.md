# Student Management System

Hệ thống quản lý sinh viên full-stack dùng cho môi trường đào tạo, gồm backend FastAPI, frontend Next.js và MongoDB. Dự án hỗ trợ 3 vai trò chính: `admin`, `teacher`, `student`.

## Tính Năng Chính

- Đăng nhập bằng JWT, refresh token, kiểm soát phiên đăng nhập theo `jti`.
- Phân quyền theo vai trò: admin, giảng viên, sinh viên.
- Quản lý người dùng, khoa/bộ môn, phòng học, môn học, lớp học phần.
- Sinh viên đăng ký học phần, xem lịch học, xem điểm, bảng điểm, học phí, gửi yêu cầu rút học phần.
- Giảng viên quản lý lớp phụ trách, điểm danh, bài tập, chấm điểm, phản hồi lớp học.
- Admin xử lý tài chính, hóa đơn, thanh toán, duyệt rút học phần, xem audit log.
- Quản lý kỳ thi, nộp bài thi, ghi điểm thi.
- Trung tâm thông báo và WebSocket notification realtime.
- Báo cáo thống kê và xuất một số dữ liệu phục vụ vận hành.

## Công Nghệ

### Backend

- Python 3.11
- FastAPI
- MongoDB
- Motor / PyMongo
- Pydantic v2
- JWT qua `python-jose` / `PyJWT`
- bcrypt cho hash mật khẩu
- WebSocket cho thông báo realtime

### Frontend

- Next.js 16 App Router
- React 18
- Axios
- Lucide React
- Framer Motion
- CSS Modules

### Hạ Tầng Local

- Docker / Docker Compose
- MongoDB container

## Kiến Trúc Tổng Quan

```text
Browser
  |
  | http://localhost:3000
  v
Frontend - Next.js
  |
  | /api/* rewrite hoặc NEXT_PUBLIC_API_BASE_URL
  v
Backend - FastAPI
  |
  v
MongoDB
```

Port mặc định:

- Frontend: `3000`
- Backend: `8000`
- MongoDB: `27017`

## Cấu Trúc Thư Mục

```text
.
├── backend/
│   ├── app/
│   │   ├── core/          # config, security, audit, schedule helpers
│   │   ├── db/            # MongoDB connection
│   │   ├── internal/      # admin router
│   │   ├── routers/       # auth, student, teacher, finance, exams, reports, notifications
│   │   └── schemas/       # Pydantic schemas
│   ├── tests/             # backend unit tests
│   ├── seed_full_system.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/           # routes: login, admin, teacher, student, notifications, exams
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.js
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── pyproject.toml
├── .env.example
└── README.md
```

## API Chính

Backend mount toàn bộ API tại prefix `/api`.

- `/api/auth`: đăng ký, đăng nhập, refresh token, profile, đổi mật khẩu.
- `/api/admin`: quản trị user, khoa, phòng học, môn học, lớp học, audit, rút học phần.
- `/api/student`: đăng ký học phần, lịch học, bài tập, điểm, bảng điểm, phản hồi, rút học phần.
- `/api/teacher`: lớp phụ trách, sinh viên trong lớp, điểm danh, bài tập, chấm điểm, phản hồi.
- `/api/finance`: học phí, hóa đơn, thanh toán, chính sách học phí.
- `/api/exams`: kỳ thi, nộp bài, ghi điểm thi.
- `/api/reports`: thống kê, bảng điểm, export.
- `/api/notifications`: danh sách thông báo, đánh dấu đã đọc, WebSocket.

Swagger UI khi backend chạy:

```text
http://localhost:8000/docs
```

## Biến Môi Trường

Tạo file `.env` ở thư mục gốc từ `.env.example`.

```env
SECRET_KEY=change-me-super-secret-at-least-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=sms_db

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000/api
```

Lưu ý:

- Đổi `SECRET_KEY` trước khi dùng ngoài local.
- `CORS_ORIGINS` là danh sách origin cách nhau bằng dấu phẩy.
- Khi chạy Docker Compose, backend dùng `mongodb://mongodb:27017/sms_db`.
- Frontend trong Docker dùng `INTERNAL_API_BASE_URL=http://backend:8000/api`.

## Chạy Bằng Docker

Yêu cầu:

- Docker Desktop
- Docker Compose

Chạy toàn bộ hệ thống:

```bash
docker compose up --build
```

Truy cập:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

Dừng hệ thống:

```bash
docker compose down
```

Xóa cả volume MongoDB local:

```bash
docker compose down -v
```

Chạy cấu hình production local:

```bash
docker compose -f docker-compose.prod.yml up --build
```

File production không mount source code vào container, tắt `DEBUG`, dùng healthcheck và yêu cầu các biến môi trường quan trọng phải tồn tại.

## Chạy Thủ Công

Yêu cầu:

- Python 3.11+
- Node.js 20+
- MongoDB đang chạy local tại `mongodb://localhost:27017`

### Backend

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:3000
```

## Seed Dữ Liệu Demo

Sau khi MongoDB và backend dependencies sẵn sàng:

```bash
cd backend
python seed_full_system.py
```

Script seed tạo dữ liệu mẫu:

- Khoa/bộ môn
- Phòng học
- Môn học
- Lớp học phần
- Admin, teacher, student
- Enrollment
- Attendance
- Assignment/submission
- Finance: invoice, payment, fee policy
- Audit logs

Tài khoản demo:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | `admin@sms.com` | `admin123` |
| Teacher | `teacher@sms.com` | `teacher123` |
| Student | `student@sms.com` | `student123` |

## Kiểm Tra Dự Án

### Backend Tests

```bash
python -m unittest discover -s backend\tests
```

Các test hiện có kiểm tra:

- Hash và verify mật khẩu.
- JWT chứa `sub`, `jti`, `exp`.
- Logic phát hiện trùng lịch học.
- Login thành công/thất bại.
- Role guard.
- Đăng ký học phần.
- Gửi yêu cầu rút học phần.
- Ghi nhận thanh toán.
- Đánh dấu thông báo đã đọc.

### Frontend Lint Và Build

```bash
cd frontend
npm install
npm run check
```

`npm run check` chạy:

```bash
next lint && next build
```

## Quy Trình Sử Dụng Cơ Bản

1. Chạy MongoDB, backend, frontend.
2. Seed dữ liệu demo.
3. Đăng nhập admin để kiểm tra dữ liệu hệ thống.
4. Tạo hoặc chỉnh khoa, phòng học, môn học, lớp học.
5. Đăng nhập student để đăng ký học phần.
6. Đăng nhập teacher để điểm danh, giao bài, chấm điểm.
7. Kiểm tra finance, notifications, reports.

## Phân Quyền

- `admin`: quản trị dữ liệu hệ thống, user, học vụ, tài chính, audit, rút học phần.
- `teacher`: quản lý lớp phụ trách, điểm danh, bài tập, chấm điểm, phản hồi.
- `student`: đăng ký học phần, xem lịch, nộp bài, xem điểm, học phí, phản hồi, yêu cầu rút học phần.

Middleware frontend kiểm tra cookie `sms_token` và `sms_role` để điều hướng theo vai trò. Backend vẫn là nơi quyết định quyền truy cập thật bằng JWT và dependency role check.

## Ghi Chú Bảo Mật

- Không commit file `.env`.
- Không dùng `SECRET_KEY` mặc định ở môi trường thật.
- Tắt `DEBUG` khi deploy.
- Cấu hình `CORS_ORIGINS` đúng domain frontend.
- Nên dùng HTTPS và reverse proxy khi triển khai production.
- Nên cấu hình backup định kỳ cho MongoDB.

## Ghi Chú Vận Hành

- `node_modules`, `.next`, `.venv`, `__pycache__`, `.idea`, `.agent` là file/thư mục local hoặc cache, không cần đưa vào source bàn giao.
- Nếu đã dọn `frontend/node_modules`, chạy lại `npm install` trước khi dev/build.
- Nếu đã dọn virtualenv backend, tạo lại `.venv` và chạy `pip install -r backend/requirements.txt`.
- Docker Compose tự build dependency trong container, không phụ thuộc `node_modules` local.
- Healthcheck có tại `/health` và `/api/health`.
- Kiểm tra production dependencies frontend bằng `npm audit --omit=dev`.

## Lệnh Hữu Ích

```bash
# Chạy Docker
docker compose up --build

# Chạy backend dev
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Chạy frontend dev
cd frontend
npm run dev

# Build frontend
cd frontend
npm run build

# Kiểm tra frontend
cd frontend
npm run check

# Test backend
python -m unittest discover -s backend\tests
```
