const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const { requireAuth, requireRole } = require('../middleware/auth')
const { requirePermission } = require('../middleware/requirePermission')

const router = express.Router()

// Record audit events without interrupting the main operation.
async function writeAuditLog(req, {
    action,
    description,
    status = 'Success',
    module = 'User Management',
}) {
    try {
        const actor = req.user

        await AuditLog.create({
            user: actor?._id || null,
            userName: actor?.fullName || actor?.email || 'System',
            role: actor?.role || 'System',
            action,
            module,
            description,
            ipAddress: req.ip || '',
            status,
        })
    } catch (error) {
        console.error('Audit log recording failed:', error.message)
    }
}

// GET /api/users
router.get(
    '/',
    requireAuth,
    requireRole('Administrator', 'Manager'),
    requirePermission('User Management', 'V'),
    async (req, res) => {
        try {
            const users = await User.find()
                .select('-__v')
                .sort({ createdAt: -1 })
                .lean()

            return res.status(200).json({
                success: true,
                count: users.length,
                data: users,
            })
        } catch (error) {
            console.error('Get users error:', error.message)

            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve users',
            })
        }
    }
)

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.user,
    })
})


// ============================================
// UPDATE AUTHENTICATED USER PROFILE & SETTINGS
// PATCH /api/users/me
// ============================================

router.patch('/me', requireAuth, async (req, res) => {
    try {
        const user = req.user;

        const {
            fullName,
            firstName,
            lastName,
            username,
            dateOfBirth,
            address,
            phone,
            profileImage,
            preferences,
            notifications,
            securitySettings,
        } = req.body;

        // ------------------------------------
        // PROFILE INFORMATION
        // ------------------------------------

        if (fullName !== undefined) {
            if (typeof fullName !== 'string' || !fullName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Full name cannot be empty.',
                });
            }

            user.fullName = fullName.trim();
        } else if (
            firstName !== undefined ||
            lastName !== undefined
        ) {
            const existingNames = user.fullName.trim().split(/\s+/);

            const currentFirstName = existingNames[0] || '';
            const currentLastName = existingNames.slice(1).join(' ');

            const updatedFirstName =
                firstName !== undefined
                    ? String(firstName).trim()
                    : currentFirstName;

            const updatedLastName =
                lastName !== undefined
                    ? String(lastName).trim()
                    : currentLastName;

            if (!updatedFirstName || !updatedLastName) {
                return res.status(400).json({
                    success: false,
                    message: 'First name and last name are required.',
                });
            }

            user.fullName = `${updatedFirstName} ${updatedLastName}`;
        }

        if (username !== undefined) {
            if (
                typeof username !== 'string' ||
                username.trim().length > 50
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Username must be a valid string with a maximum of 50 characters.',
                });
            }

            user.username = username.trim();
        }

        if (dateOfBirth !== undefined) {
            if (dateOfBirth === null || dateOfBirth === '') {
                user.dateOfBirth = null;
            } else {
                const parsedDate = new Date(dateOfBirth);

                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please provide a valid date of birth.',
                    });
                }

                if (parsedDate > new Date()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Date of birth cannot be in the future.',
                    });
                }

                user.dateOfBirth = parsedDate;
            }
        }

        if (address !== undefined) {
            if (
                typeof address !== 'string' ||
                address.length > 300
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Address must be a string with a maximum of 300 characters.',
                });
            }

            user.address = address.trim();
        }

        if (phone !== undefined) {
            if (
                typeof phone !== 'string' ||
                phone.length > 30
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number must be a valid string.',
                });
            }

            user.phone = phone.trim();
        }

        if (profileImage !== undefined) {
            if (typeof profileImage !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Profile image must be a valid string.',
                });
            }

            user.profileImage = profileImage.trim();
        }

        // ------------------------------------
        // GENERAL PREFERENCES
        // ------------------------------------

        const allowedPreferences = {
            language: ['English (US)', 'Tamil', 'Sinhala'],
            theme: ['Light', 'Dark', 'Auto'],
            dateFormat: [
                'MMM DD, YYYY',
                'DD/MM/YYYY',
                'MM/DD/YYYY',
                'YYYY-MM-DD',
            ],
        };

        if (preferences !== undefined) {
            if (
                !preferences ||
                typeof preferences !== 'object' ||
                Array.isArray(preferences)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid preferences data.',
                });
            }

            for (const [key, value] of Object.entries(preferences)) {
                if (!['language', 'timezone', 'dateFormat', 'theme'].includes(key)) {
                    return res.status(400).json({
                        success: false,
                        message: `Unsupported preference: ${key}`,
                    });
                }

                if (key === 'timezone') {
                    if (
                        typeof value !== 'string' ||
                        value.trim().length === 0 ||
                        value.length > 100
                    ) {
                        return res.status(400).json({
                            success: false,
                            message: 'Please provide a valid timezone.',
                        });
                    }
                } else if (
                    typeof value !== 'string' ||
                    !allowedPreferences[key].includes(value)
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid ${key} preference.`,
                    });
                }

                user.set(`preferences.${key}`, value);
            }
        }

        // ------------------------------------
        // NOTIFICATION PREFERENCES
        // ------------------------------------

        if (notifications !== undefined) {
            if (
                !notifications ||
                typeof notifications !== 'object' ||
                Array.isArray(notifications)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid notification preferences.',
                });
            }

            for (const [key, value] of Object.entries(notifications)) {
                if (!['email', 'inApp', 'sales'].includes(key)) {
                    return res.status(400).json({
                        success: false,
                        message: `Unsupported notification setting: ${key}`,
                    });
                }

                if (typeof value !== 'boolean') {
                    return res.status(400).json({
                        success: false,
                        message: `${key} must be true or false.`,
                    });
                }

                user.set(`notifications.${key}`, value);
            }
        }

        // ------------------------------------
        // SECURITY PREFERENCES
        // ------------------------------------

        if (securitySettings !== undefined) {
            if (
                !securitySettings ||
                typeof securitySettings !== 'object' ||
                Array.isArray(securitySettings)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid security settings.',
                });
            }

            for (const [key, value] of Object.entries(securitySettings)) {
                if (
                    ![
                        'requireRelogin',
                        'confirmationEmail',
                        'loginAlerts',
                    ].includes(key)
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Unsupported security setting: ${key}`,
                    });
                }

                if (typeof value !== 'boolean') {
                    return res.status(400).json({
                        success: false,
                        message: `${key} must be true or false.`,
                    });
                }

                user.set(`securitySettings.${key}`, value);
            }
        }

        // ------------------------------------
        // SAVE USER
        // ------------------------------------

        await user.save();

        // ------------------------------------
        // AUDIT LOG
        // ------------------------------------

        await writeAuditLog(req, {
            action: 'UPDATE',
            description: 'Updated own profile and account settings.',
            module: 'Profile & Settings',
        });

        return res.status(200).json({
            success: true,
            message: 'Profile and settings updated successfully.',
            data: user,
        });

    } catch (error) {
        console.error('Update own profile error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update profile and settings.',
        });
    }
});

