-- Drop tables if they exist to start fresh (Development only, strictly)
-- DROP TABLE IF EXISTS assignments;
-- DROP TABLE IF EXISTS courses;
-- DROP TABLE IF EXISTS students;
-- DROP TABLE IF EXISTS admins;

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    matric_number VARCHAR(50) UNIQUE NOT NULL,
    level VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL,
    course_title VARCHAR(255) NOT NULL,
    admin_writeup TEXT,
    active BOOLEAN DEFAULT FALSE, -- Only one active allowed via logic
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Seed Default Admin (password: admin123)
-- Hash generated via bcrypt.hashSync('admin123', 10)
-- $2b$10$X7.G.w/k.m/k.m/k.m/k.m/k.m/k.m (placeholder, I will generate a real hash in the code setup or put a known one here)
-- Actually, I'll use a known hash for 'admin123'
-- $2b$10$5M.Zk.Wk.Wk.Wk.Wk.Wk.Wk.Wk.Wk.Wk (This is fake)
-- I'll generate it in the JS migration runner to be safe, or just insert it here.
-- Let's use a standard bcrypt hash for 'admin123': $2b$10$viie.S8/F1o1./y/y./y./y./y./y./y./y./y./y./y./y./y
-- Wait, I will create a seed script instead of raw SQL to ensure the hash is correct.
-- But for schema, this is fine.
