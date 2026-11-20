
const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/requirePermission');

const {
    getTaskAssignees,
    getTasks,
    getTask,
    createTask,
    updateTask,
    updateTaskStatus,
    addTaskComment,
    deleteTask,
    getTaskStats,
} = require('../controllers/taskController');

// All task routes require authentication.
router.use(requireAuth);

// ------------------------------------------------------
// TASK ROUTES
// ------------------------------------------------------

// Dashboard statistics
router.get(
    '/stats',
    requirePermission('Task Management', 'V'),
    getTaskStats
);

// Employees available for task assignment
router.get(
    '/assignees',
    requirePermission('Task Management', 'V'),
    getTaskAssignees
);

// Retrieve all tasks with search and filters
router.get(
    '/',
    requirePermission('Task Management', 'V'),
    getTasks
);

// Create a task
router.post(
    '/',
    requirePermission('Task Management', 'C'),
    createTask
);

// Retrieve a single task
router.get(
    '/:id',
    requirePermission('Task Management', 'V'),
    getTask
);

// Update task information
router.put(
    '/:id',
    requirePermission('Task Management', 'E'),
    updateTask
);

// Update task status and progress
router.patch(
    '/:id/status',
    requirePermission('Task Management', 'E'),
    updateTaskStatus
);

// Add a task comment
router.post(
    '/:id/comments',
    requirePermission('Task Management', 'E'),
    addTaskComment
);

// Delete a task
router.delete(
    '/:id',
    requirePermission('Task Management', 'D'),
    deleteTask
);

module.exports = router;
