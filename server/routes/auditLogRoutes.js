const express = require('express')
const mongoose = require('mongoose')
const AuditLog = require('../models/AuditLog')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

// GET /api/audit-logs — Administrator only
router.get('/', requireAuth, requireRole('Administrator'), async (req, res) => {
    try {
        const {
            search = '',
            dateRange = 'all',
            user = '',
            action = '',
            module = '',
            status = '',
            page = 1,
            limit = 10,
        } = req.query

        const filter = {}

        if (search.trim()) {
            const regex = new RegExp(
                search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                'i'
            )

            filter.$or = [
                { userName: regex },
                { role: regex },
                { action: regex },
                { module: regex },
                { description: regex },
                { ipAddress: regex },
                { status: regex },
            ]
        }

        if (user) filter.userName = user
        if (action) filter.action = action
        if (module) filter.module = module
        if (status) filter.status = status

        const now = new Date()
        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)

        if (dateRange === 'today') {
            filter.createdAt = { $gte: startOfToday }
        } else if (dateRange === 'yesterday') {
            const start = new Date(startOfToday)
            start.setDate(start.getDate() - 1)
            filter.createdAt = { $gte: start, $lt: startOfToday }
        } else if (dateRange === 'last7days') {
            const start = new Date(startOfToday)
            start.setDate(start.getDate() - 6)
            filter.createdAt = { $gte: start }
        } else if (dateRange === 'last30days') {
            const start = new Date(startOfToday)
            start.setDate(start.getDate() - 29)
            filter.createdAt = { $gte: start }
        }

        const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1)
        const pageSize = Math.min(
            100,
            Math.max(1, Number.parseInt(limit, 10) || 10)
        )

        const [logs, total, totalEvents, todayEvents, securityEvents, failedActions] =
            await Promise.all([
                AuditLog.find(filter)
                    .sort({ createdAt: -1 })
                    .skip((pageNumber - 1) * pageSize)
                    .limit(pageSize)
                    .lean(),

                AuditLog.countDocuments(filter),
                AuditLog.countDocuments(),
                AuditLog.countDocuments({ createdAt: { $gte: startOfToday } }),
                AuditLog.countDocuments({
                    $or: [
                        { module: /security/i },
                        { action: /login|logout|permission|security|password/i },
                    ],
                }),
                AuditLog.countDocuments({ status: 'Failed' }),
            ])

        res.json({
            success: true,
            data: {
                logs,
                summary: {
                    totalEvents,
                    todayEvents,
                    securityEvents,
                    failedActions,
                },
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        })
    } catch (error) {
        console.error('Audit logs error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit logs.',
        })
    }
})

// Export all logs matching the current filters as CSV
router.get('/export', requireAuth, requireRole('Administrator'), async (req, res) => {
    try {
        // Reuse the same filters by redirecting the frontend to request CSV
        // after the list endpoint is working. CSV export is added in the next step.
        res.status(501).json({
            success: false,
            message: 'CSV export will be enabled in the next step.',
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to export audit logs.',
        })
    }
})

module.exports = router