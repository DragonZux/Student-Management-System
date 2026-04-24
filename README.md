# Student Management System

Hệ thống quản lý sinh viên full-stack, gồm:
- **Backend**: FastAPI + MongoDB + JWT Auth
- **Frontend**: Next.js (App Router) cho 3 vai trò `admin` / `teacher` / `student`
- **Deployment local**: Docker Compose (backend, frontend, mongodb)

## Tinh nang chinh

- Xac thuc dang nhap bang JWT, co `refresh-token`, quan ly phien dang nhap.
- Quan ly nguoi dung va vai tro: admin, giang vien, sinh vien.
- Quan ly hoc vu: mon hoc, lop hoc, dang ky hoc phan, lich hoc, diem.
- Quan ly giang day: diem danh, bai tap, cham diem, phan hoi lop hoc.
- Quan ly tai chinh: hoc phi, hoa don, thanh toan, tong hop theo ky.
- Quan ly thi cu va bao cao thong ke.
- Nhat ky he thong (audit logs) va trung tam thong bao.

## Kien truc tong quan

```text
Frontend (Next.js, port 3000)
        |
        | /api/* (rewrite qua Next)
        v
Backend (FastAPI, port 8000)
        |
        v
MongoDB (port 27017)
```

- Frontend goi API qua `/api/*`.
- `next.config.js` rewrite `/api/:path*` -> `http://backend:8000/api/:path*` khi chay Docker.

## Cong nghe su dung

### Backend
- Python 3.11
- FastAPI
- Motor / PyMongo (MongoDB)
- JWT (`python-jose`, `PyJWT`)
- `passlib[bcrypt]` cho hash password

### Frontend
- Next.js 14
- React 18
- Axios
- Lucide React
- Framer Motion

### Ha tang local
- Docker / Docker Compose
- MongoDB container

## Cau truc thu muc

