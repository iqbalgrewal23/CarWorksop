const db = require('../config/db');

// GET /api/admin/dashboard-stats
// Returns counts of 'Pending', 'Confirmed', 'In-Progress', 'Completed' appointments for the day.
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const query = `
            SELECT status, COUNT(*) as count 
            FROM Appointments 
            WHERE appointment_date = ? 
            GROUP BY status
        `;
        const [rows] = await db.query(query, [today]);

        const stats = {
            Pending: 0,
            Confirmed: 0,
            'In-Progress': 0,
            Completed: 0,
            Cancelled: 0
        };

        rows.forEach(row => {
            if (stats[row.status] !== undefined) {
                stats[row.status] = row.count;
            }
        });

        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/admin/appointments
// Returns a list of all upcoming appointments including customer and vehicle details (both registered and guest).
const getAppointments = async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id, a.appointment_date, a.appointment_time, a.status, a.mechanic_notes,
                a.bay_id, a.mechanic_id,
                b.name as bay_name, e.name as mechanic_name,
                s.name as service_name,
                COALESCE(u.name, a.guest_name) as customer_name,
                COALESCE(u.email, a.guest_email) as customer_email,
                COALESCE(u.phone, a.guest_phone) as customer_phone,
                COALESCE(v.make, a.vehicle_make) as vehicle_make,
                COALESCE(v.model, a.vehicle_model) as vehicle_model,
                COALESCE(v.year, a.vehicle_year) as vehicle_year,
                COALESCE(v.license_plate, a.vehicle_license_plate) as vehicle_license_plate
            FROM Appointments a
            LEFT JOIN Users u ON a.user_id = u.id
            LEFT JOIN Vehicles v ON a.vehicle_id = v.id
            LEFT JOIN Services s ON a.service_id = s.id
            LEFT JOIN Bays b ON a.bay_id = b.id
            LEFT JOIN Employees e ON a.mechanic_id = e.id
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
        `;
        const [rows] = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// PATCH /api/admin/appointments/:id
// Allows the admin to confirm booking, allocate bay/employee, update status.
const updateAppointment = async (req, res) => {
    const { id } = req.params;
    // Admin can update status, mechanic_notes, bay_id, mechanic_id
    const { status, mechanic_notes, bay_id, mechanic_id } = req.body;

    try {
        // Construct dynamic update query
        let fields = [];
        let params = [];

        if (status) { fields.push('status = ?'); params.push(status); }
        if (mechanic_notes !== undefined) { fields.push('mechanic_notes = ?'); params.push(mechanic_notes); }
        if (bay_id !== undefined) { fields.push('bay_id = ?'); params.push(bay_id); }
        if (mechanic_id !== undefined) { fields.push('mechanic_id = ?'); params.push(mechanic_id); }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        params.push(id);

        const query = `UPDATE Appointments SET ${fields.join(', ')} WHERE id = ?`;
        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // If bay allocated, mark bay occupied? Maybe later. For now just track in appointment.

        res.status(200).json({ message: 'Appointment updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/admin/customers
// Returns a list of all registered users and their vehicle history.
const getCustomers = async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, name, email, role, phone FROM Users WHERE role = 'customer'");

        const customersWithDetails = await Promise.all(users.map(async (user) => {
            const [vehicles] = await db.query("SELECT * FROM Vehicles WHERE user_id = ?", [user.id]);

            const [history] = await db.query(`
                SELECT a.*, s.name as service_name
                FROM Appointments a 
                LEFT JOIN Services s ON a.service_id = s.id
                WHERE a.user_id = ?
                ORDER BY a.appointment_date DESC
            `, [user.id]);

            return {
                ...user,
                vehicles,
                history
            };
        }));

        res.status(200).json(customersWithDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/admin/employees
const getEmployees = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM Employees");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/admin/bays
const getBays = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM Bays");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getDashboardStats,
    getAppointments,
    updateAppointment,
    getCustomers,
    getEmployees,
    getBays
};
