const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        console.log('Seeding database...');

        // Disable FK checks to clear tables
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE Appointments');
        await db.query('TRUNCATE TABLE Vehicles');
        await db.query('TRUNCATE TABLE Users');
        await db.query('TRUNCATE TABLE Services');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Insert Users
        const [admin] = await db.query(`INSERT INTO Users (name, email, password, role) VALUES ('Admin User', 'admin@example.com', ?, 'admin')`, [hashedPassword]);
        const [customer] = await db.query(`INSERT INTO Users (name, email, password, role) VALUES ('John Doe', 'john@example.com', ?, 'customer')`, [hashedPassword]);
        const customerId = customer.insertId;

        // Insert Services
        const [svc1] = await db.query(`INSERT INTO Services (name, description, price, estimated_duration_minutes) VALUES ('Oil Change', 'Standard oil and filter change', 50.00, 30)`);
        const [svc2] = await db.query(`INSERT INTO Services (name, description, price, estimated_duration_minutes) VALUES ('Brake Inspection', 'Check pads and rotors', 80.00, 60)`);
        const serviceId1 = svc1.insertId;

        // Insert Vehicles
        const [vehicle] = await db.query(`INSERT INTO Vehicles (user_id, make, model, year, license_plate) VALUES (?, 'Toyota', 'Camry', 2020, 'ABC-123')`, [customerId]);
        const vehicleId = vehicle.insertId;

        // Insert Appointments
        const today = new Date().toISOString().slice(0, 10);
        // Using service_id instead of service_type
        await db.query(`INSERT INTO Appointments (user_id, vehicle_id, date, status, service_id, mechanic_notes) VALUES (?, ?, ?, 'Pending', ?, '')`, [customerId, vehicleId, today + ' 10:00:00', serviceId1]);

        console.log('Database seeded successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