```text
.
├── backend/
│   ├── app/
│   │   ├── api/             # auth, admin, student, teacher, finance, exams, reports, ...
│   │   ├── core/            # config, database, security, audit, schedule
│   │   ├── models/
│   │   └── schemas/
│   ├── seed_full_system.py  # seed du lieu demo
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/             # login + dashboard theo role
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   ├── next.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## API modules

Backend mount tai prefix `/api` va gom cac nhom endpoint:
- `/api/auth` - dang nhap, refresh token, profile, doi mat khau.
- `/api/admin` - quan tri sinh vien, giang vien, mon hoc, lop hoc, khoa, phong hoc, audit...
- `/api/student` - dang ky hoc, xem diem, tai chinh, bang diem, rut hoc phan...
- `/api/teacher` - diem danh, bai tap, cham diem, phan hoi.
- `/api/finance` - hoc phi, hoa don, thanh toan.
- `/api/exams` - nghiep vu thi cu.
- `/api/reports` - thong ke va bao cao.
- `/api/notifications` - thong bao he thong.

## Use Case toan bo du an

### 1) Tac nhan (Actors)

- `Admin`: quan tri he thong, du lieu hoc vu, nguoi dung, tai chinh, audit.
- `Teacher`: quan ly lop phu trach, diem danh, bai tap, cham diem, phan hoi.
- `Student`: dang ky hoc phan, theo doi lich hoc, diem, tai chinh, rut hoc phan.
- `System`: xu ly token, thong bao, audit, tinh toan tong hop tu dong.

### 2) Use Case matrix

| ID | Use Case | Actor chinh | Mo ta ngan |
| --- | --- | --- | --- |
| UC01 | Dang nhap | Admin/Teacher/Student | Xac thuc tai khoan va cap JWT |
| UC02 | Lam moi token | Admin/Teacher/Student | Gia han phien lam viec khong dang nhap lai |
| UC03 | Xem/Ca nhan hoa ho so | Admin/Teacher/Student | Xem va cap nhat thong tin ca nhan |
| UC04 | Doi mat khau | Admin/Teacher/Student | Doi mat khau voi kiem tra mat khau cu |
| UC05 | Quan ly sinh vien | Admin | Tao/sua/khoa/mo khoa tai khoan sinh vien |
| UC06 | Quan ly giang vien | Admin | Tao/sua/khoa/mo khoa tai khoan giang vien |
| UC07 | Quan ly khoa/bo mon | Admin | Tao/sua/xoa khoa, cau hinh thuoc tinh |
| UC08 | Quan ly phong hoc | Admin | Tao/sua/xoa phong, suc chua, co so vat chat |
| UC09 | Quan ly mon hoc | Admin | Tao/sua mon hoc, so tin chi, tien quyet |
| UC10 | Quan ly lop hoc phan | Admin | Tao lop theo ky, gan giang vien, phong hoc |
| UC11 | Theo doi nhat ky he thong | Admin | Theo doi hanh dong quan trong trong he thong |
| UC12 | Quan ly thi cu | Admin/Teacher | Tao lich thi, cap nhat thong tin ky thi |
| UC13 | Dang ky hoc phan | Student | Dang ky lop hoc con cho, dung dieu kien |
| UC14 | Xem lich hoc | Student | Xem lich hoc va thong tin lop da dang ky |
| UC15 | Xem diem va bang diem | Student | Xem diem tung hoc phan va tong hop ket qua |
| UC16 | Gui yeu cau rut hoc phan | Student | Tao yeu cau rut hoc phan den admin |
| UC17 | Duyet rut hoc phan | Admin | Phe duyet/tu choi rut hoc phan cua sinh vien |
| UC18 | Quan ly diem danh | Teacher | Tao ban ghi diem danh theo buoi hoc |
| UC19 | Quan ly bai tap | Teacher | Tao bai tap, deadline, cap nhat trang thai |
| UC20 | Cham diem va nhan xet | Teacher | Cham diem bai tap/hoc phan cho sinh vien |
| UC21 | Xu ly hoc phi va hoa don | Admin/Student | Quan ly hoa don, thanh toan, tinh trang no |
| UC22 | Xem bao cao thong ke | Admin | Tong hop du lieu hoc vu, tai chinh, van hanh |
| UC23 | Nhan thong bao he thong | Admin/Teacher/Student | Nhan thong bao lien quan den vai tro |

### 3) Dac ta chi tiet use case

#### UC01 - Dang nhap
- **Actor**: Admin/Teacher/Student
- **Muc tieu**: Truy cap he thong theo dung vai tro.
- **Tien dieu kien**: Tai khoan ton tai, dang hoat dong.
- **Luong chinh**:
  1. Nguoi dung nhap email/password.
  2. He thong xac thuc thong tin dang nhap.
  3. He thong tao `access_token` va tao session id (`jti`) dang hoat dong.
  4. Frontend tai thong tin profile (`/auth/me`) va dieu huong dashboard theo role.
- **Ngoai le**:
  - Sai thong tin: bao `Incorrect email or password`.
  - Tai khoan bi khoa: thong bao tai khoan khong hoat dong.
- **Hau dieu kien**: Phien dang nhap hop le duoc tao.

#### UC02 - Lam moi token
- **Actor**: Admin/Teacher/Student
- **Muc tieu**: Duy tri phien lam viec.
- **Tien dieu kien**: Co token hop le.
- **Luong chinh**:
  1. Frontend goi `/auth/refresh-token` dinh ky.
  2. He thong cap token moi theo session hien tai.
- **Ngoai le**: Token het han/khong hop le -> yeu cau dang nhap lai.
- **Hau dieu kien**: Token moi duoc cap, nguoi dung tiep tuc thao tac.

#### UC03 - Xem va cap nhat ho so
- **Actor**: Admin/Teacher/Student
- **Muc tieu**: Quan ly thong tin ca nhan.
- **Tien dieu kien**: Da dang nhap.
- **Luong chinh**:
  1. Nguoi dung vao trang profile.
  2. He thong tra du lieu tu `/auth/me`.
  3. Nguoi dung cap nhat thong tin cho phep.
  4. He thong luu thay doi va ghi audit.
- **Ngoai le**: Email trung -> tu choi cap nhat.
- **Hau dieu kien**: Ho so moi duoc cap nhat.

#### UC04 - Doi mat khau
- **Actor**: Admin/Teacher/Student
- **Muc tieu**: Tang cuong bao mat tai khoan.
- **Tien dieu kien**: Da dang nhap, biet mat khau hien tai.
- **Luong chinh**:
  1. Nguoi dung nhap mat khau cu va mat khau moi.
  2. He thong kiem tra mat khau cu, do dai mat khau moi.
  3. He thong hash mat khau moi va cap nhat DB.
- **Ngoai le**: Mat khau cu sai / mat khau moi qua ngan.
- **Hau dieu kien**: Mat khau duoc thay doi thanh cong.

#### UC05/UC06 - Quan ly sinh vien, giang vien
- **Actor**: Admin
- **Muc tieu**: Quan tri toan bo user hoc vu.
- **Tien dieu kien**: Admin da dang nhap.
- **Luong chinh**:
  1. Admin xem danh sach user theo role.
  2. Admin tao/sua thong tin user.
  3. Admin khoa/mo khoa tai khoan theo nhu cau.
  4. He thong ghi audit cho cac thay doi quan trong.
- **Ngoai le**: Trung email, du lieu khong hop le.
- **Hau dieu kien**: Du lieu user cap nhat dong bo.

#### UC07 - Quan ly khoa/bo mon
- **Actor**: Admin
- **Muc tieu**: Duy tri cau truc don vi dao tao.
- **Tien dieu kien**: Admin da dang nhap.
- **Luong chinh**: Tao/sua/xoa khoa, gan metadata mo ta.
- **Ngoai le**: Xung dot rang buoc du lieu dang su dung.
- **Hau dieu kien**: Danh muc khoa duoc cap nhat.

#### UC08 - Quan ly phong hoc
- **Actor**: Admin
- **Muc tieu**: Quan ly tai nguyen phong hoc.
- **Tien dieu kien**: Admin da dang nhap.
- **Luong chinh**: Tao/sua/xoa phong, suc chua, thiet bi.
- **Ngoai le**: Trung ma phong, du lieu khong hop le.
- **Hau dieu kien**: Du lieu phong hoc san sang cho lap lich.

#### UC09 - Quan ly mon hoc
- **Actor**: Admin
- **Muc tieu**: Dinh nghia khung mon hoc.
- **Tien dieu kien**: Admin da dang nhap.
- **Luong chinh**: Tao/sua mon hoc, so tin chi, hoc phan tien quyet.
- **Ngoai le**: Trung ma mon / tien quyet khong hop le.
- **Hau dieu kien**: Danh muc mon hoc duoc cap nhat.

#### UC10 - Quan ly lop hoc phan
- **Actor**: Admin
- **Muc tieu**: Mo lop theo ky hoc.
- **Tien dieu kien**: Da co mon hoc, giang vien, phong hoc.
- **Luong chinh**:
  1. Admin tao lop theo hoc ky.
  2. Gan giang vien phu trach, phong hoc, lich hoc, suc chua.
  3. He thong luu thong tin de sinh vien dang ky.
- **Ngoai le**: Vuot suc chua, xung dot lich tai nguyen.
- **Hau dieu kien**: Lop hoc phan duoc mo thanh cong.

#### UC11 - Theo doi nhat ky he thong
- **Actor**: Admin
- **Muc tieu**: Truy vet hanh dong va van hanh he thong.
- **Tien dieu kien**: Admin da dang nhap.
- **Luong chinh**: Xem danh sach audit event theo thoi gian/hanh dong.
- **Ngoai le**: Khong co du lieu trong bo loc hien tai.
- **Hau dieu kien**: Admin nam duoc lich su tac nghiep.

#### UC12 - Quan ly thi cu
- **Actor**: Admin/Teacher
- **Muc tieu**: Quan ly thong tin ky thi.
- **Tien dieu kien**: Da co lop hoc/mon hoc lien quan.
- **Luong chinh**: Tao/cap nhat thong tin ky thi, tra cuu danh sach.
- **Ngoai le**: Trung lich thi, du lieu khong hop le.
- **Hau dieu kien**: Ke hoach thi cu duoc luu.

#### UC13 - Dang ky hoc phan
- **Actor**: Student
- **Muc tieu**: Dang ky lop hoc phan trong ky.
- **Tien dieu kien**: Student da dang nhap, lop con cho.
- **Luong chinh**:
  1. Student xem danh sach lop co the dang ky.
  2. Chon lop hoc phan.
  3. He thong kiem tra rang buoc (trung dang ky, suc chua, dieu kien).
  4. He thong tao enrollment va cap nhat so luong.
- **Ngoai le**: Lop day, da dang ky roi, khong dat dieu kien.
- **Hau dieu kien**: Student co ten trong danh sach lop.

#### UC14 - Xem lich hoc
- **Actor**: Student
- **Muc tieu**: Theo doi lich hoc ca nhan.
- **Tien dieu kien**: Da co enrollment.
- **Luong chinh**: He thong tong hop lich tu cac lop da dang ky.
- **Ngoai le**: Chua dang ky mon nao.
- **Hau dieu kien**: Lich hoc hien thi theo tuan/ky.

#### UC15 - Xem diem va bang diem
- **Actor**: Student
- **Muc tieu**: Theo doi ket qua hoc tap.
- **Tien dieu kien**: Da co du lieu diem.
- **Luong chinh**: Student xem diem tung mon, tong hop bang diem/GPA neu co.
- **Ngoai le**: Mon chua co diem.
- **Hau dieu kien**: Student biet tinh trang hoc tap hien tai.

#### UC16 - Gui yeu cau rut hoc phan
- **Actor**: Student
- **Muc tieu**: Xin rut hoc phan theo quy dinh.
- **Tien dieu kien**: Da dang ky hoc phan.
- **Luong chinh**: Tao yeu cau rut + ly do -> gui admin.
- **Ngoai le**: Qua han rut hoc phan / khong ton tai enrollment.
- **Hau dieu kien**: Yeu cau cho duyet.

#### UC17 - Duyet rut hoc phan
- **Actor**: Admin
- **Muc tieu**: Xu ly yeu cau rut hoc phan.
- **Tien dieu kien**: Co yeu cau dang cho.
- **Luong chinh**: Admin xem yeu cau -> phe duyet/tu choi -> cap nhat enrollment va so luong lop.
- **Ngoai le**: Yeu cau da xu ly truoc do.
- **Hau dieu kien**: Trang thai yeu cau va enrollment duoc cap nhat.

#### UC18 - Quan ly diem danh
- **Actor**: Teacher
- **Muc tieu**: Ghi nhan chuyen canh.
- **Tien dieu kien**: Teacher duoc phan cong lop.
- **Luong chinh**: Chon lop + ngay hoc -> danh dau trang thai tung sinh vien -> luu ban ghi.
- **Ngoai le**: Lop khong thuoc teacher, du lieu khong hop le.
- **Hau dieu kien**: Attendance duoc luu va student co the theo doi.

#### UC19 - Quan ly bai tap
- **Actor**: Teacher
- **Muc tieu**: Giao nhiem vu hoc tap.
- **Tien dieu kien**: Teacher duoc phan cong lop.
- **Luong chinh**: Tao bai tap, mo ta, deadline; cap nhat/xoa khi can.
- **Ngoai le**: Deadline khong hop le.
- **Hau dieu kien**: Bai tap hien thi cho student trong lop.

#### UC20 - Cham diem va nhan xet
- **Actor**: Teacher
- **Muc tieu**: Danh gia ket qua hoc tap.
- **Tien dieu kien**: Co bai nop/du lieu hoc phan.
- **Luong chinh**: Nhap diem, nhan xet, cap nhat ket qua hoc phan.
- **Ngoai le**: Diem ngoai khoang hop le.
- **Hau dieu kien**: Diem cap nhat cho student xem.

#### UC21 - Xu ly hoc phi va hoa don
- **Actor**: Admin/Student
- **Muc tieu**: Quan ly nghia vu tai chinh theo ky.
- **Tien dieu kien**: Da co enrollment va chinh sach hoc phi.
- **Luong chinh**:
  1. He thong tinh tong tin chi va tao hoa don.
  2. Admin cap nhat/ghi nhan thanh toan.
  3. Student xem tinh trang hoc phi va lich su thanh toan.
- **Ngoai le**: Khong tim thay hoa don / du lieu thanh toan loi.
- **Hau dieu kien**: Trang thai hoa don (`unpaid`, `partially_paid`, `paid`) duoc cap nhat.

#### UC22 - Xem bao cao thong ke
- **Actor**: Admin
- **Muc tieu**: Ho tro ra quyet dinh dieu hanh.
- **Tien dieu kien**: Du lieu nghiep vu da phat sinh.
- **Luong chinh**: Xem bao cao tong hop hoc vu, tai chinh, van hanh.
- **Ngoai le**: Bo loc rong khong co ket qua.
- **Hau dieu kien**: Co du lieu tong hop de danh gia tinh hinh.

#### UC23 - Nhan thong bao he thong
- **Actor**: Admin/Teacher/Student
- **Muc tieu**: Nhan thong tin lien quan den hanh dong/nghiep vu.
- **Tien dieu kien**: Nguoi dung da dang nhap.
- **Luong chinh**: He thong tao thong bao, nguoi dung xem danh sach va danh dau da doc.
- **Ngoai le**: Khong co thong bao moi.
- **Hau dieu kien**: Nguoi dung cap nhat trang thai thong tin kip thoi.

### 4) Business rules chinh trong use case

- Mot sinh vien khong duoc dang ky trung 1 lop hoc phan.
- Trang thai tai khoan `is_active = false` khong duoc dang nhap.
- Token het han phai refresh hoac dang nhap lai.
- Mật khau moi phai dat toi thieu 8 ky tu.
- Tat ca hanh dong quan trong (auth, cap nhat du lieu) can duoc ghi audit.
- Hoa don va thanh toan phai dong bo voi enrollment va hoc ky.

## Yeu cau moi truong

- Docker Desktop (khuyen nghi cho setup nhanh)
- Hoac:
  - Python 3.11+
  - Node.js 20+
  - MongoDB 6+

## Bien moi truong

Tao file `.env` tu `.env.example` o thu muc goc:

```env
SECRET_KEY=change-me-super-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=sms_db
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

