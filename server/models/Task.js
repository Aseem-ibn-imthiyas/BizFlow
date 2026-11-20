
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        taskId: {
            type: String,
            unique: true,
            uppercase: true,
            trim: true,
        },

        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: '',
        },

        category: {
            type: String,
            trim: true,
            default: 'General',
            maxlength: 50,
        },

        tags: {
            type: [String],
            default: [],
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },

        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Review', 'Completed'],
            default: 'Pending',
        },

        startDate: {
            type: Date,
            default: Date.now,
        },

        dueDate: {
            type: Date,
            required: [true, 'Task due date is required'],
        },

        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        comments: {
            type: [
                {
                    user: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        required: true,
                    },

                    message: {
                        type: String,
                        required: true,
                        trim: true,
                        maxlength: 1000,
                    },

                    createdAt: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
            default: [],
        },

        completedAt: {
            type: Date,
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Database indexes
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

taskSchema.index({
    title: 'text',
    description: 'text',
    taskId: 'text',
});

// Generate a unique task ID before saving a new task.
taskSchema.pre('validate', async function () {
    if (!this.isNew || this.taskId) {
        return;
    }

    const Task = this.constructor;
    const currentYear = new Date().getFullYear();
    const prefix = `TK-${currentYear}-`;

    const latestTask = await Task.findOne({
        taskId: new RegExp(`^${prefix}\\d+$`),
    })
        .sort({ taskId: -1 })
        .select('taskId')
        .lean();

    let nextNumber = 1;

    if (latestTask?.taskId) {
        const previousNumber = Number(
            latestTask.taskId.split('-').pop()
        );

        nextNumber = previousNumber + 1;
    }

    this.taskId = `${prefix}${String(nextNumber).padStart(6, '0')}`;
});

// Automatically maintain completion progress.
taskSchema.pre('save', function () {
    if (this.isModified('status')) {
        if (this.status === 'Completed') {
            this.progress = 100;
            this.completedAt = this.completedAt || new Date();
        } else {
            this.completedAt = null;

            if (this.status === 'Pending' && this.progress === 100) {
                this.progress = 0;
            }
        }
    }

    if (this.isModified('progress') && this.progress < 100) {
        this.completedAt = null;
    }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
