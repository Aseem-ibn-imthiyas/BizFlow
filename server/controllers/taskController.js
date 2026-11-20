
const mongoose = require('mongoose');

const Task = require('../models/Task');
const User = require('../models/User');

const {
    notifyUsers,
} = require('../services/notificationService');

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const validStatuses = [
    'Pending',
    'In Progress',
    'Review',
    'Completed',
];

const validPriorities = [
    'Low',
    'Medium',
    'High',
    'Critical',
];

const validSortFields = [
    'createdAt',
    'updatedAt',
    'dueDate',
    'priority',
    'title',
];

// ------------------------------------------------------
// GET ACTIVE TASK ASSIGNEES
// GET /api/tasks/assignees
// ------------------------------------------------------

const getTaskAssignees = async (req, res) => {
    try {
        const users = await User.find({
            role: 'Staff',
            status: 'Active',
        })
            .select('_id fullName email role')
            .sort({ fullName: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Get task assignees error:', error);

        return sendError(
            res,
            500,
            'Unable to retrieve task assignees.'
        );
    }
};

// ------------------------------------------------------
// GET ALL TASKS
// GET /api/tasks
// ------------------------------------------------------

const getTasks = async (req, res) => {
    try {
        const {
            search,
            status,
            priority,
            assignedTo,
            category,
            dueDate,
            overdue,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            order = 'desc',
        } = req.query;

        const filter = {};

        // Search by task ID, title, description or category.
        if (search && search.trim()) {
            const searchRegex = new RegExp(
                escapeRegex(search.trim()),
                'i'
            );

            filter.$or = [
                { taskId: searchRegex },
                { title: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { tags: searchRegex },
            ];
        }

        // Filter by status.
        if (status && status !== 'all') {
            if (!validStatuses.includes(status)) {
                return sendError(
                    res,
                    400,
                    'Invalid task status.'
                );
            }

            filter.status = status;
        }

        // Filter by priority.
        if (priority && priority !== 'all') {
            if (!validPriorities.includes(priority)) {
                return sendError(
                    res,
                    400,
                    'Invalid task priority.'
                );
            }

            filter.priority = priority;
        }

        // Filter by assigned employee.
        if (assignedTo && assignedTo !== 'all') {
            if (!isValidObjectId(assignedTo)) {
                return sendError(
                    res,
                    400,
                    'Invalid assigned employee ID.'
                );
            }

            filter.assignedTo = assignedTo;
        }

        // Filter by category.
        if (category && category !== 'all') {
            filter.category = category;
        }

        // Filter by due date.
        if (dueDate) {
            const start = new Date(`${dueDate}T00:00:00.000Z`);
            const end = new Date(`${dueDate}T23:59:59.999Z`);

            if (
                Number.isNaN(start.getTime()) ||
                Number.isNaN(end.getTime())
            ) {
                return sendError(
                    res,
                    400,
                    'Invalid due date.'
                );
            }

            filter.dueDate = {
                $gte: start,
                $lte: end,
            };
        }

        // Filter overdue tasks.
        if (overdue === 'true') {
            filter.dueDate = {
                $lt: new Date(),
            };

            filter.status = {
                $ne: 'Completed',
            };
        }

        const currentPage = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const pageLimit = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 20)
        );

        const skip = (currentPage - 1) * pageLimit;

        const sortField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const sortOrder = order === 'asc' ? 1 : -1;

        const [tasks, totalTasks] = await Promise.all([
            Task.find(filter)
                .populate('assignedTo', 'fullName email role')
                .populate('createdBy', 'fullName email role')
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(pageLimit)
                .lean(),

            Task.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: tasks.length,
            total: totalTasks,
            pagination: {
                currentPage,
                totalPages: Math.ceil(totalTasks / pageLimit),
                pageSize: pageLimit,
            },
            data: tasks,
        });
    } catch (error) {
        console.error('Get tasks error:', error);

        return sendError(
            res,
            500,
            'Unable to retrieve tasks.'
        );
    }
};

// ------------------------------------------------------
// GET SINGLE TASK
// GET /api/tasks/:id
// ------------------------------------------------------

const getTask = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return sendError(
                res,
                400,
                'Invalid task ID.'
            );
        }

        const task = await Task.findById(id)
            .populate('assignedTo', 'fullName email role')
            .populate('createdBy', 'fullName email role')
            .populate('updatedBy', 'fullName email role')
            .populate('comments.user', 'fullName email');

        if (!task) {
            return sendError(
                res,
                404,
                'Task not found.'
            );
        }

        return res.status(200).json({
            success: true,
            data: task,
        });
    } catch (error) {
        console.error('Get task error:', error);

        return sendError(
            res,
            500,
            'Unable to retrieve task details.'
        );
    }
};

