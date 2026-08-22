const express = require('express');
const jwt = require('jsonwebtoken');
const users = require('../data/users');

const router = express.Router();

const JWT_SECRET = 'devsecops-secret-key';

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(
        user => user.username === username && user.password === password
    );

    if (!user) {
        return res.status(401).json({
            error: 'Invalid credentials'
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET
    );

    res.json({
        message: 'Login successful',
        token
    });
});

module.exports = router;