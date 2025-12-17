const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/auth/login');
};

const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    // If logged in but not admin, maybe redirect to their own dashboard or 403
    if (req.session.user) {
        return res.redirect('/student/dashboard');
    }
    res.redirect('/auth/login');
};

const isStudent = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'student') {
        return next();
    }
    if (req.session.user) {
        return res.redirect('/admin/dashboard');
    }
    res.redirect('/auth/login');
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isStudent
};
