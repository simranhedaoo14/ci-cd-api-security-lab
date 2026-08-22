const express = require('express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const resourceRoutes = require('./routes/resources');
const fetchRoutes = require('./routes/fetch');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', resourceRoutes);
app.use('/api', fetchRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'DevSecOps API Security Lab',
        status: 'running'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api'
    });
});

app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});