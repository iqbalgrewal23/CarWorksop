const express = require('express');
const router = express.Router();
const {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService
} = require('../controllers/serviceController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Service Management Routes
// Handles CRUD operations for public and admin services

router.route('/')
    .get(getServices)
    .post(verifyToken, isAdmin, createService);

router.route('/:id')
    .get(getServiceById)
    .put(verifyToken, isAdmin, updateService)
    .delete(verifyToken, isAdmin, deleteService);

module.exports = router;
