# University Assignment Submission Portal

A secure, web-based assignment submission system for university environments.

## Features
- **Strict Role Separation**: Admin and Student portals.
- **Deterministic File Storage**: Assignments stored in `uploads/{course_code}/{Name}_{Matric}.{ext}`.
- **Batched Downloads**: Admins can download all submissions for a course as a ZIP file.
- **Security**: 
    - Bcrypt password hashing.
    - Session-based authentication.
    - CSRF protection.
- **Operations**: PostgreSQL backed, server-rendered views (EJS).

## Setup

1.  **Prerequisites**:
    - Node.js (v14+)
    - PostgreSQL

2.  **Installation**:
    ```bash
    npm install
    ```

3.  **Database Configuration**:
    - The application looks for environment variables: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`.
    - Defaults: user `postgres`, password `asphalt6`, db `assignment_portal`.
    - To customize, create a `.env` file or set variables in shell.

4.  **Database Migration & Seeding**:
    - Run the migration script to create tables and seed the default admin.
    ```bash
    node migrations/migrate.js
    ```
    - **Default Admin Credentials**:
        - Username: `admin`
        - Password: `admin` (change immediately after first login via DB or future feature)

5.  **Running the Server**:
    ```bash
    npm start
    ```
    - Server runs at `http://localhost:3000`.

## Operational Guide

### For Admins
1.  Login at `/auth/login`.
2.  **Create Course**: Enter course code and title.
3.  **Activate Course**: Click "Activate" to open submissions. Only one course can be active for submission at a time.
4.  **Import Students**: Upload a CSV file (Headers: `name, matric_number, level`).
    - *Note*: Creating a student sets their initial password to their **Matric Number**.
5.  **Review**: Click "View" on a course to see submissions.
6.  **Download**: Click "Download All Submissions (ZIP)" to archive student files.

### For Students
1.  Login using **Matric Number** as username and password (initially).
2.  Change password upon first login (recommended).
3.  View the currently active course instructions.
4.  Upload assignment (PDF, DOCX, ZIP, etc).
5.  Re-uploading replaces the previous submission for that course.

## Architecture
- **Backend**: Node.js + Express
- **DB**: PostgreSQL
- **Frontend**: EJS Templates
- **Auth**: `express-session` + `bcrypt` + `csurf`