// ------------------------------------------------------
// CREATE TASK
// POST /api/tasks
// ------------------------------------------------------

const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            tags,
            assignedTo,
            priority,
            status,
            startDate,
            dueDate,
        } = req.body;

        if (!title || !title.trim()) {
            return sendError(
                res,
                400,
                'Task title is required.'
            );
        }

        if (!dueDate) {
            return sendError(
                res,
                400,
                'Task due date is required.'
            );
        }

        const parsedDueDate = new Date(dueDate);

        if (Number.isNaN(parsedDueDate.getTime())) {
            return sendError(
                res,
                400,
                'Invalid task due date.'
            );
        }

        const parsedStartDate = startDate
            ? new Date(startDate)
            : new Date();

        if (Number.isNaN(parsedStartDate.getTime())) {
            return sendError(
                res,
                400,
                'Invalid task start date.'
            );
        }

        if (parsedDueDate < parsedStartDate) {
            return sendError(
                res,
                400,
                'Due date cannot be earlier than the start date.'
            );
        }

        if (priority && !validPriorities.includes(priority)) {
            return sendError(
                res,
                400,
                'Invalid task priority.'
            );
        }

        if (status && !validStatuses.includes(status)) {
            return sendError(
                res,
                400,
                'Invalid task status.'
            );
        }

        // Validate assigned employee.
        if (assignedTo) {
            if (!isValidObjectId(assignedTo)) {
                return sendError(
                    res,
                    400,
                    'Invalid assigned employee ID.'
                );
            }

            const employee = await User.findOne({
                _id: assignedTo,
                role: 'Staff',
                status: 'Active',
            });

            if (!employee) {
                return sendError(
                    res,
                    404,
                    'Active staff member not found.'
                );
            }
        }

        const task = await Task.create({
            title: title.trim(),
            description,
            category,
            tags: Array.isArray(tags) ? tags : [],
            assignedTo: assignedTo || null,
            createdBy: req.user._id,
            priority: priority || 'Medium',
            status: status || 'Pending',
            startDate: parsedStartDate,
            dueDate: parsedDueDate,
        });

        const createdTask = await Task.findById(task._id)
            .populate('assignedTo', 'fullName email role')
            .populate('createdBy', 'fullName email role');

        // Send notification to the assigned staff member.
        if (createdTask.assignedTo?._id) {
            await notifyUsers({
                userIds: [createdTask.assignedTo._id],
                actorId: req.user._id,
                title: 'New Task Assigned',
                description: `You have been assigned the task "${createdTask.title}" (${createdTask.taskId}).`,
                type: 'Task',
                priority: createdTask.priority === 'Critical' ||
                    createdTask.priority === 'High'
                    ? 'High'
                    : 'Medium',
                relatedEntity: 'Task',
                relatedEntityId: createdTask._id,
                metadata: {
                    taskId: createdTask.taskId,
                    taskTitle: createdTask.title,
                    status: createdTask.status,
                },
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Task created successfully.',
            data: createdTask,
        });

        return res.status(201).json({
            success: true,
            message: 'Task created successfully.',
            data: createdTask,
        });
    } catch (error) {
        console.error('Create task error:', error);

        if (error.name === 'ValidationError') {
            return sendError(
                res,
                400,
                error.message
            );
        }

        if (error.code === 11000) {
            return sendError(
                res,
                409,
                'A task with this reference already exists. Please try again.'
            );
        }

        return sendError(
            res,
            500,
            'Unable to create task.'
        );
    }
};

