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
        await db.query('TRUNCATE TABLE Employees');
        await db.query('TRUNCATE TABLE Bays');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Insert Users (Admin & Customer)
        const [admin] = await db.query(`INSERT INTO Users (name, email, password, role, phone) VALUES ('Admin User', 'admin@shiftkey.com', ?, 'admin', '555-0101')`, [hashedPassword]);
        const [customer] = await db.query(`INSERT INTO Users (name, email, password, role, phone) VALUES ('John Doe', 'john@example.com', ?, 'customer', '555-0102')`, [hashedPassword]);
        const customerId = customer.insertId;

        // Insert Employees (Mechanics)
        const [mech1] = await db.query(`INSERT INTO Employees (name, role, email, phone) VALUES ('Mike Mechanic', 'mechanic', 'mike@shiftkey.com', '555-0201')`);
        const [mech2] = await db.query(`INSERT INTO Employees (name, role, email, phone) VALUES ('Sarah Fixit', 'mechanic', 'sarah@shiftkey.com', '555-0202')`);

        // Insert Bays
        await db.query(`INSERT INTO Bays (name, status) VALUES ('Bay 1', 'Available'), ('Bay 2', 'Available'), ('Bay 3', 'Maintenance')`);

        // Insert Services
        // Note: Image URLs are placeholders or local paths we will serve later
        const [svc1] = await db.query(`INSERT INTO Services (name, description, price, estimated_duration_minutes, image_url) VALUES ('Oil Change', 'Full synthetic oil change and filter replacement.', 59.99, 45, '/images/oil-change.jpg')`);
        const [svc2] = await db.query(`INSERT INTO Services (name, description, price, estimated_duration_minutes, image_url) VALUES ('Brake Inspection', 'Comprehensive brake system check and pad replacement.', 120.00, 90, '/images/brakes.jpg')`);
        const [svc3] = await db.query(`INSERT INTO Services (name, description, price, estimated_duration_minutes, image_url) VALUES ('Tire Change', 'Mount and balance new tires.', 25.00, 30, '/images/tires.jpg')`);
        const serviceId1 = svc1.insertId;

        // Insert Vehicles (for Registered User)
        const [vehicle] = await db.query(`INSERT INTO Vehicles (user_id, make, model, year, license_plate, vin) VALUES (?, 'Toyota', 'Camry', 2020, 'ABC-123', 'VIN123456789')`, [customerId]);
        const vehicleId = vehicle.insertId;

        // Insert Appointments
        const today = new Date().toISOString().slice(0, 10);
        
        // 1. Registered User Appointment (Pending)
        await db.query(`
            INSERT INTO Appointments 
            (user_id, vehicle_id, appointment_date, appointment_time, status, service_id) 
            VALUES (?, ?, ?, '10:00:00', 'Pending', ?)
        `, [customerId, vehicleId, today, serviceId1]);

        // 2. Guest Appointment (Confirmed)
        await db.query(`
            INSERT INTO Appointments 
            (guest_name, guest_email, guest_phone, vehicle_make, vehicle_model, vehicle_year, vehicle_license_plate, appointment_date, appointment_time, status, service_id) 
            VALUES ('Guest Alice', 'alice@guest.com', '555-9999', 'Honda', 'Civic', 2018, 'XYZ-987', ?, '14:00:00', 'Confirmed', ?)
        `, [today, serviceId1]);

        console.log('Database seeded successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
