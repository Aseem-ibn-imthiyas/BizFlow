const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');

const {
    getAnalyticsOverview,
} = require('../controllers/analyticsController');

// All analytics routes require authentication.
router.use(requireAuth);

// GET: Retrieve real-time business analytics.
router.get(
    '/',
    requirePermission('Analytics', 'V'),
    getAnalyticsOverview
);

module.exports = router;