const db = require('../config/db');
const fs = require('fs');

exports.getDashboard = async (req, res) => {
    const studentId = req.session.user.id;
    
    try {
        // Get active course
        const courseRes = await db.query('SELECT * FROM courses WHERE active = TRUE LIMIT 1');
        const activeCourse = courseRes.rows[0] || null;

        let submission = null;
        if (activeCourse) {
            // Check for existing submission
            const subRes = await db.query(
                'SELECT * FROM assignments WHERE student_id = $1 AND course_id = $2',
                [studentId, activeCourse.id]
            );
            submission = subRes.rows[0] || null;
        }

        res.render('student/dashboard', { activeCourse, submission, error: null, success: null });

    } catch (err) {
        console.error(err);
        res.render('student/dashboard', { activeCourse: null, submission: null, error: 'System error', success: null });
    }
};

exports.uploadAssignment = async (req, res) => {
    // Middleware 'upload.single' runs before this, saving the file and attaching req.file and req.activeCourse
    const file = req.file;
    const course = req.activeCourse; // set in multer middleware
    const studentId = req.session.user.id;

    if (!file) {
         // This might happen if filter rejected it. Multer errors usually handled by error handler wrapper
         // But simplistic check here:
         return res.render('student/dashboard', { 
             activeCourse: course || null, // Need to refetch if not present, but multer should have set it if it ran. 
             // Ideally we redirect, but we want to show error.
             submission: null, 
             error: 'File upload failed. Check format and size.',
             success: null
         }); 
         // Actually, if we are here, multer ran. If req.file is missing, user didn't select one.
    }
    
    if (!course) {
        // Should not happen if multer succeeded
         return res.redirect('/student/dashboard');
    }

    try {
        // Check if submission already exists (Double check for safety)
        const existingSub = await db.query(
            'SELECT * FROM assignments WHERE student_id = $1 AND course_id = $2',
            [studentId, course.id]
        );

        if (existingSub.rows.length > 0) {
            return res.render('student/dashboard', { 
                activeCourse: course, 
                submission: existingSub.rows[0], 
                error: 'You have already submitted an assignment for this course.',
                success: null
            });
        }

        // Insert new assignment record (No Update)
        const filePath = file.path; // Absolute path on server
        
        await db.query(`
            INSERT INTO assignments (student_id, course_id, file_path, submitted_at)
            VALUES ($1, $2, $3, NOW())
        `, [studentId, course.id, filePath]);

        // Redirect to clear form submission
        res.redirect('/student/dashboard');

    } catch (err) {
        console.error('Upload DB Error:', err);
        res.render('student/dashboard', { 
            activeCourse: course, 
            submission: null, 
            error: 'Database error recording submission.',
            success: null
        });
    }
};
