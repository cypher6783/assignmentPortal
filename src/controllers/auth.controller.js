const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.getLogin = (req, res) => {
    // If already logged in, redirect to respective dashboard
    if (req.session.user) {
        if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
        if (req.session.user.role === 'student') return res.redirect('/student/dashboard');
    }
    res.render('auth/login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Try Admin Login
        const adminQuery = 'SELECT * FROM admins WHERE username = $1';
        const adminResult = await db.query(adminQuery, [username]);

        if (adminResult.rows.length > 0) {
            const admin = adminResult.rows[0];
            const match = await bcrypt.compare(password, admin.password_hash);
            if (match) {
                req.session.user = { id: admin.id, username: admin.username, role: 'admin' };
                return res.redirect('/admin/dashboard');
            }
        }

        // 2. Try Student Login
        const studentQuery = 'SELECT * FROM students WHERE matric_number = $1';
        const studentResult = await db.query(studentQuery, [username]);

        if (studentResult.rows.length > 0) {
            const student = studentResult.rows[0];
            // Access control check
            if (!student.active) {
                return res.render('auth/login', { error: 'Account is deactivated. Contact admin.' });
            }

            const match = await bcrypt.compare(password, student.password_hash);
            if (match) {
                req.session.user = { id: student.id, name: student.name, matric_number: student.matric_number, role: 'student' };
                return res.redirect('/student/dashboard');
            }
        }

        // If we get here, authentication failed
        res.render('auth/login', { error: 'Invalid credentials' });

    } catch (err) {
        console.error('Login error:', err);
        res.render('auth/login', { error: 'An unexpected error occurred' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/auth/login');
    });
};

exports.getChangePassword = (req, res) => {
    res.render('auth/change-password', { error: null, success: null });
};

exports.postChangePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    if (!newPassword || newPassword.length < 4) {
         return res.render('auth/change-password', { error: 'Password must be at least 4 characters', success: null });
    }

    try {
        // Fetch current student data
        const query = 'SELECT * FROM students WHERE id = $1';
        const result = await db.query(query, [userId]);
        const student = result.rows[0];

        const match = await bcrypt.compare(currentPassword, student.password_hash);
        if (!match) {
            return res.render('auth/change-password', { error: 'Incorrect current password', success: null });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE students SET password_hash = $1 WHERE id = $2', [newHash, userId]);

        res.render('auth/change-password', { error: null, success: 'Password changed successfully' });

    } catch (err) {
        console.error('Password change error:', err);
        res.render('auth/change-password', { error: 'Server error', success: null });
    }
};
