
const mongoose = require('mongoose')

const systemSettingsSchema = new mongoose.Schema(
    {
        // Keep one global settings document.
        key: {
            type: String,
            default: 'global',
            unique: true,
            immutable: true,
        },

        // General Settings
        general: {
            systemName: {
                type: String,
                default: 'BizFlow BPA',
                trim: true,
            },
            organizationName: {
                type: String,
                default: 'Kinetic Global Corp',
                trim: true,
            },
            organizationEmail: {
                type: String,
                default: 'admin@bizflow.com',
                trim: true,
                lowercase: true,
            },
            supportContact: {
                type: String,
                default: '+1 (800) 555-0199',
                trim: true,
            },
            language: {
                type: String,
                default: 'English (United States)',
            },
            timeZone: {
                type: String,
                default: '(GMT-05:00) Eastern Time',
            },
            dateFormat: {
                type: String,
                default: 'MM/DD/YYYY',
            },
            currency: {
                type: String,
                default: 'USD ($)',
            },
        },

        // Security
        security: {
            twoFA: {
                type: Boolean,
                default: true,
            },
            passwordExpiryDays: {
                type: Number,
                enum: [30, 60, 90],
                default: 60,
            },
            minPasswordLength: {
                type: Number,
                min: 8,
                max: 128,
                default: 12,
            },
            maxLoginAttempts: {
                type: Number,
                min: 1,
                max: 20,
                default: 5,
            },
            sessionTimeoutMinutes: {
                type: Number,
                min: 15,
                max: 120,
                default: 60,
            },
        },

        // Notifications
        notifications: {
            email: { type: Boolean, default: true },
            inApp: { type: Boolean, default: true },
            inventory: { type: Boolean, default: false },
            deadline: { type: Boolean, default: true },
            maintenance: { type: Boolean, default: true },
        },

        // Workflow Automation
        automation: {
            global: { type: Boolean, default: true },
            taskAssignment: { type: Boolean, default: true },
            approvals: { type: Boolean, default: true },
            inventory: { type: Boolean, default: false },
            sales: { type: Boolean, default: true },
        },

        // Maintenance
        maintenance: {
            maintenanceMode: {
                type: Boolean,
                default: false,
            },
            scheduledWindow: {
                type: String,
                default: '',
                trim: true,
            },
            maintenanceNotice: {
                type: String,
                default: '',
                trim: true,
            },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
)

module.exports = mongoose.model(
    'SystemSettings',
    systemSettingsSchema
)
