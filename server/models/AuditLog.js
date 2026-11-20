const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        userName: { type: String, default: 'System' },
        role: { type: String, default: 'System' },
        action: { type: String, required: true },
        module: { type: String, required: true },
        description: { type: String, default: '' },
        ipAddress: { type: String, default: '' },
        status: {
            type: String,
            enum: ['Success', 'Failed', 'Pending'],
            default: 'Success',
        },
    },
    { timestamps: true }
)

auditLogSchema.index({ createdAt: -1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)