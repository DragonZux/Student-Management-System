# 📋 Project Roadmap: Student Management System (SMS)

This document tracks the progress of the SMS project. Tasks are categorized by phase and priority.

---

## 🛠️ Phase 1: Foundation & Infrastructure
- [x] **1.1. Project Initialization:**
  - [x] Create folder structure (`backend`, `frontend`).
  - [x] Initialize FastAPI project.
  - [x] Initialize Next.js project.
- [x] **1.2. Dockerization:**
  - [x] Create `Dockerfile` for Backend.
  - [x] Create `Dockerfile` for Frontend.
  - [x] Create `docker-compose.yml` (App + MongoDB).
- [x] **1.3. Environment Configuration:**
  - [x] Setup `.env` template and validation logic.

---

## 🗄️ Phase 2: Database & Data Modeling
- [x] **2.1. MongoDB Schema Design:**
  - [x] Define `Users` collection (Student, Teacher, Admin).
  - [x] Define `Courses` & `Classes` collections.
  - [x] Define `Enrollments`, `Attendance`, and `Grades` collections.
- [x] **2.2. Core Data Layer:**
  - [x] Implement MongoDB connection client (using PyMongo/Beanie).
  - [x] Create Base Repository for CRUD operations.

---

## ⚙️ Phase 3: Backend Development (Core API)
- [x] **3.1. Authentication & Security:**
  - [x] Implement JWT token generation/validation.
  - [x] Setup Role-Based Access Control (RBAC) middleware.
- [x] **3.2. Admin Module:**
  - [x] Student & Teacher management APIs.
  - [x] Course & Class creation APIs.
- [x] **3.3. Student Module:**
  - [x] Enrollment logic (Check capacity & prerequisites).
  - [x] Schedule viewing API.
- [x] **3.4. Teacher Module:**
  - [x] Attendance tracking API.
  - [x] Assignment & Grading APIs.

---

## 🎨 Phase 4: Frontend Development (UI/UX)
- [x] **4.1. Design System:**
  - [x] Setup TailwindCSS/Vanilla CSS components.
  - [x] Create shared components (Buttons, Modals, Tables).
- [x] **4.2. Dashboards:**
  - [x] Admin Dashboard (Statistics + Management).
  - [x] Teacher Portal (Class management).
  - [x] Student Portal (Registration + Grades).
- [x] **4.3. API Integration:**
  - [x] Setup Axios/Fetch clients with interceptors.

---

## 🌟 Phase 5: Advanced Features
- [x] **5.1. Finance Module:**
  - [x] Tuition fee calculation logic.
  - [x] Payment status tracking.
- [x] **5.2. Notification System:**
  - [x] Real-time alerts using WebSockets or SSE.
- [x] **5.3. Reporting:**
  - [x] Exporting academic transcripts (PDF).
  - [x] Statistical charts for Admin.

---

## 🧪 Phase 6: Quality Assurance & Polish
- [x] **6.1. Testing:**
  - [x] Unit testing for core business logic.
  - [x] Integration testing for API endpoints.
- [x] **6.2. Optimization:**
  - [x] Indexing MongoDB collections for fast queries.
  - [x] Frontend performance optimization (SEO, Image loading).
- [x] **6.3. Documentation:**
  - [x] Finalize API documentation (Swagger/OpenAPI).
