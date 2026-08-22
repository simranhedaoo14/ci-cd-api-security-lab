require('dotenv').config();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
}

module.exports = {
    jwtSecret: process.env.JWT_SECRET
};