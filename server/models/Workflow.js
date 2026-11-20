
const mongoose = require('mongoose')

const workflowStepSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        number: { type: Number, required: true },
        type: { type: String, required: true },
        typeKey: { type: String, required: true },
        typeClass: { type: String, default: '' },
        iconClass: { type: String, default: '' },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        status: { type: String, default: 'Needs configuration' },
        config: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { _id: false }
)

const workflowSchema = new mongoose.Schema(
    {
        workflowName: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 80,
        },
        workflowDescription: {
            type: String,
            default: '',
            maxlength: 500,
        },
        workflowCategory: {
            type: String,
            required: true,
        },
        workflowSteps: {
            type: [workflowStepSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ['Draft', 'Published'],
            default: 'Draft',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Workflow', workflowSchema)
