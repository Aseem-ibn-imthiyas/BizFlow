
const express = require('express')
const mongoose = require('mongoose')
const Workflow = require('../models/Workflow')

const { requireAuth, requireRole } = require('../middleware/auth')
const { requirePermission } = require('../middleware/requirePermission')

const router = express.Router()

// All workflow endpoints require an authenticated Administrator or Manager.
router.use(
    requireAuth,
    requireRole('Administrator', 'Manager')
)

// Remove React-only properties before saving workflow steps.
function sanitizeWorkflowSteps(steps) {
    if (!Array.isArray(steps)) {
        return steps
    }

    return steps.map((step) => {
        if (!step || typeof step !== 'object') {
            return step
        }

        const { icon, ...savedStep } = step
        return savedStep
    })
}

// Validate a MongoDB workflow ID.
function validateWorkflowId(req, res, next) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid workflow ID.',
        })
    }

    next()
}

// Validate workflow details before saving or publishing.
function validateWorkflowDetails({
    workflowName,
    workflowDescription,
    workflowCategory,
}) {
    if (
        typeof workflowName !== 'string' ||
        workflowName.trim().length < 3 ||
        workflowName.trim().length > 80
    ) {
        return 'Workflow name must contain 3–80 characters.'
    }

    if (
        typeof workflowDescription !== 'string' ||
        workflowDescription.length > 500
    ) {
        return 'Description cannot exceed 500 characters.'
    }

    if (
        typeof workflowCategory !== 'string' ||
        !workflowCategory.trim()
    ) {
        return 'Workflow category is required.'
    }

    return ''
}

// Validate workflow steps before publishing.
function validateWorkflowSteps(workflowSteps) {
    if (
        !Array.isArray(workflowSteps) ||
        workflowSteps.length < 1 ||
        workflowSteps.length > 20
    ) {
        return 'A workflow must contain 1–20 steps.'
    }

    const firstStepType = String(
        workflowSteps[0]?.typeKey ||
        workflowSteps[0]?.type ||
        ''
    ).toLowerCase()

    if (firstStepType !== 'trigger') {
        return 'The first workflow step must be a trigger.'
    }

    for (let index = 0; index < workflowSteps.length; index += 1) {
        const step = workflowSteps[index]
        const type = String(
            step?.typeKey || step?.type || ''
        ).toLowerCase()

        const config = step?.config || {}

        let valid = false

        switch (type) {
            case 'trigger':
                valid =
                    typeof config.event === 'string' &&
                    Boolean(config.event.trim()) &&
                    typeof config.entity === 'string' &&
                    Boolean(config.entity.trim())
                break

            case 'condition':
                valid =
                    typeof config.condition === 'string' &&
                    Boolean(config.condition.trim())
                break

            case 'action':
                valid =
                    typeof config.actionType === 'string' &&
                    Boolean(config.actionType.trim())
                break

            case 'approval':
                valid = Boolean(
                    typeof config.approverRole === 'string' &&
                    config.approverRole.trim() &&
                    typeof config.approvalPolicy === 'string' &&
                    config.approvalPolicy.trim() &&
                    Number(config.slaHours) > 0 &&
                    Number(config.reminderHours) > 0
                )
                break

            case 'notification':
                valid = Boolean(
                    typeof config.channel === 'string' &&
                    config.channel.trim() &&
                    typeof config.message === 'string' &&
                    config.message.trim()
                )
                break

            case 'delay':
                valid = Boolean(
                    Number.isFinite(Number(config.delayValue)) &&
                    Number(config.delayValue) > 0 &&
                    typeof config.delayUnit === 'string' &&
                    config.delayUnit.trim()
                )
                break

            default:
                valid = false
        }

        if (!valid) {
            return `Step ${index + 1} has missing or invalid configuration.`
        }
    }

    return ''
}

// POST /api/workflows
// Create a workflow draft.
router.post(
    '/',
    requirePermission('Workflow Automation', 'C'),
    async (req, res) => {
        try {
            const {
                workflowName,
                workflowDescription,
                workflowCategory,
                workflowSteps,
            } = req.body

            const detailsError = validateWorkflowDetails({
                workflowName,
                workflowDescription,
                workflowCategory,
            })

            if (detailsError) {
                return res.status(400).json({
                    success: false,
                    message: detailsError,
                })
            }

            if (
                workflowSteps !== undefined &&
                !Array.isArray(workflowSteps)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Workflow steps must be an array.',
                })
            }

            const workflow = await Workflow.create({
                workflowName: workflowName.trim(),
                workflowDescription: workflowDescription.trim(),
                workflowCategory: workflowCategory.trim(),
                workflowSteps: sanitizeWorkflowSteps(
                    workflowSteps || []
                ),
                status: 'Draft',
            })

            return res.status(201).json({
                success: true,
                message: 'Workflow draft saved to MongoDB.',
                workflow,
            })
        } catch (error) {
            console.error('Create workflow error:', error)

            return res.status(400).json({
                success: false,
                message: error.message,
            })
        }
    }
)

