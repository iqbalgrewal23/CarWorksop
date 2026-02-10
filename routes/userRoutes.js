const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    addVehicle,
    bookAppointment,
    getAppointments
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/profile', getUserProfile);
router.post('/vehicles', addVehicle);
router.post('/appointments', bookAppointment);
router.get('/appointments', getAppointments);

module.exports = router;
