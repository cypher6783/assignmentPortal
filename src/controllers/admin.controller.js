const db = require('../config/db');
const { parse } = require('csv-parse');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

exports.getDashboard = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM courses ORDER BY created_at DESC');
        res.render('admin/dashboard', { courses: result.rows });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

exports.createCourse = async (req, res) => {
    const { course_code, course_title, admin_writeup } = req.body;
    try {
        await db.query(
            'INSERT INTO courses (course_code, course_title, admin_writeup) VALUES ($1, $2, $3)',
            [course_code, course_title, admin_writeup]
        );
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', { error: 'Error creating course', courses: [] }); // simplistic error handling
    }
};

exports.toggleCourseStatus = async (req, res) => {
    const { id } = req.params;
    try {
        // First, deactivate all courses if we are activating one (Rule: Only one active submission course at a time)
        // Wait, requirements say "Only one active submission course at a time".
        const course = await db.query('SELECT active FROM courses WHERE id = $1', [id]);
        const isActive = course.rows[0].active;

        if (!isActive) {
            await db.query('UPDATE courses SET active = FALSE'); // Deactivate all
            await db.query('UPDATE courses SET active = TRUE WHERE id = $1', [id]); // Activate active
        } else {
            await db.query('UPDATE courses SET active = FALSE WHERE id = $1', [id]);
        }
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

exports.getCourseDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const courseRes = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
        const course = courseRes.rows[0];

        const studentsRes = await db.query('SELECT * FROM students ORDER BY matric_number');
        
        // Get submission counts or data?
        // "Assignment dashboard grouped by course code"
        // Also "View submissions by course"
        const submissionsRes = await db.query(`
            SELECT a.*, s.name, s.matric_number 
            FROM assignments a 
            JOIN students s ON a.student_id = s.id 
            WHERE a.course_id = $1
        `, [id]);

        res.render('admin/course-details', { 
            course, 
            students: studentsRes.rows, 
            submissions: submissionsRes.rows 
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

exports.uploadStudents = (req, res) => {
    if (!req.file) {
        return res.redirect('/admin/dashboard'); // handle error better
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (data) => results.push(data)) // Expects: name, matric_number, level
        .on('end', async () => {
            // Process students
            // Idempotent import
            try {
                for (const student of results) {
                    // Default password = matric_number
                    const passwordHash = await bcrypt.hash(student.matric_number, 10);
                    
                    await db.query(`
                        INSERT INTO students (name, matric_number, level, password_hash)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (matric_number) 
                        DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level, active = TRUE
                    `, [student.name, student.matric_number, student.level, passwordHash]);
                }
                // Cleanup temp file
                fs.unlinkSync(req.file.path);
                const referrer = req.header('Referer') || '/admin/dashboard';
                res.redirect(referrer);
            } catch (err) {
                console.error('CSV Import Error:', err);
                res.redirect('/admin/dashboard');
            }
        });
};

exports.deleteStudent = async (req, res) => {
    const { id } = req.body; // or params
    try {
        // Hard revoke access
        await db.query('DELETE FROM students WHERE id = $1', [id]);
        // Also invalidates session implicitly if session store checks db, but express-session with memory store doesn't. 
        // Security Rule #4: "Session invalidation enforced on deletion". 
        // With default memory store, we can't easily kill their specific session without a session store (redis/pg).
        // For this task ("No cloud dependencies", "PostgreSQL as authoritative"), 
        // we should probably check DB on every request or use pg-simple-store.
        // Given constraints, checking DB in middleware `auth.middleware.js` `isStudent` is safer.
        // I will add a check in `auth.middleware.js` to reload user from DB to ensure they still exist/active.
        
        const referrer = req.header('Referer') || '/admin/dashboard';
        res.redirect(referrer);
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

exports.downloadSubmissions = async (req, res) => {
    const { courseId } = req.params;
    
    try {
        // Fetch course to get code
        const courseRes = await db.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseRes.rows.length === 0) return res.status(404).send('Course not found');
        
        const course = courseRes.rows[0];
        const sourceDir = path.join(__dirname, '../../uploads', course.course_code);

        if (!fs.existsSync(sourceDir)) {
             // Create empty zip or 404? 
             // Just return 404 or empty zip.
             return res.status(404).send('No uploads found for this course');
        }

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        res.attachment(`${course.course_code}_submissions.zip`);
        archive.pipe(res);

        archive.directory(sourceDir, false);
        await archive.finalize();

    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating zip');
    }
};