// GET /api/users/:id
router.get(
    '/:id',
    requireAuth,
    requireRole('Administrator', 'Manager'),
    requirePermission('User Management', 'V'),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID',
                })
            }

            const user = await User.findById(req.params.id)
                .select('-__v')
                .lean()

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                })
            }

            return res.status(200).json({
                success: true,
                data: user,
            })
        } catch (error) {
            console.error('Get user error:', error.message)

            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve user',
            })
        }
    }
)

// POST /api/users — Create a user profile
router.post(
    '/',
    requireAuth,
    requireRole('Administrator'),
    async (req, res) => {
        try {
            const {
                firebaseUid,
                fullName,
                email,
                role,
                phone,
                department,
            } = req.body

            if (
                typeof firebaseUid !== 'string' ||
                !firebaseUid.trim() ||
                typeof fullName !== 'string' ||
                !fullName.trim() ||
                typeof email !== 'string' ||
                !email.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Firebase UID, full name and email are required',
                })
            }

            const normalizedEmail = email.trim().toLowerCase()

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address',
                })
            }

            const allowedRoles = ['Administrator', 'Manager', 'Staff']

            if (role !== undefined && !allowedRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role',
                })
            }

            const existingUser = await User.findOne({
                $or: [
                    { firebaseUid: firebaseUid.trim() },
                    { email: normalizedEmail },
                ],
            })

            if (existingUser) {
                await writeAuditLog(req, {
                    action: 'Created User',
                    description: `Failed to create user ${normalizedEmail}: user already exists.`,
                    status: 'Failed',
                })

                return res.status(409).json({
                    success: false,
                    message: 'A user with this Firebase UID or email already exists',
                })
            }

            const user = await User.create({
                firebaseUid: firebaseUid.trim(),
                fullName: fullName.trim(),
                email: normalizedEmail,
                role: role || 'Staff',
                phone: typeof phone === 'string' ? phone.trim() : '',
                department:
                    typeof department === 'string' ? department.trim() : '',
            })

            await writeAuditLog(req, {
                action: 'Created User',
                description: `Created user profile for ${user.fullName} (${user.email}), role ${user.role}.`,
            })

            return res.status(201).json({
                success: true,
                message: 'User profile created successfully',
                data: user,
            })
        } catch (error) {
            if (error.code === 11000) {
                await writeAuditLog(req, {
                    action: 'Created User',
                    description: 'Failed to create user: duplicate Firebase UID or email.',
                    status: 'Failed',
                })

                return res.status(409).json({
                    success: false,
                    message: 'A user with this Firebase UID or email already exists',
                })
            }

            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                })
            }

            await writeAuditLog(req, {
                action: 'Created User',
                description: `Failed to create user profile: ${error.message}`,
                status: 'Failed',
            })

            console.error('Create user error:', error.message)

            return res.status(500).json({
                success: false,
                message: 'Failed to create user profile',
            })
        }
    }
)