// ------------------------------------------------------
// UPDATE TASK
// PUT /api/tasks/:id
// ------------------------------------------------------

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return sendError(
                res,
                400,
                'Invalid task ID.'
            );
        }

        const task = await Task.findById(id);

        if (!task) {
            return sendError(
                res,
                404,
                'Task not found.'
            );
        }

        // Preserve previous values for notification checks.
        const previousStatus = task.status;
        const previousAssignedTo = task.assignedTo?.toString() || null;

        const allowedFields = [
            'title',
            'description',
            'category',
            'tags',
            'priority',
            'status',
            'progress',
            'startDate',
            'dueDate',
            'assignedTo',
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                task[field] = req.body[field];
            }
        }

        // Validate title.
        if (!task.title || !task.title.trim()) {
            return sendError(
                res,
                400,
                'Task title is required.'
            );
        }

        task.title = task.title.trim();

        // Validate priority and status.
        if (!validPriorities.includes(task.priority)) {
            return sendError(
                res,
                400,
                'Invalid task priority.'
            );
        }

        if (!validStatuses.includes(task.status)) {
            return sendError(
                res,
                400,
                'Invalid task status.'
            );
        }

        // Validate progress.
        if (
            !Number.isFinite(Number(task.progress)) ||
            Number(task.progress) < 0 ||
            Number(task.progress) > 100
        ) {
            return sendError(
                res,
                400,
                'Progress must be between 0 and 100.'
            );
        }

        task.progress = Number(task.progress);

        // Validate dates.
        if (
            !task.startDate ||
            Number.isNaN(new Date(task.startDate).getTime())
        ) {
            return sendError(
                res,
                400,
                'Invalid task start date.'
            );
        }

        if (
            !task.dueDate ||
            Number.isNaN(new Date(task.dueDate).getTime())
        ) {
            return sendError(
                res,
                400,
                'Invalid task due date.'
            );
        }

        if (new Date(task.dueDate) < new Date(task.startDate)) {
            return sendError(
                res,
                400,
                'Due date cannot be earlier than the start date.'
            );
        }

        // Validate assigned employee.
        if (task.assignedTo) {
            if (!isValidObjectId(task.assignedTo)) {
                return sendError(
                    res,
                    400,
                    'Invalid assigned employee ID.'
                );
            }

            const employee = await User.findOne({
                _id: task.assignedTo,
                role: 'Staff',
                status: 'Active',
            });

            if (!employee) {
                return sendError(
                    res,
                    404,
                    'Active staff member not found.'
                );
            }
        }

        task.updatedBy = req.user._id;

        await task.save();

        // ------------------------------------------------------
        // NOTIFICATIONS
        // ------------------------------------------------------

        const currentAssignedTo = task.assignedTo?.toString() || null;

        // Notify a newly assigned staff member.
        if (
            currentAssignedTo &&
            currentAssignedTo !== previousAssignedTo
        ) {
            await notifyUsers({
                userIds: [currentAssignedTo],
                actorId: req.user._id,
                title: 'New Task Assigned',
                description: `You have been assigned the task "${task.title}" (${task.taskId}).`,
                type: 'Task',
                priority: task.priority === 'Critical' ||
                    task.priority === 'High'
                    ? 'High'
                    : 'Medium',
                relatedEntity: 'Task',
                relatedEntityId: task._id,
                metadata: {
                    taskId: task.taskId,
                    taskTitle: task.title,
                    status: task.status,
                },
            });
        }

        // Notify the task creator and assignee when the status changes.
        if (task.status !== previousStatus) {
            await notifyUsers({
                userIds: [task.createdBy, task.assignedTo],
                actorId: req.user._id,
                title: 'Task Status Updated',
                description: `Task "${task.title}" (${task.taskId}) is now ${task.status}.`,
                type: 'Task',
                priority: task.priority === 'Critical' ||
                    task.priority === 'High'
                    ? 'High'
                    : 'Medium',
                relatedEntity: 'Task',
                relatedEntityId: task._id,
                metadata: {
                    taskId: task.taskId,
                    taskTitle: task.title,
                    previousStatus,
                    status: task.status,
                },
            });
        }

        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'fullName email role')
            .populate('createdBy', 'fullName email role')
            .populate('updatedBy', 'fullName email role');

        return res.status(200).json({
            success: true,
            message: 'Task updated successfully.',
            data: updatedTask,
        });
    } catch (error) {
        console.error('Update task error:', error);

        if (error.name === 'ValidationError') {
            return sendError(
                res,
                400,
                error.message
            );
        }

        return sendError(
            res,
            500,
            'Unable to update task.'
        );
    }
};

