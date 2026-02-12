const API_URL = '/api';

// --- Auth Utilities ---

function setToken(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

function checkAuth(role = null) {
    const token = getToken();
    const user = getUser();

    // Update Nav
    const authLink = document.getElementById('authLink');
    if (authLink) {
        if (user) {
            authLink.textContent = `My Account (${user.name})`;
            authLink.href = user.role === 'admin' ? '/admin.html' : '/dashboard.html';
        } else {
            authLink.textContent = 'Login / Register';
            authLink.href = 'login.html';
        }
    }

    // Role Guard
    if (role) {
        if (!token || !user) {
            window.location.href = '/login.html';
            return;
        }
        if (user.role !== role) {
            alert('Access denied');
            window.location.href = '/';
        }
    }

    // Dashboard Greeting
    const greeting = document.getElementById('user-greeting');
    if (greeting && user) {
        greeting.textContent = `Welcome, ${user.name}`;
    }
}

// --- API Helper ---
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
}

// --- Public: Home Page Logic ---

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    const select = document.getElementById('serviceSelect');
    if (!grid && !select) return;

    try {
        const services = await fetchAPI('/services');

        // Populate Grid
        if (grid) {
            grid.innerHTML = services.map(s => `
                <div class="service-card">
                    <div class="service-img" style="background-image: url('${s.image_url || '/images/default-service.jpg'}')"></div>
                    <div class="service-info">
                        <h3>${s.name}</h3>
                        <span class="price">$${s.price}</span>
                        <p>${s.description}</p>
                        <p><small><i class="fas fa-clock"></i> ${s.estimated_duration_minutes} mins</small></p>
                        <button class="btn-primary" onclick="openBookingModal(${s.id})">Book This</button>
                    </div>
                </div>
            `).join('');
        }

        // Populate Select
        if (select) {
            select.innerHTML = '<option value="">-- Select --</option>' +
                services.map(s => `<option value="${s.id}">${s.name} ($${s.price})</option>`).join('');
        }
    } catch (err) {
        console.error('Failed to load services', err);
    }
}

// --- Booking Wizard ---

let currentStep = 1;
let bookingData = {};

function openBookingModal(serviceId = null) {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('active');
        currentStep = 1;
        updateWizardUI();

        if (serviceId) {
            const select = document.getElementById('serviceSelect');
            if (select) {
                select.value = serviceId;
                enableStep1Next();
            }
        }

        // Check if user is logged in to toggle vehicle section
        const user = getUser();
        const userVehicleSection = document.getElementById('userVehicleSection');
        const newVehicleForm = document.getElementById('newVehicleForm'); // We might want to show this anyway for "Add New"
        const guestInfoSection = document.getElementById('guestInfoSection');

        if (user) {
            if (userVehicleSection) {
                userVehicleSection.classList.remove('hidden');
                loadUserVehicles(); // Fetch vehicles for select
            }
            if (guestInfoSection) guestInfoSection.classList.add('hidden');
        } else {
            if (userVehicleSection) userVehicleSection.classList.add('hidden');
            if (guestInfoSection) guestInfoSection.classList.remove('hidden');
        }
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('active');
}

function goToStep(step) {
    currentStep = step;
    updateWizardUI();
}

function updateWizardUI() {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${currentStep}`).classList.add('active');
}

function enableStep1Next() {
    const val = document.getElementById('serviceSelect').value;
    document.getElementById('btnStep1').disabled = !val;
    bookingData.service_id = val;
}

async function loadUserVehicles() {
    // This assumes we implement the customer profile endpoint or similar
    // For now we might not have it strictly, but let's assume we do or fix backend.
    // userController has getUserProfile which returns vehicles.
    try {
        const profile = await fetchAPI('/users/profile');
        const select = document.getElementById('savedVehicleSelect');
        if (select) {
            select.innerHTML = '<option value="new">-- Add New Vehicle --</option>' +
                profile.vehicles.map(v => `<option value="${v.id}">${v.year} ${v.make} ${v.model} (${v.license_plate})</option>`).join('');

            select.onchange = (e) => {
                const isNew = e.target.value === 'new';
                const form = document.getElementById('newVehicleForm');
                // Hide make/model inputs if existing vehicle selected? 
                // Actually the design implementation plan kept it simple. 
                // Let's just toggle visibility of inputs
                Array.from(form.querySelectorAll('input:not(#guestName):not(#guestEmail):not(#guestPhone)')).forEach(inp => {
                    inp.disabled = !isNew;
                    if (!isNew) inp.value = '';
                });
            };
        }
    } catch (e) {
        console.error(e);
    }
}

async function fetchSlots() {
    const dateInput = document.getElementById('appointmentDate');
    const date = dateInput.value;
    const grid = document.getElementById('slotGrid');

    if (!date) return;

    grid.innerHTML = '<p>Loading...</p>';

    try {
        const slots = await fetchAPI(`/bookings/slots?date=${date}`);
        grid.innerHTML = slots.map(slot => `
            <div class="time-slot ${slot.available ? 'available' : 'disabled'}" 
                 onclick="${slot.available ? `selectSlot('${slot.time}')` : ''}"
                 id="slot-${slot.time}">
                ${slot.time}
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p class="text-danger">Error loading slots</p>';
    }
}

function selectSlot(time) {
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById(`slot-${time}`).classList.add('selected');
    document.getElementById('selectedTime').value = time;
    document.getElementById('btnBook').disabled = false;
    bookingData.time = time + ':00'; // Append seconds for backend
}

async function submitBooking() {
    const user = getUser();

    // Collect Data
    const payload = {
        service_id: bookingData.service_id,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('selectedTime').value,
        user_id: user ? user._id : null
    };

    const savedVehicleSelect = document.getElementById('savedVehicleSelect');
    if (savedVehicleSelect && savedVehicleSelect.value !== 'new' && user) {
        payload.vehicle_id = savedVehicleSelect.value;
    } else {
        payload.vehicle_make = document.getElementById('vehicleMake').value;
        payload.vehicle_model = document.getElementById('vehicleModel').value;
        payload.vehicle_year = document.getElementById('vehicleYear').value;
        payload.vehicle_license_plate = document.getElementById('vehiclePlate').value;
    }

    if (!user) {
        payload.guest_name = document.getElementById('guestName').value;
        payload.guest_email = document.getElementById('guestEmail').value;
        payload.guest_phone = document.getElementById('guestPhone').value;
    }

    try {
        const res = await fetchAPI('/bookings', 'POST', payload);
        bookingData = {}; // Clear
        goToStep(4);
        document.getElementById('bookingDetails').innerText = `ID: ${res.appointmentId}`;
    } catch (e) {
        alert(e.message);
    }
}

// --- Login / Register Pages ---

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const data = await fetchAPI('/auth/login', 'POST', { email, password });
        setToken(data.token, data);
        if (data.role === 'admin') window.location.href = '/admin.html';
        else window.location.href = '/dashboard.html';
    } catch (err) {
        alert(err.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    try {
        const data = await fetchAPI('/auth/register', 'POST', { name, email, phone, password });
        setToken(data.token, data);
        window.location.href = '/dashboard.html';
    } catch (err) {
        alert(err.message);
    }
}


// --- Admin Logic (Simplified for brevity but should match new UI) ---
async function loadAdminDashboard() {
    try {
        const stats = await fetchAPI('/admin/dashboard-stats');
        // Update DOM elements matching new admin.html structure
        // ... (Will implement when writing admin.html)
    } catch (e) { console.error(e); }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadServices();

    // Login Page bindings
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
});
