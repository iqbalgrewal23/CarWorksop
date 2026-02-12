const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let customerToken = '';
let adminToken = ''; // We'll login as admin seeded in seed.js
let serviceId = '';

async function runVerification() {
    try {
        console.log('--- Starting Redesign Verification ---');

        // 1. Initial Health Check (Load Public Services)
        console.log('1. Fetching Public Services...');
        const servicesRes = await axios.get(`${API_URL}/services`);
        if (servicesRes.data.length > 0) {
            serviceId = servicesRes.data[0].id;
            console.log(`   Success! Found ${servicesRes.data.length} services. Using Service ID: ${serviceId}`);
        } else {
            throw new Error('No services found. Seed data missing?');
        }

        // 2. Guest Booking
        console.log('2. Testing Guest Booking...');
        const guestBooking = {
            guest_name: 'Guest Tom',
            guest_email: 'tom@guest.com',
            guest_phone: '555-1111',
            vehicle_make: 'Ford',
            vehicle_model: 'Focus',
            vehicle_year: 2015,
            vehicle_license_plate: 'GST-888',
            service_id: serviceId,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            time: '14:00'
        };
        const guestRes = await axios.post(`${API_URL}/bookings`, guestBooking);
        console.log('   Success! Guest Appointment ID:', guestRes.data.appointmentId);

        // 3. Register New User
        console.log('3. Registering New User...');
        const userEmail = `newuser${Date.now()}@test.com`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'New User',
            email: userEmail,
            phone: '555-2222',
            password: 'password123'
        });
        customerToken = regRes.data.token;
        const userId = regRes.data._id;
        console.log('   Success! User ID:', userId);

        // 4. User Booking (New Vehicle)
        console.log('4. Testing User Booking (New Vehicle)...');
        const userBooking = {
            user_id: userId, // Optional if token passed, but booking controller checks body or req.user. 
            // NOTE: Our booking controller takes user_id from body if provided, or we should rely on middleware.
            // Let's pass it in body for now as per controller logic.
            vehicle_make: 'Honda',
            vehicle_model: 'Civic',
            vehicle_year: 2022,
            vehicle_license_plate: 'USR-999',
            service_id: serviceId,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            time: '15:00'
            // vehicle_id is null, so it should add details to appointment or create vehicle? 
            // Controller logic: inserts vehicle details into appointment if vehicle_id is null.
        };
        // We need auth header? Controller says "Public (Handles Guest & User)". 
        // If we want it linked to user, we pass user_id.
        const userBookRes = await axios.post(`${API_URL}/bookings`, userBooking);
        console.log('   Success! User Appointment ID:', userBookRes.data.appointmentId);

        // 5. Admin Login & Verification
        console.log('5. logging in as Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@shiftkey.com', // From seed.js
            password: 'password123'
        });
        adminToken = adminLogin.data.token;
        console.log('   Success! Admin Token received.');

        // 6. Admin Stats
        console.log('6. Fetching Admin Stats...');
        const statsRes = await axios.get(`${API_URL}/admin/dashboard-stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('   Success! Stats:', statsRes.data);

        // 7. Admin Update Appointment (Allocate Bay)
        console.log('7. Allocating Bay to Guest Appointment...');
        const appId = guestRes.data.appointmentId;
        // Get bays to find one
        const baysRes = await axios.get(`${API_URL}/admin/bays`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const bayId = baysRes.data[0].id; // Bay 1

        await axios.patch(`${API_URL}/admin/appointments/${appId}`, {
            status: 'Confirmed',
            bay_id: bayId,
            mechanic_notes: 'Verified by script'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('   Success! Appointment Updated.');

        console.log('--- Verification Complete: SUCCESS ---');

    } catch (error) {
        console.error('--- Verification Failed ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

runVerification();