// ------------------------------------------------------
// UPDATE TASK STATUS
// PATCH /api/tasks/:id/status
// ------------------------------------------------------

const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress } = req.body;

        if (!isValidObjectId(id)) {
            return sendError(
                res,
                400,
                'Invalid task ID.'
            );
        }

        if (!status || !validStatuses.includes(status)) {
            return sendError(
                res,
                400,
                'A valid task status is required.'
            );
        }

        const task = await Task.findById(id);

        if (!task) {
            return sendError(
                res,
                404,
                'Task not found.'
            );
        }

        // Preserve previous status for notification.
        const previousStatus = task.status;

        task.status = status;

        if (progress !== undefined) {
            const parsedProgress = Number(progress);

            if (
                !Number.isFinite(parsedProgress) ||
                parsedProgress < 0 ||
                parsedProgress > 100
            ) {
                return sendError(
                    res,
                    400,
                    'Progress must be between 0 and 100.'
                );
            }

            task.progress = parsedProgress;
        }

        if (status === 'Completed') {
            task.progress = 100;
        } else if (status === 'Pending') {
            task.progress = 0;
        } else if (
            status === 'In Progress' &&
            task.progress === 100
        ) {
            task.progress = 50;
        }

        task.updatedBy = req.user._id;

        await task.save();

        // ------------------------------------------------------
        // NOTIFICATION: TASK STATUS UPDATED
        // ------------------------------------------------------

        if (task.status !== previousStatus) {
            await notifyUsers({
                userIds: [task.createdBy, task.assignedTo],
                actorId: req.user._id,
                title: 'Task Status Updated',
                description: `Task "${task.title}" (${task.taskId}) is now ${task.status}.`,
                type: 'Task',
                priority: task.priority === 'Critical' ||
                    task.priority === 'High'
                    ? 'High'
                    : 'Medium',
                relatedEntity: 'Task',
                relatedEntityId: task._id,
                metadata: {
                    taskId: task.taskId,
                    taskTitle: task.title,
                    previousStatus,
                    status: task.status,
                },
            });
        }

        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'fullName email role')
            .populate('createdBy', 'fullName email role');

        return res.status(200).json({
            success: true,
            message: 'Task status updated successfully.',
            data: updatedTask,
        });
    } catch (error) {
        console.error('Update task status error:', error);

        return sendError(
            res,
            500,
            'Unable to update task status.'
        );
    }
};

// ------------------------------------------------------
// ADD TASK COMMENT
// POST /api/tasks/:id/comments
// ------------------------------------------------------

const addTaskComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!isValidObjectId(id)) {
            return sendError(
                res,
                400,
                'Invalid task ID.'
            );
        }

        if (!message || !message.trim()) {
            return sendError(
                res,
                400,
                'Comment message is required.'
            );
        }

        const task = await Task.findById(id);

        if (!task) {
            return sendError(
                res,
                404,
                'Task not found.'
            );
        }

        task.comments.push({
            user: req.user._id,
            message: message.trim(),
        });

        task.updatedBy = req.user._id;

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('comments.user', 'fullName email')
            .populate('assignedTo', 'fullName email role')
            .populate('createdBy', 'fullName email role');

        return res.status(201).json({
            success: true,
            message: 'Comment added successfully.',
            data: updatedTask,
        });
    } catch (error) {
        console.error('Add task comment error:', error);

        if (error.name === 'ValidationError') {
            return sendError(
                res,
                400,
                error.message
            );
        }

        return sendError(
            res,
            500,
            'Unable to add task comment.'
        );
    }
};

