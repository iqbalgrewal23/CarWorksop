const db = require('../config/db');

// @desc    Get available time slots for a specific date
// @route   GET /api/bookings/slots?date=YYYY-MM-DD
// @access  Public
const getAvailableSlots = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    try {
        // 1. Get total capacity (Total Bays)
        const [bays] = await db.query('SELECT COUNT(*) as count FROM Bays WHERE status != "Maintenance"');
        const totalBays = bays[0].count;

        // 2. Define operational hours (e.g., 9:00 to 17:00, hourly slots)
        const possibleSlots = [
            '09:00:00', '10:00:00', '11:00:00', '12:00:00',
            '13:00:00', '14:00:00', '15:00:00', '16:00:00'
        ];

        // 3. Get existing appointments count per slot for the date
        const [existing] = await db.query(`
            SELECT appointment_time, COUNT(*) as count 
            FROM Appointments 
            WHERE appointment_date = ? AND status != 'Cancelled'
            GROUP BY appointment_time
        `, [date]);

        // Map existing counts to slots
        const slotCounts = {};
        existing.forEach(row => {
            slotCounts[row.appointment_time] = row.count;
        });

        // 4. Determine availability
        const availableSlots = possibleSlots.map(time => {
            const booked = slotCounts[time] || 0;
            return {
                time: time.substring(0, 5), // '09:00'
                available: booked < totalBays,
                booked,
                capacity: totalBays
            };
        });

        res.json(availableSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new appointment
// @route   POST /api/bookings
// @access  Public (Handles Guest & User)
const createAppointment = async (req, res) => {
    const {
        user_id, // Optional, from frontend if logged in (or middleware attaches req.user)
        vehicle_id, // Optional, if selecting existing vehicle

        // Guest Details
        guest_name, guest_email, guest_phone,

        // Vehicle Details (if new/guest)
        vehicle_make, vehicle_model, vehicle_year, vehicle_license_plate, vin,

        service_id,
        date, // YYYY-MM-DD
        time // HH:MM
    } = req.body;

    try {
        // Validate basics
        if (!service_id || !date || !time) {
            return res.status(400).json({ message: 'Service, Date, and Time are required' });
        }

        // Validate vehicle info
        if (!vehicle_id && (!vehicle_make || !vehicle_model || !vehicle_license_plate)) {
            // actually license_plate is key
            // let's be loose but check license plate if vehicle_id not present
        }

        // Check availability again (race condition check, strictness depends on reqs)
        const [bays] = await db.query('SELECT COUNT(*) as count FROM Bays WHERE status != "Maintenance"');
        const totalBays = bays[0].count;

        const [existing] = await db.query(`
            SELECT COUNT(*) as count 
            FROM Appointments 
            WHERE appointment_date = ? AND appointment_time = ? AND status != 'Cancelled'
        `, [date, time]);

        if (existing[0].count >= totalBays) {
            return res.status(400).json({ message: 'Selected slot is no longer available' });
        }

        // Construct Query
        let query = `
            INSERT INTO Appointments 
            (user_id, vehicle_id, guest_name, guest_email, guest_phone, 
             vehicle_make, vehicle_model, vehicle_year, vehicle_license_plate, 
             service_id, appointment_date, appointment_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;

        const params = [
            user_id || null,
            vehicle_id || null,
            guest_name || null,
            guest_email || null,
            guest_phone || null,
            vehicle_make || null,
            vehicle_model || null,
            vehicle_year || null,
            vehicle_license_plate || null,
            service_id,
            date,
            time
        ];

        const [result] = await db.query(query, params);

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointmentId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAvailableSlots,
    createAppointment
};
