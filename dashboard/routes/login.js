const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const ADMIN_USERNAME = global.RentoBot.config.dashboard.username || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(global.RentoBot.config.dashboard.password || 'admin123', 10);

router.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        return res.redirect('/admin');
    }
    res.render('login', {
        title: 'Admin Login',
        error: req.query.error || null,
        success: req.query.success || null
    });
});

router.post('/', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.redirect('/login?error=Please provide username and password');
        }

        if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
            req.session.isAuthenticated = true;
            req.session.user = { username: ADMIN_USERNAME };
            return res.redirect('/admin');
        } else {
            return res.redirect('/login?error=Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/login?error=An error occurred during login');
    }
});

module.exports = router;