// PATCH /api/users/:id — Update a user profile
router.patch(
    '/:id',
    requireAuth,
    requireRole('Administrator', 'Manager'),
    requirePermission('User Management', 'E'),
    async (req, res) => {
        try {
            if (
                req.user.role !== 'Administrator' &&
                (Object.hasOwn(req.body, 'role') ||
                    Object.hasOwn(req.body, 'status'))
            ) {
                return res.status(403).json({
                    success: false,
                    message: 'Only Administrators can change user roles or account status',
                })
            }

            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID',
                })
            }

            const allowedFields = [
                'fullName',
                'phone',
                'department',
                'profileImage',
            ]

            if (req.user.role === 'Administrator') {
                allowedFields.push('role', 'status')
            }

            const updates = {}

            for (const field of allowedFields) {
                if (Object.hasOwn(req.body, field)) {
                    updates[field] = req.body[field]
                }
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No permitted fields supplied for update',
                })
            }

            if (
                updates.fullName !== undefined &&
                (typeof updates.fullName !== 'string' ||
                    !updates.fullName.trim())
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Full name must not be empty',
                })
            }

            if (
                updates.role !== undefined &&
                !['Administrator', 'Manager', 'Staff'].includes(updates.role)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role',
                })
            }

            if (
                updates.status !== undefined &&
                !['Active', 'Inactive', 'Suspended'].includes(updates.status)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid account status',
                })
            }

            for (const field of [
                'fullName',
                'phone',
                'department',
                'profileImage',
            ]) {
                if (typeof updates[field] === 'string') {
                    updates[field] = updates[field].trim()
                }
            }

            const user = await User.findByIdAndUpdate(
                req.params.id,
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-__v')

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                })
            }

            await writeAuditLog(req, {
                action: 'Updated User',
                description: `Updated ${user.fullName}. Fields changed: ${Object.keys(updates).join(', ')}.`,
            })

            return res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user,
            })
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                })
            }

            await writeAuditLog(req, {
                action: 'Updated User',
                description: `Failed to update user profile: ${error.message}`,
                status: 'Failed',
            })

            console.error('Update user error:', error.message)

            return res.status(500).json({
                success: false,
                message: 'Failed to update user',
            })
        }
    }
)

// DELETE /api/users/:id — Delete a user profile
router.delete(
    '/:id',
    requireAuth,
    requireRole('Administrator'),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID',
                })
            }

            const user = await User.findByIdAndDelete(req.params.id)

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                })
            }

            await writeAuditLog(req, {
                action: 'Deleted User',
                description: `Deleted user profile for ${user.fullName} (${user.email}).`,
            })

            return res.status(200).json({
                success: true,
                message: 'User profile deleted successfully',
            })
        } catch (error) {
            await writeAuditLog(req, {
                action: 'Deleted User',
                description: `Failed to delete user profile: ${error.message}`,
                status: 'Failed',
            })

            console.error('Delete user error:', error.message)

            return res.status(500).json({
                success: false,
                message: 'Failed to delete user profile',
            })
        }
    }
)

module.exports = router