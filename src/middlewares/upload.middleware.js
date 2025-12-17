const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Helper to get active course
async function getActiveCourse() {
    const res = await db.query('SELECT * FROM courses WHERE active = TRUE LIMIT 1');
    return res.rows[0];
}

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const course = await getActiveCourse();
            if (!course) {
                return cb(new Error('No active course for submission'));
            }
            
            const dir = path.join(__dirname, '../../uploads', course.course_code);
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Attach course to req for controller use
            req.activeCourse = course;
            cb(null, dir);
        } catch (err) {
            cb(err);
        }
    },
    filename: function (req, file, cb) {
        // Format: {StudentName}_{MatricNumber}.{extension}
        const user = req.session.user;
        if (!user) return cb(new Error('Not authenticated'));
        
        // Sanitize name: remove spaces/special chars or keep them?
        // "File name format: {StudentName}_{MatricNumber}.{extension}"
        // Usually safer to replace spaces with underscores.
        const sanitizedName = user.name.replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedMatric = user.matric_number.replace(/[^a-zA-Z0-9]/g, '');
        const ext = path.extname(file.originalname);
        
        const filename = `${sanitizedName}_${sanitizedMatric}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed extensions: pdf, doc, docx, txt, zip, c, cpp, java, py, js
    const allowed = /pdf|doc|docx|txt|zip|c|cpp|java|py|js/;
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowed.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

module.exports = upload;
