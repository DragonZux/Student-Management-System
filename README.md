# 🎓 Smart Student Management System (SMS Việt)

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Infrastructure-Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

Hệ thống quản lý sinh viên hiện đại, tích hợp công nghệ **FastAPI**, **Next.js** và **MongoDB**. Được thiết kế với giao diện **Glassmorphism** cao cấp, mang lại trải nghiệm người dùng mượt mà và chuyên nghiệp cho môi trường giáo dục.

---

## ✨ Tính Năng Nổi Bật

### 🛡️ Hệ Thống & Bảo Mật
- **Xác thực JWT:** Bảo mật đa lớp với Access & Refresh Token, kiểm soát phiên đăng nhập Real-time.
- **Phân quyền Role-based (RBAC):** 3 vai trò chuyên biệt: `Admin`, `Teacher`, `Student`.
- **Audit Logging:** Theo dõi mọi hoạt động hệ thống quan trọng để đảm bảo tính minh bạch.
- **Real-time Notifications:** Thông báo tức thời qua WebSocket.

### 👨‍🎓 Cổng Sinh Viên
- **Đăng ký học phần:** Giao diện trực quan, kiểm tra trùng lịch thông minh.
- **Theo dõi học tập:** Xem bảng điểm, lịch học và tiến độ bài tập Dashboard.
- **Tài chính:** Quản lý học phí, hóa đơn và lịch sử thanh toán.
- **Kỳ thi:** Làm bài thi trực tuyến và xem kết quả tức thì.

### 👨‍🏫 Cổng Giảng Viên
- **Quản lý lớp học:** Điểm danh, giao bài tập và phản hồi trực tiếp cho sinh viên.
- **Chấm điểm:** Hệ thống chấm điểm linh hoạt, tự động cập nhật bảng điểm.
- **Báo cáo:** Thống kê kết quả học tập của các lớp phụ trách.

### 🏗️ Quản Trị Viên
- **Vận hành hệ thống:** Quản lý User, Khoa, Phòng học, Môn học và Lớp học.
- **Duyệt yêu cầu:** Xử lý các yêu cầu rút học phần và hỗ trợ sinh viên.
- **Quản lý tài chính:** Thiết lập chính sách học phí và duyệt thanh toán.

---

## 🛠️ Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, Motor (Async MongoDB) |
| **Frontend** | Next.js 15 (App Router), React 18, Framer Motion, CSS Modules |
| **Cơ sở dữ liệu** | MongoDB (NoSQL) |
| **Giao diện** | Vanilla CSS (Premium Glassmorphism), Lucide Icons |
| **Hạ tầng** | Docker, Docker Compose, Nginx (optional) |

---

## 🚀 Khởi Chạy Nhanh (Docker)

Cách nhanh nhất để chạy toàn bộ hệ thống là sử dụng **Docker Compose**:

```bash
# 1. Clone dự án
git clone https://github.com/DragonZux/Student-Management-System.git
cd Student-Management-System

# 2. Tạo file môi trường
cp .env.example .env

# 3. Khởi chạy Docker
docker-compose up -d --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📝 Tài Khoản Demo

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Quản trị viên** | `admin@sms.com` | `admin123` |
| **Giảng viên** | `teacher@sms.com` | `teacher123` |
| **Sinh viên** | `student@sms.com` | `student123` |

---

## 📂 Cấu Trúc Thư Mục

```text
.
├── backend/            # FastAPI Source Code
│   ├── app/            # Logic chính (Routers, Schemas, Models)
│   ├── tests/          # Unit tests backend
│   └── Dockerfile      # Backend environment
├── frontend/           # Next.js Source Code
│   ├── src/app/        # App Router & Pages
│   ├── components/     # UI Components
│   └── Dockerfile      # Frontend environment
└── docker-compose.yml  # Orchestration
```

---

## 💎 Thiết Kế Đặc Trưng

Hệ thống sử dụng ngôn ngữ thiết kế **Glassmorphism** với:
- **Hiệu ứng Blur & Transparency:** Tạo chiều sâu và sự hiện đại.
- **Animation mượt mà:** Sử dụng Framer Motion cho các chuyển động UI.
- **Phông chữ Be Vietnam Pro:** Tối ưu hóa cho hiển thị tiếng Việt chuyên nghiệp.
- **Dark/Light Mode:** Hỗ trợ linh hoạt theo sở thích người dùng.

---

## 📞 Liên Hệ

Dự án được phát triển bởi **DragonZux**. Mọi đóng góp hoặc báo lỗi xin vui lòng tạo Issue trên Github.

---

<p align="center">Made with ❤️ for Modern Education</p>