Luu y:
- Khi chay Docker, backend trong compose dung `MONGO_URI=mongodb://mongodb:27017/sms_db`.
- Frontend Docker goi backend thong qua rewrite `/api` nen khong can hard-code host backend o browser.

## Chay bang Docker (khuyen nghi)

1. Tao `.env` tu `.env.example`.
2. Build va chay:

```bash
docker compose up --build
```

3. Truy cap:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

## Chay thu cong (khong Docker)

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Dam bao MongoDB dang chay local tai `mongodb://localhost:27017`.

## Seed du lieu demo

Du an co script seed day du lieu mau:

```bash
cd backend
python seed_full_system.py
```

Script se tao:
- Department, classroom, course, class
- Nguoi dung admin/teacher/student
- Enrollment, attendance, assignment/submission
- Finance (fee policy, invoice, payment)
- Audit logs

### Tai khoan demo

- Admin: `admin@sms.com` / `admin123`
- Teacher: `teacher@sms.com` / `teacher123`
- Student: `student@sms.com` / `student123`

> Khuyen cao: doi ngay mat khau va `SECRET_KEY` truoc khi dua vao production.

## Giao dien theo vai tro

- `admin`: dashboard, quan ly sinh vien/giang vien/mon hoc/lop/khoa/phong, tai chinh, audit, duyet rut hoc phan.
- `teacher`: dashboard, diem danh, bai tap, cham diem, phan hoi, ky thi.
- `student`: dashboard, dang ky hoc, lich hoc, diem, tai chinh, rut hoc phan, bang diem, phan hoi.

## Bao mat va van hanh

- JWT access token het han mac dinh sau `30` phut.
- Frontend co co che refresh token dinh ky.
- Password hash bang bcrypt.
- Co audit event cho cac hanh dong quan trong.

## Lenh huu ich

- Chay frontend dev: `npm run dev` (trong `frontend`)
- Build frontend: `npm run build`
- Chay backend dev: `uvicorn app.main:app --reload` (trong `backend`)

## Luu y production

- Tat `DEBUG` va bo cac origin CORS khong can thiet.
- Cau hinh reverse proxy (Nginx/Caddy) + HTTPS.
- Quan ly secret qua env manager/secret store.
- Them backup va monitoring cho MongoDB.

---

Neu ban muon, minh co the viet them:
- Checklist deploy production theo tung buoc.
- So do ER/mapping collection cho MongoDB.
- Tai lieu API ngac nhien (curl/Postman collection) tu code hien tai.
