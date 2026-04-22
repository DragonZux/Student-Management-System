# 🎓 Student Management System (SMS)

A comprehensive, scalable, and high-performance system designed to manage the entire student academic lifecycle, from enrollment to graduation.

---

## 🌟 Overview

The **Student Management System** is a robust platform built to streamline academic operations, ensure data integrity, and provide a seamless experience for students, teachers, and administrators. 

> [!TIP]
> This system is designed with a **Flexible Document Schema** in MongoDB, ensuring high performance while maintaining data relationships through efficient referencing.

---

## 🎯 1. System Objectives

### 📌 1.1. Core Vision
* **Lifecycle Management:** End-to-end management of student academic journeys.
* **Operational Excellence:** Automating manual academic workflows to reduce errors and save time.
* **Data-Driven Insights:** Providing accurate reporting and statistics for better decision-making.

### 📌 1.2. Functional Objectives
* **👤 User Management:** Centralized profiles for Students, Teachers, and Staff with Department-based categorization.
* **📚 Academic Management:** Flexible course definitions, seasonal class creation, and teacher assignments.
* **📝 Learning & Assessment:** Streamlined enrollment, attendance tracking, and comprehensive grading (Exams & Assignments).
* **📅 Scheduling:** Conflict-free class scheduling with room allocation management.
* **📊 Analytics:** Real-time GPA calculation and statistical reports (by class/department).

### 📌 1.3. Non-Functional Objectives
* **⚡ Performance:** Optimized SQL queries with proper indexing to ensure response times < 200ms for large datasets.
* **🔒 Integrity:** Strict adherence to database constraints (PK, FK, Unique) to prevent orphan records or duplicate enrollments.
* **📈 Scalability:** Modular architecture ready for multi-campus expansion and fine-grained Role-Based Access Control (RBAC).

---

## 🧩 2. Use Case Architecture

### 👤 2.1. System Actors
* **Admin:** Full system control, data management, and resource allocation.
* **Teacher:** Class management, attendance, and grading.
* **Student:** Course registration, schedule tracking, and academic performance monitoring.

### 📋 2.2. Use Case Matrix

| ID | Module | Use Case | Actor |
| :--- | :--- | :--- | :--- |
| **UC01** | Admin | Manage Students | Admin |
| **UC02** | Admin | Manage Teachers | Admin |
| **UC03** | Admin | Manage Courses & Prerequisites | Admin |
| **UC04** | Admin | Create Classes & Capacity | Admin |
| **UC05** | Admin | Assign Teachers & Rooms | Admin |
| **UC06** | Student | Class Enrollment | Student |
| **UC07** | Student | View Schedule (Weekly/Exam) | Student |
| **UC08** | Teacher | Attendance Tracking | Teacher |
| **UC09** | Teacher | Create Assignments & Deadlines | Teacher |
| **UC10** | Student | Submit Assignments | Student |
| **UC11** | Teacher | Grading & Feedback | Teacher |
| **UC12** | Student | View Grades & GPA | Student |
| **UC13** | Admin | Manage Departments/Faculties | Admin |
| **UC14** | Admin | Manage Classrooms/Infrastructure | Admin |
| **UC15** | Admin | Tuition & Fee Management | Admin |
| **UC16** | Student | Pay Tuition Online | Student |
| **UC17** | Student | Request Course Withdrawal | Student |
| **UC18** | Student | Academic Transcript Export | Student |
| **UC19** | Student | Course Feedback/Survey | Student |
| **UC20** | Admin | System Audit Logs | Admin |
| **UC21** | All | Notification Center (Real-time) | All |
| **UC22** | All | Profile & Security Management | All |

---

## 🔍 3. Business Rules (The "Golden" Rules)

To ensure system stability and business logic consistency, the following rules are enforced:

1.  **Unique Enrollment:** A student cannot enroll in the same class more than once.
2.  **Resource Allocation:** A class must have exactly one primary teacher assigned.
3.  **Hierarchy:** A course can spawn multiple classes (sections), but a class belongs to only one course.
4.  **Conflict Resolution:** No scheduling conflicts are permitted for the same room or the same teacher at the same time.
5.  **Submission Integrity:** Submissions are timestamped; late submissions are flagged based on the assignment deadline.
6.  **Capacity Check:** (Added) Enrollments must not exceed the class's maximum capacity.
7.  **Prerequisites:** (Added) Students must pass prerequisite courses before enrolling in advanced classes.

---

## 🛠️ 4. Technical Stack (Proposed)

*   **Backend:** FastAPI (Python) - *High performance, async support.*
*   **Database:** MongoDB - *Scalable document-oriented data management.*
*   **Frontend:** Next.js - *Modern React framework for optimized performance.*
*   **Auth:** JWT-based Role-Based Access Control (RBAC).
*   **Driver/ODM:** PyMongo / Beanie (Optional ODM).


---

## 🐳 6. Docker Deployment

This project is fully containerized using Docker for consistent development and deployment environments.

### 📦 Services
*   **API:** Python FastAPI server.
*   **Web:** Next.js frontend application.
*   **DB:** MongoDB instance.

### 🚀 Quick Start (Docker)

1.  **Navigate to the project directory:**
    ```bash
    cd student-management-system
    ```

2.  **Environment Setup:**
    Create a `.env` file in the root directory based on `.env.example`.

3.  **Build and Run:**
    ```bash
    docker-compose up --build
    ```

4.  **Access the applications:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:8000`
    *   **API Documentation:** `http://localhost:8000/docs`

---

## 📂 7. Project Structure

```text
student-management-system/
├── backend/            # FastAPI Application
│   ├── app/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # Next.js Application
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml  # Container Orchestration
├── .env.example        # Environment Template
└── README.md
```
