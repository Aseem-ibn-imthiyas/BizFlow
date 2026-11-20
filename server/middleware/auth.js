
const { firebaseAuth } = require('../config/firebaseAdmin');
const User = require('../models/User');

// Verify Firebase ID token and load the BizFlow user profile.
async function requireAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        const idToken = authorization.slice('Bearer '.length).trim();

        if (!idToken) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing',
            });
        }

        // Verify the token's signature, issuer, audience and expiry.
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);

        // Load the corresponding BizFlow profile from MongoDB.
        const user = await User.findOne({
            firebaseUid: decodedToken.uid,
        }).select('-__v');

        if (!user) {
            return res.status(403).json({
                success: false,
                message: 'No BizFlow profile is linked to this account',
            });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Your BizFlow account is not active',
            });
        }

        // Use the database role, not a role supplied by the client.
        req.user = user;
        req.firebaseUser = decodedToken;

        next();
    } catch (error) {
        if (
            error.code === 'auth/id-token-expired' ||
            error.code === 'auth/argument-error' ||
            error.code === 'auth/invalid-id-token'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token',
            });
        }

        if (error.code && error.code.startsWith('auth/')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed',
            });
        }

        console.error('Authentication middleware error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to authenticate request',
        });
    }
}

// Restrict access to specified BizFlow roles.
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            });
        }

        next();
    };
}

module.exports = { requireAuth, requireRole };