// ------------------------------------------------------
// DELETE TASK
// DELETE /api/tasks/:id
// ------------------------------------------------------

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return sendError(
                res,
                400,
                'Invalid task ID.'
            );
        }

        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return sendError(
                res,
                404,
                'Task not found.'
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully.',
            data: {
                _id: task._id,
                taskId: task.taskId,
            },
        });
    } catch (error) {
        console.error('Delete task error:', error);

        return sendError(
            res,
            500,
            'Unable to delete task.'
        );
    }
};

// ------------------------------------------------------
// GET TASK DASHBOARD STATISTICS
// GET /api/tasks/stats
// ------------------------------------------------------

const getTaskStats = async (req, res) => {
    try {
        const now = new Date();

        const [
            totalTasks,
            pendingTasks,
            inProgressTasks,
            reviewTasks,
            completedTasks,
            overdueTasks,
            highPriorityTasks,
            recentTasks,
            upcomingDeadlines,
            workload,
        ] = await Promise.all([
            Task.countDocuments(),

            Task.countDocuments({
                status: 'Pending',
            }),

            Task.countDocuments({
                status: 'In Progress',
            }),

            Task.countDocuments({
                status: 'Review',
            }),

            Task.countDocuments({
                status: 'Completed',
            }),

            Task.countDocuments({
                dueDate: { $lt: now },
                status: { $ne: 'Completed' },
            }),

            Task.countDocuments({
                priority: { $in: ['High', 'Critical'] },
                status: { $ne: 'Completed' },
            }),

            Task.find()
                .sort({ updatedAt: -1 })
                .limit(5)
                .populate('assignedTo', 'fullName email')
                .populate('updatedBy', 'fullName email')
                .lean(),

            Task.find({
                dueDate: { $gte: now },
                status: { $ne: 'Completed' },
            })
                .sort({ dueDate: 1 })
                .limit(5)
                .populate('assignedTo', 'fullName email')
                .lean(),

            Task.aggregate([
                {
                    $match: {
                        assignedTo: { $ne: null },
                    },
                },
                {
                    $group: {
                        _id: '$assignedTo',
                        totalTasks: { $sum: 1 },
                        completedTasks: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'Completed'] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        activeTasks: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            '$status',
                                            ['In Progress', 'Review'],
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        pendingTasks: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'Pending'] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'employee',
                    },
                },
                {
                    $unwind: '$employee',
                },
                {
                    $project: {
                        _id: 0,
                        employeeId: '$_id',
                        name: '$employee.fullName',
                        email: '$employee.email',
                        totalTasks: 1,
                        completedTasks: 1,
                        activeTasks: 1,
                        pendingTasks: 1,
                        completionRate: {
                            $cond: [
                                { $gt: ['$totalTasks', 0] },
                                {
                                    $round: [
                                        {
                                            $multiply: [
                                                {
                                                    $divide: [
                                                        '$completedTasks',
                                                        '$totalTasks',
                                                    ],
                                                },
                                                100,
                                            ],
                                        },
                                        0,
                                    ],
                                },
                                0,
                            ],
                        },
                    },
                },
                {
                    $sort: {
                        totalTasks: -1,
                    },
                },
            ]),
        ]);

        const averageWorkload = workload.length
            ? Math.round(
                workload.reduce(
                    (total, member) => total + member.totalTasks,
                    0
                ) / workload.length
            )
            : 0;

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalTasks,
                    pendingTasks,
                    inProgressTasks,
                    reviewTasks,
                    completedTasks,
                    overdueTasks,
                    highPriorityTasks,
                    completionRate: totalTasks
                        ? Math.round(
                            (completedTasks / totalTasks) * 100
                        )
                        : 0,
                },
                workload: {
                    members: workload,
                    totalMembers: workload.length,
                    averageTasksPerMember: averageWorkload,
                },
                recentTasks,
                upcomingDeadlines,
            },
        });
    } catch (error) {
        console.error('Get task statistics error:', error);

        return sendError(
            res,
            500,
            'Unable to retrieve task statistics.'
        );
    }
};

module.exports = {
    getTaskAssignees,
    getTasks,
    getTask,
    createTask,
    updateTask,
    updateTaskStatus,
    addTaskComment,
    deleteTask,
    getTaskStats,
};
