const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');

const {
    getNotifications,
    getNotificationStats,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    archiveNotification,
    archiveSelectedNotifications,
} = require('../controllers/notificationController');

// All notification routes require authentication.
router.use(requireAuth);

// ------------------------------------------------------
// NOTIFICATION ROUTES
// ------------------------------------------------------

// Retrieve notification statistics.
router.get(
    '/stats',
    requirePermission('Notifications', 'V'),
    getNotificationStats
);

// Retrieve notifications with search and filters.
router.get(
    '/',
    requirePermission('Notifications', 'V'),
    getNotifications
);

// Mark all notifications as read.
router.patch(
    '/read-all',
    requirePermission('Notifications', 'E'),
    markAllNotificationsAsRead
);

// Archive selected notifications.
router.patch(
    '/archive-selected',
    requirePermission('Notifications', 'A'),
    archiveSelectedNotifications
);

// Mark a specific notification as read.
router.patch(
    '/:id/read',
    requirePermission('Notifications', 'E'),
    markNotificationAsRead
);

// Archive a specific notification.
router.patch(
    '/:id/archive',
    requirePermission('Notifications', 'A'),
    archiveNotification
);

module.exports = router;