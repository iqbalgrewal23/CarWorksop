const db = require('../config/db');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Services');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Services WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res) => {
    const { name, description, price, estimated_duration_minutes, image_url } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO Services (name, description, price, estimated_duration_minutes, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, estimated_duration_minutes, image_url]
        );
        res.status(201).json({ id: result.insertId, name, description, price, estimated_duration_minutes, image_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res) => {
    const { name, description, price, estimated_duration_minutes, image_url } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE Services SET name = ?, description = ?, price = ?, estimated_duration_minutes = ?, image_url = ? WHERE id = ?',
            [name, description, price, estimated_duration_minutes, image_url, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json({ id: req.params.id, name, description, price, estimated_duration_minutes, image_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Services WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json({ message: 'Service removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};
