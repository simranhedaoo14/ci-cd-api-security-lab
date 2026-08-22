const express = require('express');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin access required'
        });
    }

    res.json({
        message: 'Welcome to the admin dashboard',
        secret: 'Admin-only information'
    });
});

module.exports = router;