// GET /api/workflows
// Retrieve all workflows.
router.get(
    '/',
    requirePermission('Workflow Automation', 'V'),
    async (req, res) => {
        try {
            const workflows = await Workflow.find({})
                .sort({ updatedAt: -1 })

            return res.status(200).json({
                success: true,
                workflows,
            })
        } catch (error) {
            console.error('Error retrieving workflows:', error)

            return res.status(500).json({
                success: false,
                message: 'Unable to retrieve workflows.',
            })
        }
    }
)

// GET /api/workflows/:id
// Retrieve one workflow.
router.get(
    '/:id',
    requirePermission('Workflow Automation', 'V'),
    validateWorkflowId,
    async (req, res) => {
        try {
            const workflow = await Workflow.findById(req.params.id)

            if (!workflow) {
                return res.status(404).json({
                    success: false,
                    message: 'Workflow not found.',
                })
            }

            return res.status(200).json({
                success: true,
                workflow,
            })
        } catch (error) {
            console.error('Get workflow error:', error)

            return res.status(500).json({
                success: false,
                message: error.message,
            })
        }
    }
)

// PUT /api/workflows/:id
// Update an existing workflow draft.
router.put(
    '/:id',
    requirePermission('Workflow Automation', 'E'),
    validateWorkflowId,
    async (req, res) => {
        try {
            const {
                workflowName,
                workflowDescription,
                workflowCategory,
                workflowSteps,
            } = req.body

            const detailsError = validateWorkflowDetails({
                workflowName,
                workflowDescription,
                workflowCategory,
            })

            if (detailsError) {
                return res.status(400).json({
                    success: false,
                    message: detailsError,
                })
            }

            if (!Array.isArray(workflowSteps)) {
                return res.status(400).json({
                    success: false,
                    message: 'Workflow steps must be an array.',
                })
            }

            const workflow = await Workflow.findOne({
                _id: req.params.id,
                status: 'Draft',
            })

            if (!workflow) {
                return res.status(404).json({
                    success: false,
                    message: 'Draft not found or cannot be edited.',
                })
            }

            workflow.workflowName = workflowName.trim()
            workflow.workflowDescription = workflowDescription.trim()
            workflow.workflowCategory = workflowCategory.trim()
            workflow.workflowSteps = sanitizeWorkflowSteps(workflowSteps)

            await workflow.save()

            return res.status(200).json({
                success: true,
                message: 'Workflow draft updated in MongoDB.',
                workflow,
            })
        } catch (error) {
            console.error('Update workflow error:', error)

            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                })
            }

            return res.status(400).json({
                success: false,
                message: error.message,
            })
        }
    }
)

// DELETE /api/workflows/:id
// Delete a workflow draft.
router.delete(
    '/:id',
    requirePermission('Workflow Automation', 'D'),
    validateWorkflowId,
    async (req, res) => {
        try {
            const workflow = await Workflow.findOneAndDelete({
                _id: req.params.id,
                status: 'Draft',
            })

            if (!workflow) {
                return res.status(404).json({
                    success: false,
                    message: 'Draft not found.',
                })
            }

            return res.status(200).json({
                success: true,
                message: 'Workflow draft deleted.',
            })
        } catch (error) {
            console.error('Delete workflow error:', error)

            return res.status(500).json({
                success: false,
                message: error.message,
            })
        }
    }
)

// POST /api/workflows/:id/publish
// Validate and publish an existing draft.
router.post(
    '/:id/publish',
    requirePermission('Workflow Automation', 'E'),
    validateWorkflowId,
    async (req, res) => {
        try {
            const {
                workflowName,
                workflowDescription,
                workflowCategory,
                workflowSteps,
            } = req.body

            const detailsError = validateWorkflowDetails({
                workflowName,
                workflowDescription,
                workflowCategory,
            })

            if (detailsError) {
                return res.status(400).json({
                    success: false,
                    message: detailsError,
                })
            }

            if (
                typeof workflowDescription !== 'string' ||
                !workflowDescription.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'A description is required before publishing.',
                })
            }

            const stepsError = validateWorkflowSteps(workflowSteps)

            if (stepsError) {
                return res.status(400).json({
                    success: false,
                    message: stepsError,
                })
            }

            const workflow = await Workflow.findOne({
                _id: req.params.id,
                status: 'Draft',
            })

            if (!workflow) {
                return res.status(404).json({
                    success: false,
                    message: 'Draft not found or cannot be published.',
                })
            }

            workflow.workflowName = workflowName.trim()
            workflow.workflowDescription = workflowDescription.trim()
            workflow.workflowCategory = workflowCategory.trim()
            workflow.workflowSteps = sanitizeWorkflowSteps(workflowSteps)
            workflow.status = 'Published'

            await workflow.save()

            return res.status(200).json({
                success: true,
                message: 'Workflow published successfully.',
                workflow,
            })
        } catch (error) {
            console.error('Publish workflow error:', error)

            if (
                error.name === 'CastError' ||
                error.name === 'ValidationError'
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                })
            }

            return res.status(500).json({
                success: false,
                message: 'Unable to publish workflow.',
            })
        }
    }
)

module.exports = router
