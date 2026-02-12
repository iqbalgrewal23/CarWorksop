const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const {
    getDashboardStats,
    getAppointments,
    updateAppointment,
    getCustomers,
    getEmployees,
    getBays
} = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(verifyToken, isAdmin);

router.get('/dashboard-stats', getDashboardStats);
router.get('/appointments', getAppointments);
router.patch('/appointments/:id', updateAppointment);
router.get('/customers', getCustomers);
router.get('/employees', getEmployees);
router.get('/bays', getBays);

module.exports = router;
