const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { isStudent } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(isStudent);

router.get('/dashboard', studentController.getDashboard);

// Handle Multer errors specially
const uploadMiddleware = (req, res, next) => {
    upload.single('assignment')(req, res, (err) => {
        if (err) {
             // Pass error to controller or render here?
             // Since controller re-renders dashboard, we need the active course data which is annoying to get here.
             // Simplest is to pass error to controller via query string or session, OR render error page.
             // Let's render a simple error view or redirect with error in session?
             // We don't have flash messages set up.
             // I'll render a generic error page effectively.
             return res.send(`<h2>Upload Error</h2><p>${err.message}</p><a href="/student/dashboard">Back</a>`);
        }
        next();
    });
};

router.post('/upload', uploadMiddleware, studentController.uploadAssignment);

module.exports = router;
