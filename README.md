# 📚 Student Management System (SMS)

Hệ thống quản lý sinh viên full-stack hiện đại, dùng cho môi trường đào tạo, gồm backend FastAPI, frontend Next.js và MongoDB. Dự án hỗ trợ 3 vai trò chính: **admin**, **teacher**, **student** với tính năng quản lý toàn diện.

## ✨ Tính Năng Chính

### Xác Thực & Bảo Mật
- ✅ Đăng nhập bằng JWT, refresh token, kiểm soát phiên đăng nhập theo `jti`
- ✅ Phân quyền theo vai trò: admin, giảng viên, sinh viên
- ✅ Mã hóa mật khẩu với bcrypt
- ✅ Audit log theo dõi mọi hoạt động

### Quản Lý Hành Chính
- ✅ Quản lý người dùng, khoa/bộ môn, phòng học, môn học, lớp học phần
- ✅ Quản lý kỳ thi, nộp bài thi, ghi điểm thi
- ✅ Xử lý tài chính, hóa đơn, thanh toán

### Chức Năng Sinh Viên
- ✅ Đăng ký học phần
- ✅ Xem lịch học, điểm, bảng điểm, học phí
- ✅ Gửi yêu cầu rút học phần
- ✅ Nộp bài tập, phản hồi giảng viên

### Chức Năng Giảng Viên
- ✅ Quản lý lớp phụ trách
- ✅ Điểm danh, quản lý bài tập
- ✅ Chấm điểm, phản hồi lớp học
- ✅ Xem báo cáo lớp

### Chức Năng Admin
- ✅ Duyệt rút học phần
- ✅ Xem audit log toàn hệ thống
- ✅ Báo cáo thống kê
- ✅ Xuất dữ liệu phục vụ vận hành

### Thông Báo & Thời Gian Thực
- ✅ Trung tâm thông báo tập trung
- ✅ WebSocket notification realtime
- ✅ Thông báo cập nhật học phần, điểm, học phí

## 🛠️ Công Nghệ

### Backend
- **Python** 3.11
- **FastAPI** - Web framework
- **MongoDB** - Database
- **Motor** / **PyMongo** - Database driver
- **Pydantic** v2 - Data validation
- **JWT** (python-jose / PyJWT) - Authentication
- **bcrypt** - Password hashing
- **WebSocket** - Real-time notifications

### Frontend
- **Next.js** 16 - App Router
- **React** 18 - UI library
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Framer Motion** - Animations
- **CSS Modules** - Styling

### Infrastructure
- **Docker** / **Docker Compose**
- **MongoDB** container

## 🏗️ Kiến Trúc Hệ Thống

```text
┌─────────────────┐
│    Browser      │
└────────┬────────┘
         │ http://localhost:3001
         v
┌─────────────────────────┐
│  Frontend - Next.js     │
│  (React SSR + CSR)      │
└────────┬────────────────┘
         │ Axios → http://localhost:8000
         v
┌─────────────────────────┐
│  Backend - FastAPI      │
│  (REST API)             │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│    MongoDB Database     │
│  (Port: 27017)          │
└─────────────────────────┘
```

### Port Mặc Định
| Dịch vụ | Port | URL |
|---------|------|-----|
| Frontend | 3001 | http://localhost:3001 |
| Backend | 8000 | http://localhost:8000 |
| MongoDB | 27017 | localhost:27017 |

## 📁 Cấu Trúc Dự Án

```
.
├── backend/
│   ├── app/
│   │   ├── core/          # config, security, audit, schedule helpers
│   │   ├── db/            # MongoDB connection & utilities
│   │   ├── internal/      # admin router
│   │   ├── routers/       # auth, student, teacher, finance, exams, reports, notifications
│   │   └── schemas/       # Pydantic models & validation
│   ├── tests/             # unit tests
│   ├── seed_full_system.py # data seeding
│   ├── requirements.txt
│   ├── Dockerfile
│   └── __init__.py
├── frontend/
│   ├── public/            # static assets
│   ├── src/
│   │   ├── app/           # routes: login, admin, teacher, student, exams, notifications
│   │   ├── components/    # reusable React components
│   │   ├── hooks/         # custom React hooks
│   │   ├── lib/           # utilities, API clients, helpers
│   │   └── styles/        # CSS modules & global styles
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.js
│   ├── jsconfig.json
│   ├── eslint.config.mjs
│   └── Dockerfile
├── docker-compose.yml        # development
├── docker-compose.prod.yml   # production
├── pyproject.toml
├── .env.example
└── README.md
```

## 🚀 Cách Chạy Dự Án

### Yêu Cầu Hệ Thống
- **Docker** & **Docker Compose** (phiên bản mới nhất)
- Hoặc: **Python 3.11**, **Node.js 18+**, **MongoDB**
- **Git**

### 1️⃣ Clone Repository
```bash
git clone <repository-url>
cd "Student Management System"
```

### 2️⃣ Cấu Hình Environment

Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Chỉnh sửa các giá trị cần thiết:
```env
# Backend
DATABASE_URL=mongodb://localhost:27017/sms
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3️⃣ Chạy với Docker Compose (Khuyến Nghị)

**Development:**
```bash
docker-compose up -d
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

Truy cập:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs (Swagger UI)

### 4️⃣ Chạy Local (Không Docker)

#### Backend
```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Cài dependencies
pip install -r requirements.txt

# Chạy server
python -m uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend

# Cài dependencies
npm install

# Chạy dev server
npm run dev

# Build production
npm run build
npm start
```

