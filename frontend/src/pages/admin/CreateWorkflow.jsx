import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, CircleHelp, Search, Save, Eye, Play, ChevronDown, Plus, Zap, GitBranch, ShieldCheck, BellRing, Settings2, Clock3, CheckCircle2, Undo2, Redo2, Maximize2, Trash2, } from 'lucide-react'
import AdminSidebar from '../../components/sidebar/AdminSidebar'


function CreateWorkflow() {

    const [workflowName, setWorkflowName] = useState(
        'Customer Order & Approval Flow'
    )

    const [workflowDescription, setWorkflowDescription] = useState(
        'Automates customer order validation, conditional high-value order approval, inventory reservation, and multi-channel customer confirmation notifications.'
    )

    const [workflowCategory, setWorkflowCategory] = useState(
        'Sales & Operations'
    )


    const [configurationErrors, setConfigurationErrors] = useState({})
    const [configurationTouched, setConfigurationTouched] = useState({})

    const [searchParams] = useSearchParams()
    const editId = searchParams.get('editId')


    const getConfigurationError = (field, value) => {
        switch (field) {
            case 'workflowName':
                if (!value.trim()) {
                    return 'Workflow name is required.'
                }

                if (value.trim().length < 3) {
                    return 'Workflow name must be at least 3 characters.'
                }

                if (value.trim().length > 80) {
                    return 'Workflow name cannot exceed 80 characters.'
                }

                return ''

            case 'workflowDescription':
                if (value.length > 500) {
                    return 'Description cannot exceed 500 characters.'
                }

                return ''

            case 'workflowCategory':
                if (!value) {
                    return 'Please select a workflow category.'
                }

                return ''

            default:
                return ''
        }
    }

    const updateConfigurationField = (field, value, setter) => {
        setter(value)

        if (configurationTouched[field] || configurationErrors[field]) {
            setConfigurationErrors((previous) => ({
                ...previous,
                [field]: getConfigurationError(field, value),
            }))
        }
    }

    const touchConfigurationField = (field, value) => {
        setConfigurationTouched((previous) => ({
            ...previous,
            [field]: true,
        }))

        setConfigurationErrors((previous) => ({
            ...previous,
            [field]: getConfigurationError(field, value),
        }))
    }

    const validateWorkflowConfiguration = () => {
        const errors = {
            workflowName: getConfigurationError(
                'workflowName',
                workflowName
            ),
            workflowDescription: getConfigurationError(
                'workflowDescription',
                workflowDescription
            ),
            workflowCategory: getConfigurationError(
                'workflowCategory',
                workflowCategory
            ),
        }

        setConfigurationErrors(errors)

        setConfigurationTouched({
            workflowName: true,
            workflowDescription: true,
            workflowCategory: true,
        })

        return Object.values(errors).every((error) => !error)
    }


    const createInitialSteps = () => [
        {
            id: 'trigger-1',
            number: 1,
            type: 'TRIGGER',
            typeKey: 'trigger',
            typeClass: 'bg-blue-50 text-blue-700',
            icon: Zap,
            iconClass: 'bg-blue-100 text-blue-700',
            title: 'Customer Order Created',
            description: 'Entity: Sales.Orders • Event: Order_Placed',
            status: 'Configured',
            config: {
                event: 'Order_Placed',
                entity: 'Sales.Orders',
            },
        },
        {
            id: 'condition-1',
            number: 2,
            type: 'CONDITION RULE',
            typeKey: 'condition',
            typeClass: 'bg-slate-100 text-slate-700',
            icon: GitBranch,
            iconClass: 'bg-slate-100 text-slate-700',
            title: 'High-Value Threshold Check',
            description: 'Routes orders based on the configured condition.',
            status: 'Configured',
            config: {
                condition: 'order.total > 10000',
            },
        },
        {
            id: 'approval-1',
            number: 3,
            type: 'APPROVAL GATE',
            typeKey: 'approval',
            typeClass: 'bg-blue-50 text-blue-700',
            icon: ShieldCheck,
            iconClass: 'bg-blue-100 text-blue-700',
            title: 'Executive & Finance Sign-Off',
            description: 'Approvers: Department Manager & Finance Lead',
            status: 'Configured',
            config: {
                approverRole: 'Department Manager & Finance Lead',
                approvalPolicy: 'Sequential Sign-Off (Both required)',
                slaHours: '24',
                reminderHours: '4',
            },
        },
        {
            id: 'notification-1',
            number: 4,
            type: 'NOTIFICATION',
            typeKey: 'notification',
            typeClass: 'bg-slate-100 text-slate-700',
            icon: BellRing,
            iconClass: 'bg-slate-100 text-slate-700',
            title: 'Customer Confirmation',
            description: 'Notification configuration is ready to edit.',
            status: 'Configured',
            config: {
                channel: 'Email',
                message: 'Your order has been processed.',
            },
        },
    ]

    const [isPublishing, setIsPublishing] = useState(false)
    const [workflowStatus, setWorkflowStatus] = useState('Draft')
    const [workflowSteps, setWorkflowSteps] = useState(() => createInitialSteps())
    const [selectedStepId, setSelectedStepId] = useState('approval-1')
    const [stepMessage, setStepMessage] = useState('')
    const [workflowId, setWorkflowId] = useState(null)
    const [isSavingDraft, setIsSavingDraft] = useState(false)
    const [isLoadingDraft, setIsLoadingDraft] = useState(true)

    const getStepIcon = (typeKey) => {
        switch (typeKey) {
            case 'condition':
                return GitBranch
            case 'approval':
                return ShieldCheck
            case 'notification':
                return BellRing
            case 'delay':
                return Clock3
            case 'trigger':
            case 'action':
            default:
                return Zap
        }
    }

    const validateBeforePublish = () => {
        const errors = []

        if (!workflowName.trim() || workflowName.trim().length < 3) {
            errors.push('Workflow name must contain at least 3 characters.')
        }

        if (workflowName.trim().length > 80) {
            errors.push('Workflow name cannot exceed 80 characters.')
        }

        if (!workflowDescription.trim()) {
            errors.push('Workflow description is required.')
        }

        if (workflowDescription.length > 500) {
            errors.push('Workflow description cannot exceed 500 characters.')
        }

        if (!workflowCategory) {
            errors.push('Please select a workflow category.')
        }

        if (!Array.isArray(workflowSteps) || workflowSteps.length === 0) {
            errors.push('Add at least one workflow step.')
            return errors
        }

        if (workflowSteps.length > 20) {
            errors.push('A workflow cannot contain more than 20 steps.')
        }

        const firstStep = workflowSteps[0]

        if (
            firstStep?.typeKey !== 'trigger' &&
            firstStep?.type?.toLowerCase() !== 'trigger'
        ) {
            errors.push('The first workflow step must be a trigger.')
        }

        workflowSteps.forEach((step, index) => {
            const stepNumber = index + 1
            const type = (
                step.typeKey ||
                step.type ||
                ''
            ).toLowerCase()

            const config = step.config || {}

            if (type === 'trigger') {
                if (!config.event?.trim() || !config.entity?.trim()) {
                    errors.push(
                        `Step ${stepNumber}: Configure the trigger event or entity.`
                    )
                }
            }

            if (type === 'condition') {
                if (!config.condition) {
                    errors.push(
                        `Step ${stepNumber}: Configure the condition.`
                    )
                }
            }

            if (type === 'action') {
                if (!config.actionType) {
                    errors.push(
                        `Step ${stepNumber}: Configure the action type.`
                    )
                }
            }

            if (type === 'approval') {
                if (
                    !config.approverRole ||
                    !config.approvalPolicy ||
                    !config.slaHours ||
                    !config.reminderHours
                ) {
                    errors.push(
                        `Step ${stepNumber}: Complete the approval settings.`
                    )
                }
            }

            if (type === 'notification') {
                if (!config.channel || !config.message) {
                    errors.push(
                        `Step ${stepNumber}: Configure the notification channel and message.`
                    )
                }
            }

            if (type === 'delay') {
                const delayValue = Number(config.delayValue)

                if (
                    !Number.isFinite(delayValue) ||
                    delayValue <= 0 ||
                    !config.delayUnit
                ) {
                    errors.push(
                        `Step ${stepNumber}: Configure a valid delay duration and unit.`
                    )
                }
            }
        })

        return errors
    }


    useEffect(() => {
        const loadDraft = async () => {
            try {
                let workflow

                if (editId) {
                    // EDIT MODE: Load the exact workflow selected in the table.
                    const response = await fetch(
                        `http://localhost:5000/api/workflows/${editId}`
                    )

                    const data = await response.json().catch(() => ({}))

                    if (!response.ok || !data.success || !data.workflow) {
                        throw new Error(
                            data.message || 'Failed to load the selected workflow.'
                        )
                    }

                    workflow = data.workflow
                } else {
                    // CREATE MODE: Load the latest saved Draft.
                    const response = await fetch(
                        'http://localhost:5000/api/workflows'
                    )

                    const data = await response.json().catch(() => ({}))

                    if (!response.ok || !data.success) {
                        throw new Error(
                            data.message || 'Failed to load workflow drafts.'
                        )
                    }

                    const workflows = Array.isArray(data.workflows)
                        ? data.workflows
                        : []

                    workflow = workflows.find(
                        (item) => item.status === 'Draft'
                    )

                    // No saved Draft: keep the form's initial values.
                    if (!workflow) return
                }

                // Populate the form with the selected workflow.
                setWorkflowId(workflow._id)

                setWorkflowName(
                    workflow.workflowName ?? 'Customer Order & Approval Flow'
                )

                setWorkflowDescription(
                    workflow.workflowDescription ?? ''
                )

                setWorkflowCategory(
                    workflow.workflowCategory ?? 'Sales & Operations'
                )

                const restoredSteps = (workflow.workflowSteps ?? []).map(
                    (step) => ({
                        ...step,
                        icon: getStepIcon(step.typeKey),
                        config: step.config ?? {},
                    })
                )

                setWorkflowSteps(
                    restoredSteps.length > 0
                        ? restoredSteps
                        : createInitialSteps()
                )

                setSelectedStepId(
                    restoredSteps.find(
                        (step) => step.typeKey === 'approval'
                    )?.id ??
                    restoredSteps[0]?.id ??
                    'approval-1'
                )

                setStepMessage(
                    editId
                        ? 'Selected workflow loaded for editing.'
                        : 'Saved draft loaded from MongoDB.'
                )
            } catch (error) {
                console.error('Could not load workflow:', error)

                setStepMessage(
                    error.message || 'Could not load the workflow from the server.'
                )
            } finally {
                setIsLoadingDraft(false)
            }
        }

        loadDraft()
    }, [editId])


    const selectedStep =
        workflowSteps.find((step) => step.id === selectedStepId) ??
        workflowSteps[0]


    const handleSaveDraft = async () => {
        if (!validateWorkflowConfiguration()) {
            setStepMessage(
                'Please fix the workflow name, description, or category before saving.'
            )
            return
        }

        setIsSavingDraft(true)
        setStepMessage('')

        try {

            const draft = {
                workflowName: workflowName.trim(),
                workflowDescription: workflowDescription.trim(),
                workflowCategory,
                workflowSteps: workflowSteps.map((step) =>
                    Object.fromEntries(
                        Object.entries(step).filter(([key]) => key !== 'icon')
                    )
                ),
            }


            const isUpdating = Boolean(workflowId)
            const url = isUpdating
                ? `http://localhost:5000/api/workflows/${workflowId}`
                : 'http://localhost:5000/api/workflows'

            const response = await fetch(url, {
                method: isUpdating ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draft),
            })
            const data = await response.json().catch(() => ({}))

            if (!response.ok || !data.success || !data.workflow?._id) {
                throw new Error(data.message || 'Failed to save workflow draft.')
            }

            setWorkflowId(data.workflow._id)
            setWorkflowSteps((data.workflow.workflowSteps ?? []).map((step) => ({
                ...step,
                icon: getStepIcon(step.typeKey),
                config: step.config ?? {},
            })))
            setStepMessage(
                isUpdating
                    ? 'Workflow draft updated in MongoDB successfully.'
                    : 'Workflow draft saved to MongoDB successfully.'
            )
        } catch (error) {
            console.error('Could not save workflow draft:', error)
            setStepMessage(error.message || 'Could not save workflow draft. Check the server.')
        } finally {
            setIsSavingDraft(false)
        }
    }


    const renumberSteps = (steps) =>
        steps.map((step, index) => ({
            ...step,
            number: index + 1,
        }))

    const updateSelectedStep = (field, value) => {
        setWorkflowSteps((previousSteps) =>
            previousSteps.map((step) =>
                step.id === selectedStepId
                    ? {
                        ...step,
                        [field]: value,
                    }
                    : step
            )
        )
    }

    const updateSelectedStepConfig = (field, value) => {
        setWorkflowSteps((previousSteps) =>
            previousSteps.map((step) => {
                if (step.id !== selectedStepId) {
                    return step
                }

                return {
                    ...step,
                    config: {
                        ...step.config,
                        [field]: value,
                    },
                    status: 'Configured',
                }
            })
        )
    }

    const addWorkflowStep = (typeKey) => {
        const definitions = {
            action: {
                type: 'ACTION',
                typeClass: 'bg-blue-50 text-blue-700',
                icon: Zap,
                iconClass: 'bg-blue-100 text-blue-700',
                title: 'New Action',
                description: 'Configure the action for this workflow.',
                config: { actionType: 'Update Record' },
            },
            condition: {
                type: 'CONDITION RULE',
                typeClass: 'bg-slate-100 text-slate-700',
                icon: GitBranch,
                iconClass: 'bg-slate-100 text-slate-700',
                title: 'New Condition',
                description: 'Configure the routing condition.',
                config: { condition: '' },
            },
            notification: {
                type: 'NOTIFICATION',
                typeClass: 'bg-blue-50 text-blue-700',
                icon: BellRing,
                iconClass: 'bg-blue-100 text-blue-700',
                title: 'New Notification',
                description: 'Configure the notification message.',
                config: {
                    channel: 'Email',
                    message: '',
                },
            },
            approval: {
                type: 'APPROVAL GATE',
                typeClass: 'bg-blue-50 text-blue-700',
                icon: ShieldCheck,
                iconClass: 'bg-blue-100 text-blue-700',
                title: 'New Approval',
                description: 'Configure the approval requirements.',
                config: {
                    approverRole: 'Department Manager',
                    approvalPolicy: 'Single Approver',
                    slaHours: '24',
                    reminderHours: '4',
                },
            },
            delay: {
                type: 'DELAY',
                typeClass: 'bg-slate-100 text-slate-700',
                typeKey: 'delay',
                icon: Clock3,
                iconClass: 'bg-slate-100 text-slate-700',
                title: 'Wait Before Continuing',
                description: 'Configure how long the workflow should wait.',
                config: {
                    delayValue: '1',
                    delayUnit: 'Hours',
                },
            },
        }

        const definition = definitions[typeKey]

        if (!definition) {
            return
        }

        if (workflowSteps.length >= 20) {
            setStepMessage('A workflow can contain up to 20 steps.')
            return
        }

        const id = `${typeKey}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`

        const newStep = {
            ...definition,
            id,
            typeKey,
            number: workflowSteps.length + 1,
            status: 'Needs configuration',
            config: { ...definition.config },
        }

        setWorkflowSteps((previousSteps) => [
            ...previousSteps,
            newStep,
        ])
        setSelectedStepId(id)
        setStepMessage(`${definition.title} added. Configure it in the inspector.`)
    }

    const removeWorkflowStep = (stepId) => {
        const target = workflowSteps.find((step) => step.id === stepId)

        if (!target) return

        if (target.typeKey === 'trigger') {
            setStepMessage('The starting trigger cannot be removed.')
            return
        }

        const remainingSteps = renumberSteps(
            workflowSteps.filter((step) => step.id !== stepId)
        )

        setWorkflowSteps(remainingSteps)

        if (selectedStepId === stepId) {
            setSelectedStepId(
                remainingSteps.find((step) => step.typeKey === 'trigger')?.id ??
                remainingSteps[0]?.id ??
                ''
            )
        }

        setStepMessage(`${target.title} removed from the draft.`)
    }



    const handlePublishWorkflow = async () => {
        if (isPublishing || isSavingDraft || isLoadingDraft) {
            return
        }

        // Validate the workflow name, description, and category.
        const configurationIsValid = validateWorkflowConfiguration()

        if (!configurationIsValid) {
            setStepMessage(
                'Please fix the workflow name, description, or category before publishing.'
            )
            return
        }

        // Validate the steps using the validation function you added.
        const errors = validateBeforePublish()

        if (errors.length > 0) {
            setStepMessage(errors.join(' '))
            return
        }

        setIsPublishing(true)
        setStepMessage('')

        const payload = {
            workflowName: workflowName.trim(),
            workflowDescription: workflowDescription.trim(),
            workflowCategory,
            // workflowSteps: workflowSteps.map((step) => {
            //     const { icon, ...savedStep } = step
            //     return savedStep
            // }),
            workflowSteps: workflowSteps.map((step) =>
                Object.fromEntries(
                    Object.entries(step).filter(([key]) => key !== 'icon')
                )
            ),
        }

        try {
            let currentWorkflowId = workflowId

            // Create the draft first if this workflow has not been saved yet.
            if (!currentWorkflowId) {
                const createResponse = await fetch(
                    'http://localhost:5000/api/workflows',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ...payload,
                            status: 'Draft',
                        }),
                    }
                )

                const createData = await createResponse.json()

                if (!createResponse.ok || !createData.success) {
                    throw new Error(
                        createData.message || 'Could not save the workflow.'
                    )
                }

                currentWorkflowId = createData.workflow?._id

                if (!currentWorkflowId) {
                    throw new Error(
                        'The server did not return the saved workflow ID.'
                    )
                }

                setWorkflowId(currentWorkflowId)
            }

            // Publish the existing MongoDB document.
            const publishResponse = await fetch(
                `http://localhost:5000/api/workflows/${currentWorkflowId}/publish`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            )

            const publishData = await publishResponse.json()

            if (!publishResponse.ok || !publishData.success) {
                throw new Error(
                    publishData.message || 'Could not publish the workflow.'
                )
            }

            setWorkflowId(
                publishData.workflow?._id || currentWorkflowId
            )
            setWorkflowStatus('Published')
            setStepMessage('Workflow published successfully.')
        } catch (error) {
            console.error('Publish workflow error:', error)

            setStepMessage(
                error.message || 'An error occurred while publishing.'
            )
        } finally {
            setIsPublishing(false)
        }
    }



    const validationItems = [
        'Trigger schema definition verified',
        'Condition routing branches complete',
        'Approval role matrix assigned',
        'Notification template payload parsed',
    ]

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    SIDEBAR
                ====================================================== */}
                <AdminSidebar />

                {/* =====================================================
                    RIGHT SIDE
                ====================================================== */}
                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* =================================================
                        HEADER
                    ================================================== */}
                    <header
                        className="
                            sticky
                            top-0
                            z-20
                            flex
                            h-16
                            shrink-0
                            items-center
                            justify-between
                            border-b
                            border-[#E1E4EA]
                            bg-white
                            px-6
                            lg:px-8
                        "
                    >
                        {/* Search */}
                        <div className="relative w-72">
                            <Search
                                size={16}
                                strokeWidth={1.8}
                                className="
                                    pointer-events-none
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-[#7D8491]
                                "
                            />

                            <input
                                type="text"
                                placeholder="Search users, reports, settings..."
                                className="
                                    h-9
                                    w-full
                                    rounded-md
                                    border
                                    border-transparent
                                    bg-[#F1F3FA]
                                    pl-10
                                    pr-4
                                    text-xs
                                    text-[#343A47]
                                    outline-none
                                    transition
                                    placeholder:text-[#8B919D]
                                    focus:border-[#D4DCF0]
                                    focus:bg-white
                                "
                            />
                        </div>

                        {/* Header Right */}
                        <div className="flex items-center gap-5">

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Bell
                                    size={18}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <button
                                type="button"
                                aria-label="Help"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <CircleHelp
                                    size={18}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <div className="h-7 w-px bg-[#E1E4EA]" />

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-[#242936]">
                                        Admin User
                                    </p>

                                    <p className="text-[9px] font-medium tracking-wide text-[#737A87]">
                                        SYSTEM ADMIN
                                    </p>
                                </div>

                                <div
                                    className="
                                        flex
                                        h-9
                                        w-9
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#DDE5F5]
                                        text-xs
                                        font-semibold
                                        text-[#315A9E]
                                    "
                                >
                                    AU
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* =================================================
                        SCROLLABLE CONTENT
                    ================================================== */}
                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                        "
                    >
                        <div className="px-6 py-7 lg:px-8">

                            {/* =================================================
                                PAGE HEADER
                            ================================================== */}
                            <div className="flex items-start justify-between gap-6">

                                <div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#343A47]">
                                            Create New Workflow
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center gap-3">
                                        <h2
                                            className="
                                                text-2xl
                                                font-bold
                                                tracking-tight
                                                text-[#171B25]
                                            "
                                        >
                                            New Workflow
                                        </h2>

                                        <span
                                            className="
                                                flex
                                                items-center
                                                gap-1.5
                                                rounded-full
                                                bg-[#EEF1F7]
                                                px-2.5
                                                py-1
                                                text-[10px]
                                                font-medium
                                                text-[#59606E]
                                            "
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#8A91A0]" />
                                            {workflowStatus === 'Published' ? 'Published' : 'Draft Mode'}
                                        </span>

                                        <span
                                            className="
                                                rounded
                                                border
                                                border-[#E4E7ED]
                                                bg-white
                                                px-2
                                                py-1
                                                text-[10px]
                                                text-[#747B87]
                                            "
                                        >
                                            ID: {workflowId ? `WF-${String(workflowId).slice(-6).toUpperCase()}` : 'Not saved'}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Build an automated business process by defining
                                        triggers, actions, conditions, and approvals.
                                    </p>
                                </div>

                                {/* Top Actions */}
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={isSavingDraft || isLoadingDraft}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#DCE1EA]
                                            bg-white
                                            px-3
                                            text-xs
                                            font-medium
                                            text-[#343A47]
                                            shadow-sm
                                            transition
                                            hover:bg-[#F8F9FC]
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                        "
                                    >
                                        <Save size={14} />
                                        {isSavingDraft ? 'Saving...' : 'Save Draft'}
                                    </button>

                                    <button
                                        type="button"
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#DCE1EA]
                                            bg-[#EEF2FF]
                                            px-3
                                            text-xs
                                            font-medium
                                            text-[#343A47]
                                            transition
                                            hover:bg-[#E5EAFF]
                                        "
                                    >
                                        <Eye size={14} />
                                        Preview
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handlePublishWorkflow}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0757C9]
                                            px-3
                                            text-xs
                                            font-medium
                                            text-white
                                            shadow-sm
                                            transition
                                            hover:bg-[#004EB8]
                                        "
                                    >
                                        <Play
                                            size={13}
                                            fill="currentColor"
                                        />
                                        Publish Workflow
                                    </button>
                                </div>
                            </div>

                            {/* =================================================
                                MAIN WORKSPACE
                            ================================================== */}
                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">

                                {/* =================================================
                                    LEFT COLUMN
                                ================================================== */}
                                <div className="min-w-0">

                                    {/* General Configuration */}
                                    <section
                                        className="
                                            overflow-hidden
                                            rounded-lg
                                            border
                                            border-[#E2E5EB]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                border-b
                                                border-[#E6E8ED]
                                                px-4
                                                py-3
                                            "
                                        >
                                            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#343A47]">
                                                <Settings2
                                                    size={14}
                                                    className="text-[#0757C9]"
                                                />
                                                General Configuration
                                            </h3>

                                            <span className="text-[10px] text-[#737A87]">
                                                Pipeline ID: ops.orders.v1
                                            </span>
                                        </div>

                                        <div className="p-4">

                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                Workflow Name
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                value={workflowName}
                                                onChange={(event) =>
                                                    updateConfigurationField(
                                                        'workflowName',
                                                        event.target.value,
                                                        setWorkflowName
                                                    )
                                                }
                                                onBlur={() =>
                                                    touchConfigurationField('workflowName', workflowName)
                                                }
                                                maxLength={80}
                                                required
                                                aria-invalid={Boolean(configurationErrors.workflowName)}
                                                aria-describedby={
                                                    configurationErrors.workflowName
                                                        ? 'workflow-name-error'
                                                        : undefined
                                                }
                                                placeholder="Enter workflow name"
                                                className={`
                                                mt-1 h-9 w-full rounded-md border px-3 text-xs
                                                text-[#343A47] outline-none transition
                                                focus:border-[#0757C9]
                                                ${configurationErrors.workflowName
                                                        ? 'border-red-400 bg-red-50'
                                                        : 'border-[#DCE1E9]'
                                                    }
                                            `}
                                            />

                                            {configurationErrors.workflowName && (
                                                <p
                                                    id="workflow-name-error"
                                                    role="alert"
                                                    className="mt-1 text-[10px] text-red-600"
                                                >
                                                    {configurationErrors.workflowName}
                                                </p>
                                            )}



                                            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                Description
                                            </label>

                                            <textarea
                                                value={workflowDescription}
                                                onChange={(event) =>
                                                    updateConfigurationField(
                                                        'workflowDescription',
                                                        event.target.value,
                                                        setWorkflowDescription
                                                    )
                                                }
                                                onBlur={() =>
                                                    touchConfigurationField(
                                                        'workflowDescription',
                                                        workflowDescription
                                                    )
                                                }
                                                rows={3}
                                                maxLength={500}
                                                aria-invalid={Boolean(
                                                    configurationErrors.workflowDescription
                                                )}
                                                aria-describedby="workflow-description-help"
                                                placeholder="Describe what this workflow automates..."
                                                className={`
                                                mt-1 w-full resize-none rounded-md border px-3 py-2
                                                text-xs leading-5 text-[#343A47] outline-none
                                                focus:border-[#0757C9]
                                                ${configurationErrors.workflowDescription
                                                        ? 'border-red-400 bg-red-50'
                                                        : 'border-[#DCE1E9]'
                                                    }
                                                `}
                                            />

                                            <div className="mt-1 flex items-start justify-between gap-2">
                                                <p
                                                    id="workflow-description-help"
                                                    className={`text-[10px] ${configurationErrors.workflowDescription
                                                        ? 'text-red-600'
                                                        : 'text-[#737A87]'
                                                        }`}
                                                >
                                                    {configurationErrors.workflowDescription ||
                                                        'Briefly explain the purpose of this workflow.'}
                                                </p>

                                                <span className="shrink-0 text-[10px] text-[#737A87]">
                                                    {workflowDescription.length}/500
                                                </span>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-4">

                                                <div>
                                                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                        Category
                                                    </label>

                                                    <div className="relative mt-1">
                                                        <select
                                                            value={workflowCategory}
                                                            onChange={(event) =>
                                                                updateConfigurationField(
                                                                    'workflowCategory',
                                                                    event.target.value,
                                                                    setWorkflowCategory
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                touchConfigurationField(
                                                                    'workflowCategory',
                                                                    workflowCategory
                                                                )
                                                            }
                                                            required
                                                            aria-invalid={Boolean(configurationErrors.workflowCategory)}
                                                            className={`
                                                            h-9 w-full appearance-none rounded-md border
                                                            bg-white px-3 pr-8 text-xs text-[#343A47]
                                                            outline-none focus:border-[#0757C9]
                                                            ${configurationErrors.workflowCategory
                                                                    ? 'border-red-400'
                                                                    : 'border-[#DCE1E9]'
                                                                }
                                                            `}
                                                        >
                                                            <option value="Sales & Operations">Sales & Operations</option>
                                                            <option value="Inventory">Inventory</option>
                                                            <option value="Finance">Finance</option>
                                                            <option value="Customer Service">Customer Service</option>
                                                        </select>

                                                        {configurationErrors.workflowCategory && (
                                                            <p role="alert" className="mt-1 text-[10px] text-red-600">
                                                                {configurationErrors.workflowCategory}
                                                            </p>
                                                        )}

                                                        <ChevronDown
                                                            size={14}
                                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#747B87]"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                        Workflow Owner
                                                    </label>

                                                    <div
                                                        className="
                                                            mt-1
                                                            flex
                                                            h-9
                                                            items-center
                                                            justify-between
                                                            rounded-md
                                                            border
                                                            border-[#DCE1E9]
                                                            px-3
                                                        "
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="
                                                                    flex
                                                                    h-5
                                                                    w-5
                                                                    items-center
                                                                    justify-center
                                                                    rounded-full
                                                                    bg-[#DCE8FF]
                                                                    text-[8px]
                                                                    font-bold
                                                                    text-[#0757C9]
                                                                "
                                                            >
                                                                AU
                                                            </span>

                                                            <span className="text-xs text-[#343A47]">
                                                                Admin User (AU)
                                                            </span>
                                                        </div>

                                                        <span className="text-[10px] text-[#737A87]">
                                                            Owner
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Workflow Pipeline */}
                                    <section
                                        className="
                                            mt-4
                                            overflow-hidden
                                            rounded-lg
                                            border
                                            border-[#E2E5EB]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                border-b
                                                border-[#E6E8ED]
                                                px-4
                                                py-3
                                            "
                                        >
                                            <div className="flex items-center gap-3">
                                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#343A47]">
                                                    <GitBranch
                                                        size={14}
                                                        className="text-[#0757C9]"
                                                    />
                                                    Workflow Pipeline
                                                </h3>

                                                <span className="rounded bg-[#EEF1FF] px-2 py-1 text-[10px] font-medium text-[#5966A4]">
                                                    {workflowSteps.length} {workflowSteps.length === 1 ? 'Node' : 'Nodes'} Configured
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-[#737A87]">
                                                <span className="flex items-center gap-1 text-[10px]">
                                                    <Clock3 size={11} />
                                                    {isLoadingDraft ? 'Loading draft...' : workflowId ? 'MongoDB draft' : 'Unsaved draft'}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 hover:bg-[#F3F5F9]"
                                                    >
                                                        <Undo2 size={13} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="rounded p-1 hover:bg-[#F3F5F9]"
                                                    >
                                                        <Redo2 size={13} />
                                                    </button>

                                                    <span className="mx-1 text-[10px]">
                                                        100%
                                                    </span>

                                                    <button
                                                        type="button"
                                                        className="rounded p-1 hover:bg-[#F3F5F9]"
                                                    >
                                                        <Maximize2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5">

                                            {workflowSteps.map((step, index) => {
                                                const Icon = step.icon

                                                return (
                                                    <div key={step.id} className="mb-0">
                                                        {/* Workflow Node Card */}
                                                        <div
                                                            tabIndex={0}
                                                            aria-label={`Select workflow step ${step.number}: ${step.title}`}
                                                            onClick={() => {
                                                                setSelectedStepId(step.id)
                                                                setStepMessage('')
                                                            }}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter' || event.key === ' ') {
                                                                    event.preventDefault()
                                                                    setSelectedStepId(step.id)
                                                                    setStepMessage('')
                                                                }
                                                            }}
                                                            className={`
                                                            relative cursor-pointer rounded-lg border px-4 py-3
                                                            transition focus:outline-none focus:ring-2
                                                            focus:ring-[#0757C9] focus:ring-offset-2
                                                            ${selectedStepId === step.id
                                                                    ? 'border-2 border-[#0757C9] bg-[#EEF3FF] shadow-[0_4px_14px_rgba(7,87,201,0.10)]'
                                                                    : 'border-[#DCE1E9] bg-white hover:border-[#9AB5E4]'
                                                                }
                                                                `}
                                                        >
                                                            {/* Selected Node Label */}
                                                            {selectedStepId === step.id && (
                                                                <span className="absolute -top-3 left-4 rounded bg-[#0757C9] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-white">
                                                                    Active in Inspector
                                                                </span>
                                                            )}

                                                            <div className="flex items-center gap-3">
                                                                {/* Node Icon */}
                                                                <div
                                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${step.iconClass}`}
                                                                >
                                                                    <Icon size={17} strokeWidth={1.8} />
                                                                </div>

                                                                {/* Node Details */}
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className="text-[9px] font-bold uppercase text-[#0757C9]">
                                                                            Step {step.number}
                                                                        </span>

                                                                        <span
                                                                            className={`rounded px-1.5 py-0.5 text-[8px] font-semibold ${step.typeClass}`}
                                                                        >
                                                                            {step.type}
                                                                        </span>
                                                                    </div>

                                                                    <h4 className="mt-1 text-sm font-semibold text-[#202530]">
                                                                        {step.title}
                                                                    </h4>

                                                                    {step.description && (
                                                                        <p className="mt-1 text-[10px] text-[#69707D]">
                                                                            {step.description}
                                                                        </p>
                                                                    )}

                                                                    {step.config?.condition && (
                                                                        <div className="mt-2 rounded border border-[#E1E5ED] bg-[#F8F9FC] px-2 py-1.5 text-[9px] text-[#59606E]">
                                                                            {step.config.condition}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Status and Remove Button */}
                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    <span
                                                                        className={`
                                                                        rounded border px-2 py-1 text-[9px] font-semibold
                                                                        ${selectedStepId === step.id
                                                                                ? 'border-[#0757C9] bg-[#0757C9] text-white'
                                                                                : 'border-[#CFE1F5] bg-[#F0F7FF] text-[#0757C9]'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {step.status}
                                                                    </span>

                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Remove ${step.title}`}
                                                                        title={
                                                                            step.typeKey === 'trigger'
                                                                                ? 'The starting trigger cannot be removed'
                                                                                : 'Remove step'
                                                                        }
                                                                        disabled={step.typeKey === 'trigger'}
                                                                        onClick={(event) => {
                                                                            event.stopPropagation()
                                                                            removeWorkflowStep(step.id)
                                                                        }}
                                                                        className="rounded p-1 text-[#737A87] hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Connector Between Nodes */}
                                                        {index < workflowSteps.length - 1 && (
                                                            <div className="flex h-9 items-center justify-center">
                                                                <div className="relative h-full w-px bg-[#DCE1E9]">
                                                                    <span className="absolute left-1/2 top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#DCE1E9] bg-white text-[#7B818D]">
                                                                        <Plus size={11} />
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}

                                            {/* Add Step */}
                                            <div
                                                className="
                                                    mt-5
                                                    flex
                                                    items-center
                                                    justify-between
                                                    rounded-md
                                                    border
                                                    border-[#E1E4EA]
                                                    bg-[#FBFCFE]
                                                    px-4
                                                    py-3
                                                "
                                            >
                                                <span className="text-[10px] font-semibold uppercase text-[#737A87]">
                                                    Add Step
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => addWorkflowStep('action')}
                                                        className="flex items-center gap-1 rounded bg-[#EEF2FF] px-2.5 py-1.5 text-[9px] font-medium text-[#0757C9]"
                                                    >
                                                        <Zap size={11} />
                                                        Action
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => addWorkflowStep('condition')}
                                                        className="flex items-center gap-1 rounded bg-[#EEF2FF] px-2.5 py-1.5 text-[9px] font-medium text-[#0757C9]"
                                                    >
                                                        <GitBranch size={11} />
                                                        Condition
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => addWorkflowStep('notification')}
                                                        className="flex items-center gap-1 rounded bg-[#EEF2FF] px-2.5 py-1.5 text-[9px] font-medium text-[#0757C9]"
                                                    >
                                                        <BellRing size={11} />
                                                        Notification
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => addWorkflowStep('approval')}
                                                        className="flex items-center gap-1 rounded bg-[#EEF2FF] px-2.5 py-1.5 text-[9px] font-medium text-[#0757C9]"
                                                    >
                                                        <ShieldCheck size={11} />
                                                        Approval
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => addWorkflowStep('delay')}
                                                        className="flex items-center gap-1 rounded bg-[#EEF2FF] px-2.5 py-1.5 text-[9px] font-medium text-[#0757C9]"
                                                    >
                                                        <Clock3 size={11} />
                                                        Delay
                                                    </button>
                                                </div>
                                            </div>
                                            {stepMessage && (
                                                <p
                                                    role="status"
                                                    aria-live="polite"
                                                    className="mt-3 text-xs text-[#59606E]"
                                                >
                                                    {stepMessage}
                                                </p>
                                            )}
                                        </div>
                                    </section>

                                    {/* Dry Run */}
                                    <section
                                        className="
                                            mt-4
                                            rounded-lg
                                            border
                                            border-[#E2E5EB]
                                            bg-white
                                            p-4
                                            shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                        "
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#343A47]">
                                                <Zap
                                                    size={14}
                                                    className="text-[#0757C9]"
                                                />
                                                Workflow Dry-Run & Simulation
                                            </h3>

                                            <button
                                                type="button"
                                                className="
                                                    flex
                                                    items-center
                                                    gap-1.5
                                                    rounded
                                                    border
                                                    border-[#DCE1E9]
                                                    bg-white
                                                    px-2.5
                                                    py-1.5
                                                    text-[10px]
                                                    font-medium
                                                    text-[#343A47]
                                                "
                                            >
                                                <Play size={11} />
                                                Run Test
                                            </button>
                                        </div>

                                        <div className="mt-3 grid grid-cols-4 gap-3">

                                            {[
                                                {
                                                    title: 'Trigger Payload',
                                                    value: 'Matched Event',
                                                    sub: 'order_id: #89201',
                                                },
                                                {
                                                    title: 'Condition Branch',
                                                    value: 'TRUE ($14.2k)',
                                                    sub: 'Tier: Enterprise',
                                                },
                                                {
                                                    title: 'Approval Route',
                                                    value: 'Finance Mgr',
                                                    sub: 'SLA: 24h Attached',
                                                },
                                                {
                                                    title: 'Dispatch Service',
                                                    value: '2 Targets OK',
                                                    sub: 'Email + Webhook 200',
                                                },
                                            ].map((item) => (
                                                <div
                                                    key={item.title}
                                                    className="
                                                        rounded
                                                        border
                                                        border-[#E2E5EB]
                                                        bg-[#FBFCFE]
                                                        p-3
                                                    "
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] text-[#737A87]">
                                                            {item.title}
                                                        </span>

                                                        <CheckCircle2
                                                            size={12}
                                                            className="text-[#18A957]"
                                                        />
                                                    </div>

                                                    <p className="mt-2 text-[10px] font-semibold text-[#242936]">
                                                        {item.value}
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-[#7A808C]">
                                                        {item.sub}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* =================================================
                                    RIGHT INSPECTOR
                                ================================================== */}
                                <aside className="space-y-4">

                                    {/* Node Inspector */}

                                    {/* Node Inspector */}
                                    <section className="rounded-lg border border-[#E2E5EB] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                        <div className="border-b border-[#E6E8ED] px-4 py-3">
                                            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#343A47]">
                                                <Settings2 size={14} className="text-[#0757C9]" />
                                                Node Inspector
                                            </h3>

                                            <p className="mt-2 text-[10px] text-[#737A87]">
                                                Edit the settings for the selected workflow step.
                                            </p>
                                        </div>

                                        {!selectedStep ? (
                                            <div className="p-4 text-xs text-[#737A87]">
                                                Select a workflow step to configure it.
                                            </div>
                                        ) : (
                                            <div className="space-y-4 p-4">
                                                <div className="rounded-md bg-[#F0F5FF] p-3">
                                                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#0757C9]">
                                                        Selected Step · {selectedStep.number}
                                                    </p>
                                                    <p className="mt-1 text-xs font-semibold text-[#202530]">
                                                        {selectedStep.type}
                                                    </p>
                                                </div>

                                                {/* Common settings */}
                                                <div>
                                                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                        Step Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={selectedStep.title}
                                                        onChange={(event) =>
                                                            updateSelectedStep('title', event.target.value)
                                                        }
                                                        className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] px-3 text-xs text-[#343A47] outline-none focus:border-[#0757C9] focus:ring-1 focus:ring-[#0757C9]"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        value={selectedStep.description ?? ''}
                                                        onChange={(event) =>
                                                            updateSelectedStep('description', event.target.value)
                                                        }
                                                        rows={3}
                                                        className="mt-1 w-full rounded-md border border-[#DCE1E9] p-3 text-xs text-[#343A47] outline-none focus:border-[#0757C9] focus:ring-1 focus:ring-[#0757C9]"
                                                    />
                                                </div>

                                                {/* Trigger settings */}
                                                {selectedStep.typeKey === 'trigger' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Trigger Event
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={selectedStep.config?.event ?? ''}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('event', event.target.value)
                                                                }
                                                                placeholder="e.g. Order_Placed"
                                                                className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] px-3 text-xs outline-none focus:border-[#0757C9]"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Trigger Entity
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={selectedStep.config?.entity ?? ''}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('entity', event.target.value)
                                                                }
                                                                placeholder="e.g. Sales.Orders"
                                                                className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] px-3 text-xs outline-none focus:border-[#0757C9]"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Condition settings */}
                                                {selectedStep.typeKey === 'condition' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Condition Expression
                                                            </label>
                                                            <textarea
                                                                value={selectedStep.config?.condition ?? ''}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('condition', event.target.value)
                                                                }
                                                                rows={3}
                                                                placeholder="e.g. order.total > 10000"
                                                                className="mt-1 w-full rounded-md border border-[#DCE1E9] p-3 font-mono text-xs outline-none focus:border-[#0757C9]"
                                                            />
                                                            <p className="mt-1 text-[10px] text-[#737A87]">
                                                                Enter the rule this step should evaluate.
                                                            </p>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Action settings */}
                                                {selectedStep.typeKey === 'action' && (
                                                    <div>
                                                        <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                            Action Type
                                                        </label>
                                                        <select
                                                            value={selectedStep.config?.actionType ?? 'Update Record'}
                                                            onChange={(event) =>
                                                                updateSelectedStepConfig('actionType', event.target.value)
                                                            }
                                                            className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] bg-white px-3 text-xs outline-none focus:border-[#0757C9]"
                                                        >
                                                            <option>Update Record</option>
                                                            <option>Create Record</option>
                                                            <option>Send Webhook</option>
                                                            <option>Send Email</option>
                                                            <option>Assign Task</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Approval settings */}
                                                {selectedStep.typeKey === 'approval' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Approver Role
                                                            </label>
                                                            <select
                                                                value={selectedStep.config?.approverRole ?? 'Department Manager'}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('approverRole', event.target.value)
                                                                }
                                                                className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] bg-white px-3 text-xs outline-none focus:border-[#0757C9]"
                                                            >
                                                                <option>Department Manager & Finance Lead</option>
                                                                <option>Department Manager</option>
                                                                <option>Finance Lead</option>
                                                                <option>System Administrator</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Approval Policy
                                                            </label>
                                                            <select
                                                                value={selectedStep.config?.approvalPolicy ?? 'Single Approver'}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('approvalPolicy', event.target.value)
                                                                }
                                                                className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] bg-white px-3 text-xs outline-none focus:border-[#0757C9]"
                                                            >
                                                                <option>Single Approver</option>
                                                                <option>Sequential Sign-Off (Both required)</option>
                                                                <option>Any One Approver (First to sign)</option>
                                                            </select>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] font-semibold uppercase text-[#747B87]">
                                                                    SLA (Hours)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={selectedStep.config?.slaHours ?? '24'}
                                                                    onChange={(event) =>
                                                                        updateSelectedStepConfig('slaHours', event.target.value)
                                                                    }
                                                                    className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] px-2 text-xs outline-none focus:border-[#0757C9]"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-semibold uppercase text-[#747B87]">
                                                                    Reminder (Hours)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={selectedStep.config?.reminderHours ?? '4'}
                                                                    onChange={(event) =>
                                                                        updateSelectedStepConfig('reminderHours', event.target.value)
                                                                    }
                                                                    className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] px-2 text-xs outline-none focus:border-[#0757C9]"
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Notification settings */}
                                                {selectedStep.typeKey === 'notification' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Notification Channel
                                                            </label>
                                                            <select
                                                                value={selectedStep.config?.channel ?? 'Email'}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('channel', event.target.value)
                                                                }
                                                                className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] bg-white px-3 text-xs outline-none focus:border-[#0757C9]"
                                                            >
                                                                <option>Email</option>
                                                                <option>In-App Notification</option>
                                                                <option>SMS</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Notification Message
                                                            </label>
                                                            <textarea
                                                                value={selectedStep.config?.message ?? ''}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('message', event.target.value)
                                                                }
                                                                rows={4}
                                                                placeholder="Enter the notification message..."
                                                                className="mt-1 w-full rounded-md border border-[#DCE1E9] p-3 text-xs outline-none focus:border-[#0757C9]"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Delay settings */}
                                                {selectedStep.typeKey === 'delay' && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Wait Duration
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={selectedStep.config?.delayValue ?? '1'}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('delayValue', event.target.value)
                                                                }
                                                                className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] px-2 text-xs outline-none focus:border-[#0757C9]"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#747B87]">
                                                                Time Unit
                                                            </label>
                                                            <select
                                                                value={selectedStep.config?.delayUnit ?? 'Hours'}
                                                                onChange={(event) =>
                                                                    updateSelectedStepConfig('delayUnit', event.target.value)
                                                                }
                                                                className="mt-1 h-9 w-full rounded-md border border-[#DCE1E9] bg-white px-2 text-xs outline-none focus:border-[#0757C9]"
                                                            >
                                                                <option>Minutes</option>
                                                                <option>Hours</option>
                                                                <option>Days</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="rounded-md border border-[#E2E5EB] bg-[#F8F9FC] p-3">
                                                    <p className="text-[10px] text-[#59606E]">
                                                        Current status: <span className="font-semibold">{selectedStep.status}</span>
                                                    </p>
                                                    <p className="mt-1 text-[10px] leading-4 text-[#737A87]">
                                                        Changes stay in this editor until you save the draft to MongoDB.
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setStepMessage(`${selectedStep.title} settings updated in the current draft.`)}
                                                    className="h-9 w-full rounded-md bg-[#0757C9] text-xs font-medium text-white transition hover:bg-[#004EB8]"
                                                >
                                                    Confirm Step Settings
                                                </button>

                                                {stepMessage && (
                                                    <p role="status" aria-live="polite" className="text-[10px] text-[#59606E]">
                                                        {stepMessage}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </section>


                                    {/* Validation Summary */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E2E5EB]
                                            bg-white
                                            p-4
                                            shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                        "
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#343A47]">
                                                <CheckCircle2
                                                    size={14}
                                                    className="text-[#0757C9]"
                                                />
                                                Validation Summary
                                            </h3>

                                            <span className="text-xs font-bold text-[#18A957]">
                                                100% Ready
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-3">

                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-[#737A87]">
                                                    Root Trigger
                                                </span>

                                                <span className="font-medium text-[#343A47]">
                                                    Customer Order Placed
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-[#737A87]">
                                                    Pipeline Nodes
                                                </span>

                                                <span className="font-medium text-[#343A47]">
                                                    4 (1 Trigger, 1 Cond, 1 Appr, 1 Act)
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-[#737A87]">
                                                    Target Segment
                                                </span>

                                                <span className="font-medium text-[#343A47]">
                                                    Enterprise & VIP
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-[#737A87]">
                                                    Error Recovery
                                                </span>

                                                <span className="font-medium text-[#343A47]">
                                                    Auto-retry (3x backoff)
                                                </span>
                                            </div>

                                            <div className="border-t border-[#E6E8ED] pt-3">
                                                <div className="space-y-2">
                                                    {validationItems.map((item) => (
                                                        <div
                                                            key={item}
                                                            className="flex items-center gap-2 text-[10px] text-[#343A47]"
                                                        >
                                                            <CheckCircle2
                                                                size={13}
                                                                className="shrink-0 text-[#0757C9]"
                                                            />

                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </aside>
                            </div>

                            {/* =================================================
                                BOTTOM ACTION BAR
                            ================================================== */}
                            <div
                                className="
                                    sticky
                                    bottom-0
                                    z-10
                                    mt-5
                                    flex
                                    items-center
                                    justify-between
                                    border-t
                                    border-[#E1E4EA]
                                    bg-white
                                    px-5
                                    py-3
                                    shadow-[0_-4px_12px_rgba(15,23,42,0.05)]
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-[#0757C9]" />

                                    <span className="text-xs font-semibold text-[#343A47]">
                                        Status: Draft v1.0.0
                                    </span>

                                    <span className="h-4 w-px bg-[#E1E4EA]" />

                                    <span className="text-[10px] text-[#737A87]">
                                        All 4 steps syntactically validated • 0 warnings • Ready for deployment
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        className="
                                            flex
                                            h-8
                                            items-center
                                            gap-1.5
                                            rounded-md
                                            bg-[#F4E9E9]
                                            px-3
                                            text-[10px]
                                            font-medium
                                            text-[#6B5555]
                                        "
                                    >
                                        <Trash2 size={12} />
                                        Discard
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={isSavingDraft || isLoadingDraft}
                                        className="
                                            h-8
                                            rounded-md
                                            border
                                            border-[#DCE1E9]
                                            bg-white
                                            px-3
                                            text-[10px]
                                            font-medium
                                            text-[#343A47]
                                        "
                                    >
                                        {isSavingDraft ? 'Saving...' : 'Save Draft'}
                                    </button>

                                    <button
                                        type="button"
                                        className="
                                            h-8
                                            rounded-md
                                            border
                                            border-[#DCE1E9]
                                            bg-white
                                            px-3
                                            text-[10px]
                                            font-medium
                                            text-[#343A47]
                                        "
                                    >
                                        Preview Flow
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handlePublishWorkflow}
                                        className="
                                            flex
                                            h-8
                                            items-center
                                            gap-1.5
                                            rounded-md
                                            bg-[#0757C9]
                                            px-4
                                            text-[10px]
                                            font-medium
                                            text-white
                                            shadow-sm
                                            hover:bg-[#004EB8]
                                        "
                                    >
                                        <Play
                                            size={11}
                                            fill="currentColor"
                                        />
                                        Publish Workflow
                                    </button>
                                </div>
                            </div>

                            {/* =================================================
                                FOOTER
                            ================================================== */}
                            <footer className="mt-6 border-t border-[#E1E4EA] py-5">
                                <div className="flex flex-col gap-3 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">

                                    <p>
                                        © 2026 Business Process Automation System |
                                        Cloud-Based SaaS Platform
                                    </p>

                                    <div className="flex gap-5 text-[#343A47]">
                                        <button type="button">
                                            Privacy Policy
                                        </button>

                                        <button type="button">
                                            Terms of Service
                                        </button>

                                        <button type="button">
                                            Compliance
                                        </button>
                                    </div>
                                </div>
                            </footer>

                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default CreateWorkflow