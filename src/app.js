const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./config/db");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Step 1: Enforce Correct Middleware Order
app.use(cookieParser());

// Step 2: Verify Session Persistence
app.use(
  session({
    secret: "assignment_portal_fixed_secret_key_12345", // Fixed secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Localhost
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Step 8: Debug Deterministically (Moved before CSRF to log request details)
app.use((req, res, next) => {
    console.log('--- DEBUG CSRF ---');
    console.log('Session ID:', req.sessionID);
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    if (req.method === 'POST') {
        console.log('Body Token:', req.body._csrf);
        // console.log('Cookies:', req.cookies); // Optional: verify cookies
    }
    next();
});

const csurf = require('csurf');
// Step 4: CSRF
app.use(csurf());

// Step 7: Regenerate Token Per Request
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Routes Placeholder
app.get("/", (req, res) => {
  res.redirect("/auth/login");
});

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const studentRoutes = require('./routes/student.routes');

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
