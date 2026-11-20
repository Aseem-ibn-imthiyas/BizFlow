const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// ------------------------------------------------------
// GET NOTIFICATIONS
// ------------------------------------------------------

const getNotifications = async (req, res) => {
    try {
        const {
            search = '',
            type = 'All',
            priority = 'All',
            status = 'All',
            archived = 'false',
        } = req.query;

        const filter = {
            user: req.user._id,
            isArchived: archived === 'true',
        };

        if (type !== 'All') {
            filter.type = type;
        }

        if (priority !== 'All') {
            filter.priority = priority;
        }

        if (status === 'Unread') {
            filter.isRead = false;
        } else if (status === 'Read') {
            filter.isRead = true;
        }

        if (search.trim()) {
            filter.$or = [
                {
                    title: {
                        $regex: search.trim(),
                        $options: 'i',
                    },
                },
                {
                    description: {
                        $regex: search.trim(),
                        $options: 'i',
                    },
                },
            ];
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications,
        });
    } catch (error) {
        console.error('Get notifications error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications.',
        });
    }
};

// ------------------------------------------------------
// GET NOTIFICATION STATISTICS
// ------------------------------------------------------

const getNotificationStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const [
            totalNotifications,
            unreadNotifications,
            highPriorityNotifications,
            archivedNotifications,
        ] = await Promise.all([
            Notification.countDocuments({
                user: userId,
                isArchived: false,
            }),

            Notification.countDocuments({
                user: userId,
                isArchived: false,
                isRead: false,
            }),

            Notification.countDocuments({
                user: userId,
                isArchived: false,
                priority: 'High',
            }),

            Notification.countDocuments({
                user: userId,
                isArchived: true,
            }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalNotifications,
                unreadNotifications,
                highPriorityNotifications,
                archivedNotifications,
            },
        });
    } catch (error) {
        console.error('Notification statistics error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification statistics.',
        });
    }
};

// ------------------------------------------------------
// MARK SINGLE NOTIFICATION AS READ
// ------------------------------------------------------

const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id,
                isArchived: false,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read.',
            data: notification,
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update notification.',
        });
    }
};

// ------------------------------------------------------
// MARK ALL NOTIFICATIONS AS READ
// ------------------------------------------------------

const markAllNotificationsAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                user: req.user._id,
                isArchived: false,
                isRead: false,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read.',
            data: {
                modifiedCount: result.modifiedCount,
            },
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update notifications.',
        });
    }
};

// ------------------------------------------------------
// ARCHIVE SINGLE NOTIFICATION
// ------------------------------------------------------

const archiveNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id,
                isArchived: false,
            },
            {
                $set: {
                    isArchived: true,
                    archivedAt: new Date(),
                },
            },
            {
                new: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification archived successfully.',
            data: notification,
        });
    } catch (error) {
        console.error('Archive notification error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to archive notification.',
        });
    }
};

// ------------------------------------------------------
// ARCHIVE SELECTED NOTIFICATIONS
// ------------------------------------------------------

const archiveSelectedNotifications = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide notification IDs to archive.',
            });
        }

        const validIds = ids.filter((id) =>
            mongoose.Types.ObjectId.isValid(id)
        );

        if (validIds.length !== ids.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more notification IDs are invalid.',
            });
        }

        const result = await Notification.updateMany(
            {
                _id: { $in: validIds },
                user: req.user._id,
                isArchived: false,
            },
            {
                $set: {
                    isArchived: true,
                    archivedAt: new Date(),
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Selected notifications archived successfully.',
            data: {
                modifiedCount: result.modifiedCount,
            },
        });
    } catch (error) {
        console.error('Archive selected notifications error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to archive selected notifications.',
        });
    }
};

module.exports = {
    getNotifications,
    getNotificationStats,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    archiveNotification,
    archiveSelectedNotifications,
};