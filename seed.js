const db = require('./config/db');
// bcryptjs removed as it is not needed for this seed script 
// Wait, I didn't install bcryptjs in the plan. I'll just insert plain text for now or mock the login.
// Actually, I need to generate a token for testing. I'll create a helper script to generate a token.

const seed = async () => {
    try {
        // Clear existing data
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE Appointments');
        await db.query('TRUNCATE TABLE Vehicles');
        await db.query('TRUNCATE TABLE Users');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        // Insert Users
        const [admin] = await db.query(`INSERT INTO Users (name, email, password, role) VALUES ('Admin User', 'admin@example.com', 'password123', 'admin')`);
        const [customer] = await db.query(`INSERT INTO Users (name, email, password, role) VALUES ('John Doe', 'john@example.com', 'password123', 'customer')`);

        const adminId = admin.insertId;
        const customerId = customer.insertId;

        // Insert Vehicles
        const [vehicle] = await db.query(`INSERT INTO Vehicles (user_id, make, model, year, license_plate) VALUES (?, 'Toyota', 'Camry', 2020, 'ABC-123')`, [customerId]);
        const vehicleId = vehicle.insertId;

        // Insert Appointments
        const today = new Date().toISOString().slice(0, 10);
        await db.query(`INSERT INTO Appointments (user_id, vehicle_id, date, status, service_type, mechanic_notes) VALUES (?, ?, ?, 'Pending', 'Oil Change', '')`, [customerId, vehicleId, today + ' 10:00:00']);
        await db.query(`INSERT INTO Appointments (user_id, vehicle_id, date, status, service_type, mechanic_notes) VALUES (?, ?, ?, 'In-Progress', 'Brake Check', 'Checking pads')`, [customerId, vehicleId, today + ' 12:00:00']);

        console.log('Database seeded successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
