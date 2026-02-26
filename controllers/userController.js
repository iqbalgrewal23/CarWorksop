const db = require('../config/db');

// @desc    Get user profile with vehicles
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role FROM Users WHERE id = ?', [req.user.id]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [vehicles] = await db.query('SELECT * FROM Vehicles WHERE user_id = ?', [req.user.id]);

        res.json({ ...user, vehicles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a vehicle
// @route   POST /api/users/vehicles
// @access  Private
const addVehicle = async (req, res) => {
    const { make, model, year, license_plate, vin } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO Vehicles (user_id, make, model, year, license_plate, vin) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, make, model, year, license_plate, vin]
        );
        res.status(201).json({ id: result.insertId, user_id: req.user.id, make, model, year, license_plate, vin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Book an appointment
// @route   POST /api/users/appointments
// @access  Private
const bookAppointment = async (req, res) => {
    const { vehicle_id, service_id, date } = req.body;

    try {
        // Verify vehicle belongs to user
        const [vehicles] = await db.query('SELECT * FROM Vehicles WHERE id = ? AND user_id = ?', [vehicle_id, req.user.id]);
        if (vehicles.length === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        let appointment_date = date;
        let appointment_time = '00:00:00';

        if (date && date.includes(' ')) {
            const parts = date.split(' ');
            appointment_date = parts[0];
            appointment_time = parts[1];
        }

        // Setup appointment
        const [result] = await db.query(
            'INSERT INTO Appointments (user_id, vehicle_id, service_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, vehicle_id, service_id, appointment_date, appointment_time, 'Pending']
        );

        res.status(201).json({ message: 'Appointment booked successfully', appointmentId: result.insertId });
    } catch (error) {
        console.error("Error in bookAppointment:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user appointment history
// @route   GET /api/users/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        const query = `
            SELECT a.*, s.name as service_name, v.make, v.model, v.license_plate
            FROM Appointments a
            JOIN Services s ON a.service_id = s.id
            JOIN Vehicles v ON a.vehicle_id = v.id
            WHERE a.user_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `;
        const [rows] = await db.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getUserProfile,
    addVehicle,
    bookAppointment,
    getAppointments
};
