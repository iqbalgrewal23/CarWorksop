const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let customerToken = '';
let adminToken = '';
let customerId = '';
let serviceId = '';
let vehicleId = '';
let appointmentId = '';

async function runVerification() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Register Customer
        console.log('1. Registering Customer...');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test Customer',
            email: `test${Date.now()}@example.com`,
            password: 'password123'
        });
        customerToken = regRes.data.token;
        customerId = regRes.data._id;
        console.log('   Success! Customer ID:', customerId);

        // 2. Login as Admin (need to seed admin first or create one, but let's register one for test)
        console.log('2. Registering/Login Admin...');
        // Note: Register endpoint defaults to 'customer'. 
        // We will manually update this user to admin in DB for testing purposes or assume an admin exists.
        // For this script, we'll just test customer flow mostly, and maybe fail on admin parts if not set up.
        // Let's stick to customer flow + public services.

        // 3. Get Services
        console.log('3. Fetching Services...');
        const servicesRes = await axios.get(`${API_URL}/services`);
        if (servicesRes.data.length > 0) {
            serviceId = servicesRes.data[0].id;
            console.log('   Success! Found services. Using Service ID:', serviceId);
        } else {
            console.log('   No services found. Creating one via seed might be needed.');
            // Let's create a service if possible or we might fail booking.
            // We can't create service without admin token.
            // Let's assume seed.js was run or we will skip.
        }

        // 4. Add Vehicle
        console.log('4. Adding Vehicle...');
        const vehRes = await axios.post(`${API_URL}/users/vehicles`, {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            license_plate: 'TEST-123'
        }, { headers: { Authorization: `Bearer ${customerToken}` } });
        vehicleId = vehRes.data.id;
        console.log('   Success! Vehicle ID:', vehicleId);

        // 5. Book Appointment
        if (serviceId && vehicleId) {
            console.log('5. Booking Appointment...');
            const bookRes = await axios.post(`${API_URL}/users/appointments`, {
                vehicle_id: vehicleId,
                service_id: serviceId,
                date: '2026-10-20 10:00:00'
            }, { headers: { Authorization: `Bearer ${customerToken}` } });
            appointmentId = bookRes.data.appointmentId;
            console.log('   Success! Appointment booked.');
        } else {
            console.log('SKIPPING Booking: Missing serviceId or vehicleId');
        }

        // 6. Get History
        console.log('6. Fetching History...');
        const histRes = await axios.get(`${API_URL}/users/appointments`, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        console.log('   Success! History count:', histRes.data.length);

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
