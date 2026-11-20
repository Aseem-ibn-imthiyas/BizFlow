const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
    'Inventory',
    'Sales',
    'Task',
    'Report',
    'System',
];

const NOTIFICATION_PRIORITIES = [
    'High',
    'Medium',
    'Low',
];

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        type: {
            type: String,
            required: true,
            enum: NOTIFICATION_TYPES,
            default: 'System',
        },

        priority: {
            type: String,
            required: true,
            enum: NOTIFICATION_PRIORITIES,
            default: 'Medium',
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
            default: null,
        },

        isArchived: {
            type: Boolean,
            default: false,
        },

        archivedAt: {
            type: Date,
            default: null,
        },

        relatedEntity: {
            type: String,
            default: '',
        },

        relatedEntityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Optimised notification retrieval for individual users.
notificationSchema.index({
    user: 1,
    isArchived: 1,
    createdAt: -1,
});

notificationSchema.index({
    user: 1,
    isRead: 1,
    isArchived: 1,
});

notificationSchema.statics.NOTIFICATION_TYPES =
    NOTIFICATION_TYPES;

notificationSchema.statics.NOTIFICATION_PRIORITIES =
    NOTIFICATION_PRIORITIES;

module.exports = mongoose.model(
    'Notification',
    notificationSchema
);