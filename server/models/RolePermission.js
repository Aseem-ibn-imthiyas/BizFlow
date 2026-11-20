
const mongoose = require('mongoose');

const ROLE_NAMES = ['Administrator', 'Manager', 'Staff'];

const MODULE_NAMES = [
    'Dashboard',
    'User Management',
    'Inventory Management',
    'Sales Management',
    'Task Management',
    'Reports',
    'Analytics',
    'Notifications',
    'Profile',
    'System Settings',
    'Workflow Automation',
    'Audit Logs',
];

const ACTION_CODES = ['V', 'C', 'E', 'D', 'A', 'X'];

const rolePermissionSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            required: true,
            enum: ROLE_NAMES,
            unique: true,
            index: true,
        },

        // Example:
        // permissions: {
        //   Dashboard: { V: true, C: false, ... },
        //   Reports: { V: true, C: false, ... }
        // }
        permissions: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            default: {},
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
        minimize: false,
    }
);

rolePermissionSchema.statics.ROLE_NAMES = ROLE_NAMES;
rolePermissionSchema.statics.MODULE_NAMES = MODULE_NAMES;
rolePermissionSchema.statics.ACTION_CODES = ACTION_CODES;

module.exports = mongoose.model(
    'RolePermission',
    rolePermissionSchema
);
