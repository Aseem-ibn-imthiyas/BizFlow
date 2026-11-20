
const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');

const {
    getSaleProducts,
    getSales,
    getSalesStats,
    getSale,
    createSale,
} = require('../controllers/salesController');

// All sales routes require authentication.
router.use(requireAuth);

// GET: Search inventory products for sales.
router.get(
    '/products',
    requirePermission('Sales Management', 'V'),
    getSaleProducts
);

// GET: Retrieve sales dashboard statistics.
router.get(
    '/stats',
    requirePermission('Sales Management', 'V'),
    getSalesStats
);

// GET: Retrieve all sales records.
router.get(
    '/',
    requirePermission('Sales Management', 'V'),
    getSales
);

// GET: Retrieve an individual sales record.
router.get(
    '/:id',
    requirePermission('Sales Management', 'V'),
    getSale
);

// POST: Create a new sale or save a draft.
router.post(
    '/',
    requirePermission('Sales Management', 'C'),
    createSale
);

module.exports = router;
