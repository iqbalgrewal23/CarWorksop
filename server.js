const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Car Mechanic System API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
