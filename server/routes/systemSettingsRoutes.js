
const express = require('express')
const mongoose = require('mongoose')
const SystemSettings = require('../models/SystemSettings')

const router = express.Router()

const SETTINGS_FIELDS = {
    general: {
        systemName: 'string',
        organizationName: 'string',
        organizationEmail: 'string',
        supportContact: 'string',
        language: 'string',
        timeZone: 'string',
        dateFormat: 'string',
        currency: 'string',
    },
    security: {
        twoFA: 'boolean',
        passwordExpiryDays: 'number',
        minPasswordLength: 'number',
        maxLoginAttempts: 'number',
        sessionTimeoutMinutes: 'number',
    },
    notifications: {
        email: 'boolean',
        inApp: 'boolean',
        inventory: 'boolean',
        deadline: 'boolean',
        maintenance: 'boolean',
    },
    automation: {
        global: 'boolean',
        taskAssignment: 'boolean',
        approvals: 'boolean',
        inventory: 'boolean',
        sales: 'boolean',
    },
    maintenance: {
        maintenanceMode: 'boolean',
        scheduledWindow: 'string',
        maintenanceNotice: 'string',
    },
}

const ALLOWED_VALUES = {
    'security.passwordExpiryDays': [30, 60, 90],
    'general.language': [
        'English (United States)',
        'English (United Kingdom)',
        'Sinhala',
        'Tamil',
    ],
    'general.timeZone': [
        '(GMT-05:00) Eastern Time',
        '(GMT+05:30) Sri Lanka',
        '(GMT+00:00) UTC',
    ],
    'general.dateFormat': [
        'MM/DD/YYYY',
        'DD/MM/YYYY',
        'YYYY-MM-DD',
    ],
    'general.currency': [
        'USD ($)',
        'LKR (Rs.)',
        'GBP (£)',
        'EUR (€)',
    ],
}

// Flatten only explicitly supported settings fields.
function validateAndFlattenSettings(body) {
    const updates = {}

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('Request body must be a settings object.')
    }

    for (const [section, values] of Object.entries(body)) {
        if (
            !Object.prototype.hasOwnProperty.call(
                SETTINGS_FIELDS,
                section
            )
        ) {
            throw new Error(`Unknown settings section: ${section}`)
        }

        if (
            !values ||
            typeof values !== 'object' ||
            Array.isArray(values)
        ) {
            throw new Error(`Invalid settings section: ${section}`)
        }

        for (const [field, value] of Object.entries(values)) {
            const expectedType = SETTINGS_FIELDS[section][field]

            if (!expectedType) {
                throw new Error(
                    `Unknown setting: ${section}.${field}`
                )
            }

            if (typeof value !== expectedType) {
                throw new Error(
                    `${section}.${field} must be a ${expectedType}.`
                )
            }

            if (
                typeof value === 'string' &&
                value.trim().length === 0 &&
                ![
                    'maintenance.scheduledWindow',
                    'maintenance.maintenanceNotice',
                ].includes(`${section}.${field}`)
            ) {
                throw new Error(
                    `${section}.${field} cannot be empty.`
                )
            }

            const allowed = ALLOWED_VALUES[`${section}.${field}`]

            if (allowed && !allowed.includes(value)) {
                throw new Error(
                    `Invalid value for ${section}.${field}.`
                )
            }

            if (
                section === 'security' &&
                field === 'minPasswordLength' &&
                (value < 8 || value > 128)
            ) {
                throw new Error(
                    'Minimum password length must be between 8 and 128.'
                )
            }

            if (
                section === 'security' &&
                field === 'maxLoginAttempts' &&
                (value < 1 || value > 20)
            ) {
                throw new Error(
                    'Maximum login attempts must be between 1 and 20.'
                )
            }

            if (
                section === 'security' &&
                field === 'sessionTimeoutMinutes' &&
                (value < 15 || value > 120)
            ) {
                throw new Error(
                    'Session timeout must be between 15 and 120 minutes.'
                )
            }

            if (
                section === 'general' &&
                field === 'organizationEmail' &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ) {
                throw new Error(
                    'Please provide a valid organization email.'
                )
            }

            if (
                section === 'general' &&
                field === 'systemName' &&
                value.trim().length > 100
            ) {
                throw new Error('System name is too long.')
            }

            if (
                section === 'general' &&
                field === 'organizationName' &&
                value.trim().length > 150
            ) {
                throw new Error('Organization name is too long.')
            }

            if (
                section === 'maintenance' &&
                field === 'maintenanceNotice' &&
                value.length > 2000
            ) {
                throw new Error(
                    'Maintenance notice cannot exceed 2000 characters.'
                )
            }

            updates[`${section}.${field}`] =
                typeof value === 'string' ? value.trim() : value
        }
    }

    if (Object.keys(updates).length === 0) {
        throw new Error('No settings were provided to update.')
    }

    return updates
}

// GET /api/system-settings
// Return the global settings document, creating it with defaults if needed.
router.get('/', async (req, res) => {
    try {
        const settings = await SystemSettings.findOneAndUpdate(
            { key: 'global' },
            { $setOnInsert: { key: 'global' } },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true,
            }
        )

        return res.status(200).json({
            success: true,
            message: 'System settings loaded successfully.',
            settings,
        })
    } catch (error) {
        console.error('Get system settings error:', error)

        return res.status(500).json({
            success: false,
            message: 'Unable to load system settings.',
        })
    }
})

// PUT /api/system-settings
// Update only supported settings fields.
router.put('/', async (req, res) => {
    try {
        const updates = validateAndFlattenSettings(req.body)

        const settings = await SystemSettings.findOneAndUpdate(
            { key: 'global' },
            {
                $set: updates,
                $setOnInsert: { key: 'global' },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true,
            }
        )

        return res.status(200).json({
            success: true,
            message: 'System settings saved successfully.',
            settings,
        })
    } catch (error) {
        if (
            error.message &&
            (
                error.message.startsWith('Unknown ') ||
                error.message.startsWith('Invalid ') ||
                error.message.includes(' must be ') ||
                error.message.includes(' cannot be ') ||
                error.message.includes('between') ||
                error.message.includes('too long') ||
                error.message.includes('valid organization email') ||
                error.message.includes('No settings')
            )
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            })
        }

        if (
            error instanceof mongoose.Error.ValidationError ||
            error instanceof mongoose.Error.CastError
        ) {
            return res.status(400).json({
                success: false,
                message: 'One or more settings values are invalid.',
            })
        }

        console.error('Update system settings error:', error)

        return res.status(500).json({
            success: false,
            message: 'Unable to save system settings.',
        })
    }
})

module.exports = router
