const db = require('../config/db');

// GET /api/admin/dashboard-stats
// Returns counts of 'Pending', 'In-Progress', and 'Completed' appointments for the day.
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const query = `
            SELECT status, COUNT(*) as count 
            FROM Appointments 
            WHERE DATE(date) = ? 
            GROUP BY status
        `;
        const [rows] = await db.query(query, [today]);

        const stats = {
            Pending: 0,
            'In-Progress': 0,
            Completed: 0
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
// Returns a list of all upcoming appointments including customer names and vehicle details.
const getAppointments = async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id, a.date, a.status, a.service_type, a.mechanic_notes,
                u.name as customer_name, u.email as customer_email,
                v.make, v.model, v.year, v.license_plate
            FROM Appointments a
            JOIN Users u ON a.user_id = u.id
            JOIN Vehicles v ON a.vehicle_id = v.id
            WHERE a.date >= NOW()
            ORDER BY a.date ASC
        `;
        const [rows] = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// PATCH /api/admin/appointments/:id
// Allows the admin to update the status of a repair and add "Mechanic Notes."
const updateAppointment = async (req, res) => {
    const { id } = req.params;
    const { status, mechanic_notes } = req.body;

    try {
        const query = `
            UPDATE Appointments 
            SET status = ?, mechanic_notes = ? 
            WHERE id = ?
        `;
        const [result] = await db.query(query, [status, mechanic_notes, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

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
        // Fetch users
        const [users] = await db.query("SELECT id, name, email, role FROM Users WHERE role = 'customer'");

        // For each user, fetch their vehicles and appointments history
        // Note: In a real large-scale app, we might want to paginate or use more complex joins/aggregation.
        // For this requirement, we will fetch vehicles and attach them.

        const customersWithDetails = await Promise.all(users.map(async (user) => {
            const [vehicles] = await db.query("SELECT * FROM Vehicles WHERE user_id = ?", [user.id]);

            // Get appointment history for this user
            const [history] = await db.query(`
                SELECT a.*, v.make, v.model 
                FROM Appointments a 
                JOIN Vehicles v ON a.vehicle_id = v.id 
                WHERE a.user_id = ?
                ORDER BY a.date DESC
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

module.exports = {
    getDashboardStats,
    getAppointments,
    updateAppointment,
    getCustomers
};
