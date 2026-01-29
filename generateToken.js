const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const token = jwt.sign({ id: 1, role: 'admin', email: 'admin@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log(token);
