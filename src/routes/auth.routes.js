const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isStudent } = require('../middlewares/auth.middleware');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

// Student Password Change
router.get('/change-password', isStudent, authController.getChangePassword);
router.post('/change-password', isStudent, authController.postChangePassword);

module.exports = router;
