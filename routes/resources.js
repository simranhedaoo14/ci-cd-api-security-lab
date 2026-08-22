const express = require('express');
const authenticateToken = require('../middleware/auth');
const users = require('../data/users');

const router = express.Router();

router.get('/users/:id', authenticateToken, (req, res) => {
    const requestedUserId = Number(req.params.id);

    const user = users.find(u => u.id === requestedUserId);

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    // Server-side object-level authorization
    if (req.user.id !== requestedUserId) {
        return res.status(403).json({
            error: 'You are not authorized to access this resource'
        });
    }

    res.json({
        id: user.id,
        username: user.username,
        role: user.role
    });
});

module.exports = router;