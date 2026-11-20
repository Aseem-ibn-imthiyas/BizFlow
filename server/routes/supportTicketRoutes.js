
const express = require('express');
const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');

const router = express.Router();

const allowedStatuses = [
    'Open',
    'In Progress',
    'Resolved',
    'Closed',
]

const allowedPriorities = [
    'Low',
    'Medium',
    'High',
    'Critical',
]

// GET /api/support-tickets
// List tickets, with optional search and status filtering.
router.get('/', async (req, res) => {
    try {
        const { search = '', status = 'All', category = 'All' } =
            req.query

        const filter = {}

        if (status !== 'All') {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ticket status.',
                })
            }

            filter.status = status
        }

        if (category !== 'All') {
            filter.category = category
        }

        const searchTerm = String(search).trim()

        if (searchTerm) {
            const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

            const regex = new RegExp(escapedSearch, 'i')

            filter.$or = [
                { ticketId: regex },
                { subject: regex },
                { category: regex },
                { requesterName: regex },
                { requesterEmail: regex },
            ]
        }

        const tickets = await SupportTicket.find(filter)
            .sort({ createdAt: -1 })
            .lean()

        return res.status(200).json({
            success: true,
            count: tickets.length,
            tickets,
        })
    } catch (error) {
        console.error('Failed to fetch support tickets:', error)

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch support tickets.',
        })
    }
})

// GET /api/support-tickets/:id
// Find one ticket using its ticket reference or MongoDB ID.
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const ticket = await SupportTicket.findOne({
            $or: [
                { ticketId: id },
                ...(mongoose.isValidObjectId(id)
                    ? [{ _id: id }]
                    : []),
            ],
        }).lean()

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found.',
            })
        }

        return res.status(200).json({
            success: true,
            ticket,
        })
    } catch (error) {
        console.error('Failed to fetch support ticket:', error)

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch support ticket.',
        })
    }
})

// POST /api/support-tickets
// Create a new support ticket.
router.post('/', async (req, res) => {
    try {
        const {
            subject,
            category,
            description,
            priority,
            requesterName,
            requesterEmail,
        } = req.body

        if (
            !subject?.trim() ||
            !category ||
            !description?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Subject, category, and description are required.',
            })
        }

        const ticket = await SupportTicket.create({
            subject,
            category,
            description,
            priority: priority || 'Medium',
            requesterName: requesterName || 'Admin User',
            requesterEmail: requesterEmail || '',
        })

        return res.status(201).json({
            success: true,
            message: 'Support ticket created successfully.',
            ticket,
        })
    } catch (error) {
        console.error('Failed to create support ticket:', error)

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
            })
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to create support ticket.',
        })
    }
})

// PATCH /api/support-tickets/:id
// Update ticket status, priority, assignment, or resolution notes.
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const allowedFields = [
            'status',
            'priority',
            'assignedTo',
            'resolutionNotes',
        ]

        const updates = {}

        for (const field of allowedFields) {
            if (Object.hasOwn(req.body, field)) {
                updates[field] = req.body[field]
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid update fields were provided.',
            })
        }

        if (
            updates.status &&
            !allowedStatuses.includes(updates.status)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ticket status.',
            })
        }

        if (
            updates.priority &&
            !allowedPriorities.includes(updates.priority)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ticket priority.',
            })
        }

        const ticket = await SupportTicket.findOneAndUpdate(
            {
                $or: [
                    { ticketId: id },
                    ...(mongoose.isValidObjectId(id)
                        ? [{ _id: id }]
                        : []),
                ],
            },
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        )

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Support ticket updated successfully.',
            ticket,
        })
    } catch (error) {
        console.error('Failed to update support ticket:', error)

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
            })
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to update support ticket.',
        })
    }
})

module.exports = router;