## 📊 Seeding Dữ Liệu

Để tạo dữ liệu mẫu cho hệ thống:

```bash
# Với Docker
docker-compose exec backend python seed_full_system.py

# Hoặc chạy local
cd backend
python seed_full_system.py
```

Dữ liệu mẫu bao gồm:
- Tài khoản admin, giảng viên, sinh viên
- Khoa, bộ môn
- Phòng học
- Môn học, lớp học phần
- Lịch học
- Bài tập, kỳ thi

## 🔐 Tài Khoản Mẫu

Sau khi seed dữ liệu, có thể sử dụng:

| Vai Trò | Email | Mật Khẩu |
|---------|-------|---------|
| Admin | admin@example.com | admin123 |
| Giảng Viên | teacher@example.com | teacher123 |
| Sinh Viên | student@example.com | student123 |

*Lưu ý: Mật khẩu này chỉ dùng cho development*

## 📚 API Documentation

### Swagger UI
Truy cập: `http://localhost:8000/docs`

### ReDoc
Truy cập: `http://localhost:8000/redoc`

### Endpoints Chính

#### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/refresh-token` - Làm mới token
- `GET /api/auth/profile` - Lấy thông tin người dùng

#### Students
- `GET /api/student/enrollments` - Lấy danh sách học phần
- `GET /api/student/schedule` - Lịch học
- `GET /api/student/grades` - Xem điểm
- `GET /api/student/transcript` - Bảng điểm

#### Teachers
- `GET /api/teacher/classes` - Lớp quản lý
- `POST /api/teacher/attendance` - Điểm danh
- `POST /api/teacher/grades` - Chấm điểm

#### Admin
- `GET /api/admin/users` - Quản lý người dùng
- `GET /api/admin/finance` - Quản lý tài chính
- `GET /api/admin/audit` - Audit log

Xem chi tiết tại Swagger UI

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest -v
```

### Frontend Tests (nếu có)
```bash
cd frontend
npm test
```

## 📝 Quy Ước Code

### Backend
- Sử dụng FastAPI conventions
- Pydantic models cho validation
- Async/await cho database queries
- Descriptive names và type hints

### Frontend
- Functional components với React hooks
- CSS Modules cho styling
- camelCase cho variables & functions
- PascalCase cho components

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Giải pháp:**
- Kiểm tra MongoDB container đang chạy: `docker ps`
- Restart: `docker-compose restart mongodb` (nếu dùng docker-compose)
- Hoặc khởi động MongoDB locally

### Frontend Cannot Connect Backend
```
Error: Network Error: connect ECONNREFUSED
```
**Giải pháp:**
- Kiểm tra backend có chạy: `curl http://localhost:8000/docs`
- Kiểm tra `NEXT_PUBLIC_API_BASE_URL` trong `.env`
- Restart frontend: `npm run dev`

### Port Already in Use
```
Error: Port 3001 is already in use
```
**Giải pháp:**
```bash
# Tìm process sử dụng port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process hoặc dùng port khác
npm run dev -- -p 3002
```

### Build Fails
```bash
# Clear cache & reinstall
docker-compose down -v
docker-compose up --build
```

## 🔧 Development

### Cấu Hình IDE
- **Backend**: PyCharm / VS Code + Python extension
- **Frontend**: VS Code + ES Lint extension

### Pre-commit Hooks
```bash
# Backend
cd backend
pip install pre-commit
pre-commit install

# Frontend
cd frontend
npm install husky
npm run prepare
```

### Database Migrations
MongoDB sử dụng schema validation trong application (Pydantic).
Không cần migration tool như SQL.

## 📦 Deployment

### Deployment to Production
1. Cấu hình environment variables
2. Build images: `docker-compose -f docker-compose.prod.yml build`
3. Push to registry (Docker Hub, ECR, etc.)
4. Deploy to cloud (AWS, Azure, GCP, etc.)

### Recommended Platforms
- **Hosting**: Railway, Render, Heroku, AWS, DigitalOcean
- **Database**: MongoDB Atlas
- **CDN**: Cloudflare, AWS CloudFront

## 📋 Checklists Trước Khi Deploy

- [ ] Environment variables đã được cấu hình
- [ ] Database backups đã được thiết lập
- [ ] Error logging đã bật
- [ ] Security headers đã thêm
- [ ] CORS đã cấu hình đúng
- [ ] Rate limiting đã áp dụng
- [ ] SSL/HTTPS đã enabled
- [ ] Tests đã passed

## 🤝 Contributing

### Quy Trình Contribute
1. Fork repository
2. Tạo branch feature: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add some amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Mở Pull Request

### Commit Message Convention
```
feat: add new feature
fix: fix bug
docs: update documentation
style: code style changes
refactor: refactor code
test: add/update tests
chore: maintenance tasks
```

## 📄 License

Dự án này được cấp phép dưới [License Type]. Xem file [LICENSE](LICENSE) để chi tiết.

## 👥 Authors & Contributors

- **Maintainers**: [Your Name/Organization]
- **Contributors**: [List contributors here]

## 📞 Support & Contact

- **Issues**: [GitHub Issues Link]
- **Email**: support@example.com
- **Documentation**: [Wiki/Docs Link]

## 🔄 Changelog

### v1.0.0 (2024)
- ✨ Initial release
- 🎉 Full-stack student management system
- 📱 Responsive design
- 🔒 Secure authentication

Xem [CHANGELOG.md](CHANGELOG.md) cho chi tiết đầy đủ.

---

**Made with ❤️ by [Your Team]**

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
