const express = require('express')
const mongoose = require('mongoose')

const RolePermission = require('../models/RolePermission')
const AuditLog = require('../models/AuditLog')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

const ROLE_NAMES = RolePermission.ROLE_NAMES
const MODULE_NAMES = RolePermission.MODULE_NAMES
const ACTION_CODES = RolePermission.ACTION_CODES

// Record audit events without interrupting permission operations.
async function writeAuditLog(req, {
    action,
    description,
    status = 'Success',
}) {
    try {
        const actor = req.user

        await AuditLog.create({
            user: actor?._id || null,
            userName: actor?.fullName || actor?.email || 'System',
            role: actor?.role || 'System',
            action,
            module: 'Roles & Permissions',
            description,
            ipAddress: req.ip || '',
            status,
        })
    } catch (error) {
        console.error('Permission audit logging failed:', error.message)
    }
}

// Default permissions matching the existing frontend matrix.
function createDefaultPermissions(role) {
    const permissions = {}

    for (const moduleName of MODULE_NAMES) {
        permissions[moduleName] = {}

        for (const actionCode of ACTION_CODES) {
            let allowed = false

            if (actionCode === 'V') {
                allowed = !(role === 'Staff' && moduleName === 'System Settings')
            } else if (actionCode === 'C') {
                allowed = role !== 'Staff'
            } else if (actionCode === 'E') {
                allowed = role !== 'Staff'
            } else if (actionCode === 'D') {
                allowed = role === 'Administrator'
            } else if (actionCode === 'A') {
                allowed = role !== 'Staff'
            } else if (actionCode === 'X') {
                allowed = role !== 'Staff' || moduleName === 'Task Management'
            }

            permissions[moduleName][actionCode] = allowed
        }
    }

    return permissions
}

// Create missing role records without overwriting saved permissions.
async function ensureDefaultRolePermissions() {
    for (const role of ROLE_NAMES) {
        await RolePermission.updateOne(
            { role },
            {
                $setOnInsert: {
                    role,
                    permissions: createDefaultPermissions(role),
                },
            },
            { upsert: true }
        )
    }
}

// GET /api/permissions
router.get(
    '/',
    requireAuth,
    requireRole('Administrator'),
    async (req, res) => {
        try {
            await ensureDefaultRolePermissions()

            const roles = await RolePermission.find()
                .select('-__v')
                .sort({ role: 1 })
                .lean()

            return res.status(200).json({
                success: true,
                data: roles,
            })
        } catch (error) {
            console.error('Get role permissions error:', error.message)

            return res.status(500).json({
                success: false,
                message: 'Unable to retrieve role permissions',
            })
        }
    }
)

// PUT /api/permissions/:role
router.put(
    '/:role',
    requireAuth,
    requireRole('Administrator'),
    async (req, res) => {
        const { role } = req.params

        try {
            if (!ROLE_NAMES.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role name',
                })
            }

            // Administrator permissions are fixed.
            if (role === 'Administrator') {
                await writeAuditLog(req, {
                    action: 'Updated Permissions',
                    description: 'Rejected an attempt to modify fixed Administrator permissions.',
                    status: 'Failed',
                })

                return res.status(403).json({
                    success: false,
                    message: 'Administrator permissions are fixed and cannot be modified.',
                })
            }

            const { permissions } = req.body

            if (
                !permissions ||
                typeof permissions !== 'object' ||
                Array.isArray(permissions)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'A permissions object is required',
                })
            }

            const submittedModules = Object.keys(permissions)

            if (
                submittedModules.length !== MODULE_NAMES.length ||
                MODULE_NAMES.some(
                    moduleName =>
                        !Object.prototype.hasOwnProperty.call(
                            permissions,
                            moduleName
                        )
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Permissions must include every valid module',
                })
            }

            for (const moduleName of MODULE_NAMES) {
                const modulePermissions = permissions[moduleName]

                if (
                    !modulePermissions ||
                    typeof modulePermissions !== 'object' ||
                    Array.isArray(modulePermissions)
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid permissions for ${moduleName}`,
                    })
                }

                const submittedActions = Object.keys(modulePermissions)

                if (
                    submittedActions.length !== ACTION_CODES.length ||
                    ACTION_CODES.some(
                        actionCode =>
                            !Object.prototype.hasOwnProperty.call(
                                modulePermissions,
                                actionCode
                            )
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid action codes for ${moduleName}`,
                    })
                }

                for (const actionCode of ACTION_CODES) {
                    if (typeof modulePermissions[actionCode] !== 'boolean') {
                        return res.status(400).json({
                            success: false,
                            message: `${moduleName}.${actionCode} must be true or false`,
                        })
                    }
                }
            }

            const previousRole = await RolePermission.findOne({ role }).lean()

            const savedRole = await RolePermission.findOneAndUpdate(
                { role },
                {
                    $set: {
                        permissions,
                        updatedBy: new mongoose.Types.ObjectId(req.user._id),
                    },
                    $setOnInsert: { role },
                },
                {
                    // new: true,
                    returnDocument: 'after',
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                }
            )
                .select('-__v')
                .lean()

            // Record which permission values changed.
            const changes = []

            for (const moduleName of MODULE_NAMES) {
                for (const actionCode of ACTION_CODES) {
                    const before =
                        previousRole?.permissions?.[moduleName]?.[actionCode]

                    const after = permissions[moduleName][actionCode]

                    if (before !== after) {
                        changes.push(
                            `${moduleName}.${actionCode}: ${before === undefined ? 'unset' : before} → ${after}`
                        )
                    }
                }
            }

            await writeAuditLog(req, {
                action: 'Updated Permissions',
                description: changes.length
                    ? `Updated ${role} permissions. Changes: ${changes.join('; ')}`
                    : `Saved ${role} permissions with no changes to permission values.`,
            })

            return res.status(200).json({
                success: true,
                message: `Permissions for ${role} saved successfully`,
                data: savedRole,
            })
        } catch (error) {
            await writeAuditLog(req, {
                action: 'Updated Permissions',
                description: `Failed to save permissions for ${role}: ${error.message}`,
                status: 'Failed',
            })

            console.error('Save role permissions error:', error.message)

            return res.status(500).json({
                success: false,
                message: 'Unable to save role permissions',
            })
        }
    }
)

module.exports = router