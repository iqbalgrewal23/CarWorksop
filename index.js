const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Apply essential middleware
app.use(cors({
    origin: '*', // Allow requests from any domain (like iqbalgrewal.com)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// Serve static files removed for Hostinger Native plan

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

// DB Test Endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const db = require('./config/db');
        const [rows] = await db.query('SHOW TABLES');

        res.status(200).json({
            status: 'success',
            message: 'Connected to database successfully!',
            tables: rows,
            envVars: {
                PORT: process.env.PORT,
                DB_HOST: process.env.DB_HOST,
                DB_USER: process.env.DB_USER,
                DB_NAME: process.env.DB_NAME,
                HAS_PASSWORD: !!process.env.DB_PASSWORD,
                HAS_JWT_SECRET: !!process.env.JWT_SECRET
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: {
                message: error.message,
                code: error.code,
                stack: error.stack
            },
            envVars: {
                PORT: process.env.PORT,
                DB_HOST: process.env.DB_HOST,
                DB_USER: process.env.DB_USER,
                DB_NAME: process.env.DB_NAME,
                HAS_PASSWORD: !!process.env.DB_PASSWORD,
                HAS_JWT_SECRET: !!process.env.JWT_SECRET
            }
        });
    }
});

// Base route
app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
