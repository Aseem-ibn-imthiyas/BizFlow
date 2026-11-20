const express = require('express')
const mongoose = require('mongoose')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

// GET /api/system-health
router.get(
    '/',
    requireAuth,
    requireRole('Administrator'),
    async (req, res) => {
        const startTime = Date.now()

        try {
            const dbState = mongoose.connection.readyState

            const databaseStatus = {
                0: 'Disconnected',
                1: 'Connected',
                2: 'Connecting',
                3: 'Disconnecting',
            }[dbState] || 'Unknown'

            const memory = process.memoryUsage()

            return res.status(200).json({
                success: true,
                data: {
                    api: {
                        status: 'Online',
                        responseTimeMs: Date.now() - startTime,
                    },
                    database: {
                        status: databaseStatus,
                        connected: dbState === 1,
                    },
                    uptimeSeconds: Math.floor(process.uptime()),
                    server: {
                        memoryUsageMB: Math.round(
                            memory.heapUsed / 1024 / 1024
                        ),
                        memoryTotalMB: Math.round(
                            memory.heapTotal / 1024 / 1024
                        ),
                        memoryUsagePercent: memory.heapTotal
                            ? Math.round(
                                (memory.heapUsed / memory.heapTotal) * 100
                            )
                            : 0,
                    },
                    checkedAt: new Date().toISOString(),
                },
            })
        } catch (error) {
            console.error('System health error:', error.message)

            return res.status(500).json({
                success: false,
                message: 'Unable to retrieve system health',
            })
        }
    }
)

module.exports = router