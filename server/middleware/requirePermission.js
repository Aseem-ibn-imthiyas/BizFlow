
const RolePermission = require('../models/RolePermission');

const VALID_ACTION_CODES = RolePermission.ACTION_CODES;
const VALID_MODULE_NAMES = RolePermission.MODULE_NAMES;

/**
 * Checks whether the authenticated user's role has permission
 * to perform a specific action in a module.
 *
 * Usage:
 * router.get(
 *   '/',
 *   requireAuth,
 *   requirePermission('Inventory Management', 'V'),
 *   controller
 * );
 */
function requirePermission(moduleName, actionCode) {
    return async function permissionMiddleware(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            if (!VALID_MODULE_NAMES.includes(moduleName)) {
                console.error(
                    `Invalid permission module configured: ${moduleName}`
                );

                return res.status(500).json({
                    success: false,
                    message: 'Invalid permission configuration',
                });
            }

            if (!VALID_ACTION_CODES.includes(actionCode)) {
                console.error(
                    `Invalid permission action configured: ${actionCode}`
                );

                return res.status(500).json({
                    success: false,
                    message: 'Invalid permission configuration',
                });
            }

            // Administrator has full access and cannot be locked out
            // by changing the editable permission matrix.
            if (req.user.role === 'Administrator') {
                return next();
            }

            const rolePermissions = await RolePermission.findOne({
                role: req.user.role,
            })
                .select('permissions')
                .lean();

            // Fail closed if a role has no stored permission configuration.
            if (!rolePermissions) {
                return res.status(403).json({
                    success: false,
                    message: 'Permissions have not been configured for your role',
                });
            }

            const allowed =
                rolePermissions.permissions?.[moduleName]?.[actionCode] === true;

            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to perform this action',
                });
            }

            return next();
        } catch (error) {
            console.error('Permission middleware error:', error.message);

            return res.status(500).json({
                success: false,
                message: 'Unable to verify permissions',
            });
        }
    };
}

module.exports = { requirePermission };
