
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        username: {
            type: String,
            trim: true,
            default: '',
            maxlength: 50,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        role: {
            type: String,
            required: true,
            enum: ['Administrator', 'Manager', 'Staff'],
            default: 'Staff',
        },

        phone: {
            type: String,
            trim: true,
            default: '',
        },

        dateOfBirth: {
            type: Date,
            default: null,
        },

        address: {
            type: String,
            trim: true,
            default: '',
            maxlength: 300,
        },

        department: {
            type: String,
            trim: true,
            default: '',
        },

        profileImage: {
            type: String,
            default: '',
        },

        // Account preferences
        preferences: {
            language: {
                type: String,
                default: 'English (US)',
            },
            timezone: {
                type: String,
                default: 'Asia/Colombo',
            },
            dateFormat: {
                type: String,
                default: 'MMM DD, YYYY',
            },
            theme: {
                type: String,
                enum: ['Light', 'Dark', 'Auto'],
                default: 'Light',
            },
        },

        // Notification preferences
        notifications: {
            email: {
                type: Boolean,
                default: true,
            },
            inApp: {
                type: Boolean,
                default: true,
            },
            sales: {
                type: Boolean,
                default: false,
            },
        },

        // Account security preferences
        securitySettings: {
            requireRelogin: {
                type: Boolean,
                default: true,
            },
            confirmationEmail: {
                type: Boolean,
                default: true,
            },
            loginAlerts: {
                type: Boolean,
                default: true,
            },
        },

        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Suspended'],
            default: 'Active',
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
