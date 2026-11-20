
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    uploadInventoryImage,
} = require('../controllers/inventoryController');

const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');

const {
    getInventory,
    getInventoryStats,
    getInventoryAlerts,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
} = require('../controllers/inventoryController');

// All inventory routes require authentication.
router.use(requireAuth);

router.post(
    '/:id/image',
    requirePermission('Inventory Management', 'E'),
    upload.single('image'),
    uploadInventoryImage
);

// GET: Retrieve inventory products.
router.get(
    '/',
    requirePermission('Inventory Management', 'V'),
    getInventory
);

// GET: Retrieve inventory statistics.
router.get(
    '/stats',
    requirePermission('Inventory Management', 'V'),
    getInventoryStats
);

// GET: Retrieve low-stock and out-of-stock alerts.
router.get(
    '/alerts',
    requirePermission('Inventory Management', 'V'),
    getInventoryAlerts
);

// GET: Retrieve a specific inventory product.
router.get(
    '/:id',
    requirePermission('Inventory Management', 'V'),
    getInventoryItem
);

// POST: Create a new inventory product.
router.post(
    '/',
    requirePermission('Inventory Management', 'C'),
    createInventoryItem
);

// PATCH: Update an existing inventory product.
router.patch(
    '/:id',
    requirePermission('Inventory Management', 'E'),
    updateInventoryItem
);

// DELETE: Delete an inventory product.
router.delete(
    '/:id',
    requirePermission('Inventory Management', 'D'),
    deleteInventoryItem
);

module.exports = router;
