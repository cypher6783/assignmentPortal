const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { isAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' }); // Temp storage for CSVs

// Apply isAdmin guard to all routes
router.use(isAdmin);

router.get('/dashboard', adminController.getDashboard);
router.post('/courses', adminController.createCourse);
router.post('/courses/:id/toggle', adminController.toggleCourseStatus);

router.get('/courses/:id', adminController.getCourseDetails);
router.get('/courses/:courseId/download', adminController.downloadSubmissions);

router.post('/students/upload', upload.single('file'), adminController.uploadStudents);
router.post('/students/delete', adminController.deleteStudent);

module.exports = router;
