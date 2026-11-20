
const mongoose = require('mongoose')

const supportTicketSchema = new mongoose.Schema(
    {
        ticketId: {
            type: String,
            unique: true,
            index: true,
        },

        subject: {
            type: String,
            required: [true, 'Ticket subject is required'],
            trim: true,
            maxlength: 150,
        },

        category: {
            type: String,
            required: [true, 'Ticket category is required'],
            enum: [
                'General',
                'Account',
                'Automation',
                'User Management',
                'Reports & Analytics',
                'Technical Issue',
                'Other',
            ],
        },

        description: {
            type: String,
            required: [true, 'Ticket description is required'],
            trim: true,
            maxlength: 5000,
        },

        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },

        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
            default: 'Open',
        },

        requesterName: {
            type: String,
            trim: true,
            default: 'Admin User',
        },

        requesterEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },

        assignedTo: {
            type: String,
            trim: true,
            default: '',
        },

        resolutionNotes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
)

// Generate a readable ticket reference before saving a new ticket.
supportTicketSchema.pre('validate', async function () {
    if (!this.isNew || this.ticketId) return

    const date = new Date()
    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('')

    let ticketId
    let exists = true

    while (exists) {
        const randomPart = Math.floor(
            10000 + Math.random() * 90000
        )

        ticketId = `SUP-${datePart}-${randomPart}`

        exists = await mongoose.models.SupportTicket.exists({
            ticketId,
        })
    }

    this.ticketId = ticketId
})

supportTicketSchema.index({ status: 1, createdAt: -1 })
supportTicketSchema.index({ category: 1, priority: 1 })

const SupportTicket = mongoose.model(
    'SupportTicket',
    supportTicketSchema
)

module.exports = SupportTicket
