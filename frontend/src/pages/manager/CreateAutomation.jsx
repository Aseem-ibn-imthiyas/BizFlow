import { useState } from 'react'
import api from '../../services/api'
import {
    Search,
    Mail,
    Bell,
    Settings,
    HelpCircle,
    Zap,
    FileText,
    SlidersHorizontal,
    ShoppingCart,
    ChevronDown,
    CheckCircle2,
    Plus,
    X,
    GripVertical,
    Trash2,
    Send,
    Package,
    Webhook,
    Play,
    FlaskConical,
    Activity,
    ArrowDown,
    RotateCcw,
    Filter,
    Database,
} from 'lucide-react'

import ManagerSidebar from '../../components/sidebar/ManagerSidebar'

const inputClass = `
    h-10
    w-full
    rounded-lg
    border
    border-[#DDE2EA]
    bg-white
    px-3
    text-xs
    text-[#273142]
    outline-none
    transition
    focus:border-[#0757C9]
    focus:ring-2
    focus:ring-[#0757C9]/10
`

const selectClass = `
    flex
    h-10
    w-full
    items-center
    justify-between
    rounded-lg
    border
    border-[#DDE2EA]
    bg-white
    px-3
    text-xs
    text-[#273142]
`

function HeaderIcon({ children }) {
    return (
        <button
            type="button"
            className="text-[#59606E] transition hover:text-[#0757C9]"
        >
            {children}
        </button>
    )
}

function SectionHeader({
    icon: Icon,
    title,
    description,
    badge,
    badgeClass = 'bg-[#EEF4FF] text-[#0757C9]',
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF] text-[#0757C9]">
                    <Icon size={17} />
                </div>

                <div>
                    <h2 className="text-sm font-bold text-[#171B25]">
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-1 text-[10px] leading-5 text-[#737B8C]">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {badge && (
                <span
                    className={`inline-flex w-fit items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold ${badgeClass}`}
                >
                    {badge}
                </span>
            )}
        </div>
    )
}

function SmallSelect({ value, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={selectClass}
        >
            <span>{value}</span>
            <ChevronDown size={14} className="text-[#737B8C]" />
        </button>
    )
}

function AutomationCreate() {

    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [saveSuccess, setSaveSuccess] = useState('')
    const [createdWorkflowId, setCreatedWorkflowId] = useState('')


    const [active, setActive] = useState(true)
    const [automationName, setAutomationName] = useState(
        'High Value Sales & Fulfillment Flow'
    )
    const [description, setDescription] = useState(
        'Automatically alerts the sales manager, creates an urgent review task, and updates ERP order status whenever a sale exceeds $1,000 paid status.'
    )

    const [businessModule, setBusinessModule] = useState('Sales & Revenue')
    const [priority, setPriority] = useState(
        'High (Real-time thread priority)'
    )

    const [salesAmount, setSalesAmount] = useState('1,000.00')
    const [paymentStatus, setPaymentStatus] = useState('Paid')

    const [concurrentExecutions, setConcurrentExecutions] = useState(true)
    const [failureNotifications, setFailureNotifications] = useState(true)

    const [actions, setActions] = useState([
        {
            id: 1,
            title: 'Send In-App & Push Notification',
            icon: Send,
            status: 'Ready',
        },
        {
            id: 2,
            title: 'Create High-Priority Task',
            icon: CheckCircle2,
            status: 'Ready',
        },
        {
            id: 3,
            title: 'Mutate Record Status',
            icon: Database,
            status: 'Ready',
        },
    ])

    const removeAction = (id) => {
        setActions((previous) =>
            previous.filter((action) => action.id !== id)
        )
    }

    const addAction = (title, icon) => {
        setActions((previous) => [
            ...previous,
            {
                id: Date.now(),
                title,
                icon,
                status: 'Ready',
            },
        ])
    }


    const handleCreateAutomation = async () => {
        setSaveError('')
        setSaveSuccess('')
        setCreatedWorkflowId('')

        // Validate automation name.
        const trimmedName = automationName.trim()

        if (trimmedName.length < 3 || trimmedName.length > 80) {
            setSaveError(
                'Automation name must contain between 3 and 80 characters.'
            )
            return
        }

        // Validate description.
        const trimmedDescription = description.trim()

        if (trimmedDescription.length > 500) {
            setSaveError(
                'Description cannot exceed 500 characters.'
            )
            return
        }

        // Validate sales amount.
        const numericSalesAmount = Number(
            salesAmount.replace(/,/g, '').trim()
        )

        if (
            !Number.isFinite(numericSalesAmount) ||
            numericSalesAmount < 0
        ) {
            setSaveError('Please enter a valid sales amount.')
            return
        }

        if (!paymentStatus.trim()) {
            setSaveError('Please enter a payment status.')
            return
        }

        if (!businessModule.trim()) {
            setSaveError('Please select a business module.')
            return
        }

        // Convert the UI action titles into backend action types.
        const getActionType = (title) => {
            const normalizedTitle = title.toLowerCase()

            if (normalizedTitle.includes('notification')) {
                return 'send_notification'
            }

            if (normalizedTitle.includes('task')) {
                return 'create_task'
            }

            if (
                normalizedTitle.includes('record status') ||
                normalizedTitle.includes('update record')
            ) {
                return 'update_record'
            }

            if (normalizedTitle.includes('email')) {
                return 'send_email'
            }

            if (normalizedTitle.includes('stock')) {
                return 'update_stock'
            }

            if (normalizedTitle.includes('webhook')) {
                return 'call_webhook'
            }

            return 'custom_action'
        }

        // Step 1: Trigger.
        const triggerStep = {
            id: 'trigger-sales-order-created',
            number: 1,
            type: 'trigger',
            typeKey: 'sales_order_created',
            typeClass: 'trigger',
            iconClass: 'shopping-cart',
            title: 'New Sale Created',
            description: 'Triggered when a new sales order is created.',
            status: 'Configured',
            config: {
                event: 'sales.order.created',
                entity: 'Sales.Orders.Record',
            },
        }

        // Step 2: Conditions.
        const conditionStep = {
            id: 'condition-sales-order',
            number: 2,
            type: 'condition',
            typeKey: 'sales_order_conditions',
            typeClass: 'condition',
            iconClass: 'filter',
            title: 'Sales Order Conditions',
            description: 'Evaluate sales amount and payment status.',
            status: 'Configured',
            config: {
                condition:
                    `sales.amount > ${numericSalesAmount} AND ` +
                    `sales.paymentStatus == "${paymentStatus.trim()}"`,

                logicalOperator: 'AND',

                conditions: [
                    {
                        field: 'sales.amount',
                        operator: '>',
                        value: numericSalesAmount,
                    },
                    {
                        field: 'sales.paymentStatus',
                        operator: '==',
                        value: paymentStatus.trim(),
                    },
                ],
            },
        }

        // Step 3: Map the configured actions.
        const actionSteps = actions.map((action, index) => ({
            id: `action-${index + 1}`,
            number: index + 3,
            type: 'action',
            typeKey: getActionType(action.title),
            typeClass: 'action',
            iconClass: 'workflow-action',
            title: action.title,
            description: `Execute action: ${action.title}`,
            status: 'Configured',
            config: {
                actionType: getActionType(action.title),
                actionName: action.title,
            },
        }))

        // Complete workflow payload.
        const workflowData = {
            workflowName: trimmedName,
            workflowDescription: trimmedDescription,
            workflowCategory: businessModule,
            workflowSteps: [
                triggerStep,
                conditionStep,
                ...actionSteps,
            ],
        }

        try {
            setIsSaving(true)

            const response = await api.post(
                '/workflows',
                workflowData
            )

            const savedWorkflow =
                response?.workflow ||
                response?.data?.workflow ||
                response?.data ||
                response

            const workflowId =
                savedWorkflow?._id ||
                savedWorkflow?.id ||
                ''

            setCreatedWorkflowId(workflowId)

            setSaveSuccess(
                response?.message ||
                'Automation draft successfully saved.'
            )

        } catch (error) {
            setSaveError(
                error.message ||
                'Unable to save automation. Please try again.'
            )
        } finally {
            setIsSaving(false)
        }
    }


    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    FIXED SIDEBAR
                ====================================================== */}

                <div className="h-screen shrink-0">
                    <ManagerSidebar />
                </div>

                {/* =====================================================
                    RIGHT APPLICATION AREA
                ====================================================== */}

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* =================================================
                        FIXED HEADER
                    ================================================== */}

                    <header
                        className="
                            flex
                            h-16
                            shrink-0
                            items-center
                            justify-between
                            border-b
                            border-[#E1E4EA]
                            bg-white
                            px-5
                            lg:px-8
                        "
                    >
                        {/* Search */}

                        <div
                            className="
                                flex
                                h-10
                                w-full
                                max-w-75
                                items-center
                                gap-2
                                rounded-lg
                                bg-[#F4F5FA]
                                px-3
                                text-xs
                                text-[#737B8C]
                            "
                        >
                            <Search size={15} />

                            <span>
                                Search users, reports, settings...
                            </span>
                        </div>

                        {/* Header Actions */}

                        <div className="flex items-center gap-4">

                            <HeaderIcon>
                                <Mail size={17} strokeWidth={1.8} />
                            </HeaderIcon>

                            <HeaderIcon>
                                <Bell size={17} strokeWidth={1.8} />
                            </HeaderIcon>

                            <HeaderIcon>
                                <Settings size={17} strokeWidth={1.8} />
                            </HeaderIcon>

                            <HeaderIcon>
                                <HelpCircle size={17} strokeWidth={1.8} />
                            </HeaderIcon>

                            <div className="hidden h-7 w-px bg-[#E1E4EA] sm:block" />

                            <div className="flex items-center gap-2">
                                <div className="hidden text-right sm:block">
                                    <p className="text-xs font-semibold text-[#171B25]">
                                        Manager User
                                    </p>

                                    <p className="text-[9px] uppercase tracking-wide text-[#737B8C]">
                                        Enterprise Manager
                                    </p>
                                </div>

                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0FF] text-xs font-bold text-[#0757C9]">
                                    AS
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* =================================================
                        SCROLLABLE MAIN CONTENT
                    ================================================== */}

                    <main
                        className="
                            min-h-0
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                        "
                    >

                        {/* =================================================
                            IMPORTANT MAIN CONTENT SPACING
                        ================================================== */}

                        <div
                            className="
                                w-full
                                px-5
                                py-6
                                sm:px-6
                                lg:px-8
                                xl:px-10
                                2xl:px-12
                            "
                        >

                            {/* =================================================
                                PAGE HEADER
                            ================================================== */}

                            <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-[10px] text-[#737B8C]">
                                        <span>Home</span>
                                        <span>›</span>
                                        <span>Create Automation</span>
                                    </div>

                                    <h1 className="text-[26px] font-bold tracking-tight text-[#171B25] sm:text-[28px]">
                                        Create Automation
                                    </h1>

                                    <p className="mt-1 text-xs text-[#737B8C] sm:text-sm">
                                        Orchestrate automated triggers, conditions,
                                        and actions to streamline SME operational
                                        pipelines.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={handleCreateAutomation}
                                        disabled={isSaving}
                                        className="
                                            flex
                                            h-10
                                            items-center
                                            gap-2
                                            rounded-lg
                                            bg-[#0757C9]
                                            px-4
                                            text-xs
                                            font-semibold
                                            text-white
                                            transition
                                            hover:bg-[#064EAE]
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                        "
                                    >
                                        <Zap size={14} />
                                        {isSaving ? 'Saving...' : 'Create Automation'}
                                    </button>

                                    <button
                                        type="button"
                                        className="
                                            flex
                                            h-10
                                            items-center
                                            gap-2
                                            rounded-lg
                                            border
                                            border-[#D7DBE5]
                                            bg-white
                                            px-4
                                            text-xs
                                            font-semibold
                                            text-[#737B8C]
                                        "
                                    >
                                        <X size={14} />
                                        Cancel
                                    </button>

                                </div>
                            </div>

                            {saveError && (
                                <div
                                    role="alert"
                                    className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
                                >
                                    {saveError}
                                </div>
                            )}

                            {saveSuccess && (
                                <div
                                    role="status"
                                    className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800"
                                >
                                    <p className="font-semibold">
                                        {saveSuccess}
                                    </p>

                                    <p className="mt-1">
                                        Workflow status: Draft
                                    </p>

                                    {createdWorkflowId && (
                                        <p className="mt-1 break-all">
                                            Workflow ID: {createdWorkflowId}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* =================================================
                                PAGE GRID
                            ================================================== */}

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    items-start
                                    gap-5
                                    xl:grid-cols-[minmax(0,1fr)_310px]
                                "
                            >

                                {/* =================================================
                                    LEFT MAIN COLUMN
                                ================================================== */}

                                <div className="min-w-0 space-y-5">

                                    {/* =================================================
                                        AUTOMATION DETAILS
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-xl
                                            border
                                            border-[#E1E4EA]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(20,35,60,0.03)]
                                            sm:p-6
                                        "
                                    >

                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                            <SectionHeader
                                                icon={SlidersHorizontal}
                                                title="Automation Details"
                                                description="General metadata, business domain mapping, and runtime priority level."
                                            />

                                            <div className="flex items-center gap-2 rounded-lg bg-[#F3F5FA] px-3 py-2">

                                                <span className="text-[10px] font-semibold text-[#737B8C]">
                                                    Status:
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => setActive(!active)}
                                                    className={`
                                                        relative
                                                        h-5
                                                        w-9
                                                        rounded-full
                                                        transition
                                                        ${active
                                                            ? 'bg-[#2878E5]'
                                                            : 'bg-[#B9C0CC]'
                                                        }
                                                    `}
                                                >
                                                    <span
                                                        className={`
                                                            absolute
                                                            top-0.5
                                                            h-4
                                                            w-4
                                                            rounded-full
                                                            bg-white
                                                            shadow
                                                            transition
                                                            ${active
                                                                ? 'left-4.5'
                                                                : 'left-0.5'
                                                            }
                                                        `}
                                                    />
                                                </button>

                                                <span className="text-[10px] font-semibold text-[#273142]">
                                                    {active ? 'Active' : 'Inactive'}
                                                </span>

                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-5">

                                            <div>
                                                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#59606E]">
                                                    Automation Name *
                                                </label>

                                                <input
                                                    type="text"
                                                    value={automationName}
                                                    onChange={(event) =>
                                                        setAutomationName(
                                                            event.target.value
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#59606E]">
                                                    Workflow Intent Description
                                                </label>

                                                <textarea
                                                    value={description}
                                                    onChange={(event) =>
                                                        setDescription(
                                                            event.target.value
                                                        )
                                                    }
                                                    rows={3}
                                                    className="
                                                        w-full
                                                        resize-none
                                                        rounded-lg
                                                        border
                                                        border-[#DDE2EA]
                                                        bg-white
                                                        px-3
                                                        py-3
                                                        text-xs
                                                        leading-5
                                                        text-[#273142]
                                                        outline-none
                                                        transition
                                                        focus:border-[#0757C9]
                                                        focus:ring-2
                                                        focus:ring-[#0757C9]/10
                                                    "
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                                <div>
                                                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#59606E]">
                                                        Business Module
                                                    </label>

                                                    <SmallSelect
                                                        value={businessModule}
                                                        onClick={() =>
                                                            setBusinessModule(
                                                                businessModule ===
                                                                    'Sales & Revenue'
                                                                    ? 'Inventory Management'
                                                                    : 'Sales & Revenue'
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#59606E]">
                                                        Execution Priority Tier
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPriority(
                                                                priority.includes(
                                                                    'High'
                                                                )
                                                                    ? 'Medium'
                                                                    : 'High (Real-time thread priority)'
                                                            )
                                                        }
                                                        className={selectClass}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span
                                                                className={`
                                                                    h-2
                                                                    w-2
                                                                    rounded-full
                                                                    ${priority.includes(
                                                                    'High'
                                                                )
                                                                        ? 'bg-[#E83B4B]'
                                                                        : 'bg-[#F0A400]'
                                                                    }
                                                                `}
                                                            />

                                                            {priority}
                                                        </span>

                                                        <ChevronDown
                                                            size={14}
                                                            className="text-[#737B8C]"
                                                        />
                                                    </button>
                                                </div>

                                            </div>

                                        </div>
                                    </section>

                                    {/* =================================================
                                        CONNECTOR
                                    ================================================== */}

                                    <div className="flex justify-center">
                                        <div className="h-7 w-px bg-[#D9DEE8]" />
                                    </div>

                                    {/* =================================================
                                        STEP 1
                                    ================================================== */}

                                    <section
                                        className="
                                            overflow-hidden
                                            rounded-xl
                                            border
                                            border-[#E1E4EA]
                                            border-l-[3px]
                                            border-l-[#0757C9]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(20,35,60,0.03)]
                                        "
                                    >

                                        <div className="p-5 sm:p-6">

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                                <div>
                                                    <div className="flex items-center gap-2">

                                                        <span className="rounded-md bg-[#EEF4FF] px-2 py-1 text-[9px] font-bold uppercase text-[#0757C9]">
                                                            Step 1 · Trigger
                                                        </span>

                                                        <h2 className="text-sm font-bold text-[#273142]">
                                                            When this happens...
                                                        </h2>

                                                    </div>

                                                    <p className="mt-2 text-[10px] text-[#737B8C]">
                                                        Choose the system event or
                                                        webhook that activates this
                                                        workflow sequence.
                                                    </p>
                                                </div>

                                                <span className="flex w-fit items-center gap-1 rounded-md bg-[#EAF8F0] px-2 py-1 text-[9px] font-semibold text-[#18A957]">
                                                    <CheckCircle2 size={11} />
                                                    Configured
                                                </span>

                                            </div>

                                            <div className="mt-5 rounded-xl bg-[#EEF3FF] p-4">

                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0757C9] text-white">
                                                            <ShoppingCart size={20} />
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-bold text-[#273142]">
                                                                New Sale Created
                                                            </p>

                                                            <p className="mt-1 text-[9px] text-[#737B8C]">
                                                                Event Hook:
                                                                sales.order.created
                                                            </p>
                                                        </div>

                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="
                                                            flex
                                                            w-fit
                                                            items-center
                                                            gap-2
                                                            rounded-lg
                                                            bg-white
                                                            px-3
                                                            py-2
                                                            text-[9px]
                                                            font-semibold
                                                            text-[#59606E]
                                                        "
                                                    >
                                                        <RotateCcw size={11} />
                                                        Change Trigger
                                                    </button>

                                                </div>

                                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">

                                                    <div className="rounded-lg bg-white p-3">
                                                        <p className="text-[8px] font-semibold uppercase text-[#8A91A0]">
                                                            Source Entity
                                                        </p>
                                                        <p className="mt-1 text-[10px] font-semibold text-[#273142]">
                                                            Sales.Orders.Record
                                                        </p>
                                                    </div>

                                                    <div className="rounded-lg bg-white p-3">
                                                        <p className="text-[8px] font-semibold uppercase text-[#8A91A0]">
                                                            Capture Scope
                                                        </p>
                                                        <p className="mt-1 text-[10px] font-semibold text-[#273142]">
                                                            All Channels (POS & Web)
                                                        </p>
                                                    </div>

                                                    <div className="rounded-lg bg-white p-3">
                                                        <p className="text-[8px] font-semibold uppercase text-[#8A91A0]">
                                                            Event Polling
                                                        </p>
                                                        <p className="mt-1 text-[10px] font-semibold text-[#273142]">
                                                            Realtime Webhook
                                                        </p>
                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                    </section>

                                    {/* =================================================
                                        CONNECTOR
                                    ================================================== */}

                                    <div className="flex justify-center">
                                        <div className="relative h-8 w-px bg-[#D9DEE8]">
                                            <div className="absolute -bottom-1 -left-1.25 flex h-3 w-3 items-center justify-center rounded-full border border-[#D9DEE8] bg-white">
                                                <ArrowDown
                                                    size={8}
                                                    className="text-[#737B8C]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* =================================================
                                        STEP 2
                                    ================================================== */}

                                    <section
                                        className="
                                            overflow-hidden
                                            rounded-xl
                                            border
                                            border-[#E1E4EA]
                                            border-l-[3px]
                                            border-l-[#0757C9]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(20,35,60,0.03)]
                                        "
                                    >

                                        <div className="p-5 sm:p-6">

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">

                                                        <span className="rounded-md bg-[#EEF4FF] px-2 py-1 text-[9px] font-bold uppercase text-[#0757C9]">
                                                            Step 2 · Conditions
                                                        </span>

                                                        <h2 className="text-sm font-bold text-[#273142]">
                                                            Filter Conditions
                                                        </h2>

                                                    </div>

                                                    <p className="mt-2 text-[10px] text-[#737B8C]">
                                                        Verify payload data criteria
                                                        before passing execution down
                                                        to subsequent action pipelines.
                                                    </p>
                                                </div>

                                                <span className="text-[9px] text-[#59606E]">
                                                    Matches 2 logical gates
                                                </span>

                                            </div>

                                            <div className="mt-5 space-y-3">

                                                <div className="flex flex-col gap-2 rounded-lg bg-[#F0F4FF] p-2 md:flex-row">

                                                    <div className="flex h-9 items-center rounded-md bg-white px-3 text-[9px] font-bold text-[#59606E]">
                                                        IF
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className={selectClass}
                                                    >
                                                        <span>Sales Amount (USD)</span>
                                                        <ChevronDown size={13} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={selectClass}
                                                    >
                                                        <span>Greater than (&gt;)</span>
                                                        <ChevronDown size={13} />
                                                    </button>

                                                    <input
                                                        value={salesAmount}
                                                        onChange={(event) =>
                                                            setSalesAmount(
                                                                event.target.value
                                                            )
                                                        }
                                                        className={`
                                                            ${inputClass}
                                                            md:w-36
                                                        `}
                                                    />

                                                    <button
                                                        type="button"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#737B8C] hover:bg-white"
                                                    >
                                                        <X size={13} />
                                                    </button>

                                                </div>

                                                <div className="flex justify-center">
                                                    <div className="flex items-center gap-1 rounded-md bg-[#0757C9] px-3 py-1 text-[8px] font-bold text-white">
                                                        <span>AND</span>
                                                        <span className="mx-1 opacity-40">
                                                            OR
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 rounded-lg bg-[#F0F4FF] p-2 md:flex-row">

                                                    <div className="flex h-9 items-center rounded-md bg-white px-3 text-[9px] font-bold text-[#59606E]">
                                                        AND
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className={selectClass}
                                                    >
                                                        <span>Payment Status</span>
                                                        <ChevronDown size={13} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={selectClass}
                                                    >
                                                        <span>Equals (==)</span>
                                                        <ChevronDown size={13} />
                                                    </button>

                                                    <input
                                                        value={paymentStatus}
                                                        onChange={(event) =>
                                                            setPaymentStatus(
                                                                event.target.value
                                                            )
                                                        }
                                                        className={inputClass}
                                                    />

                                                    <button
                                                        type="button"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#737B8C] hover:bg-white"
                                                    >
                                                        <X size={13} />
                                                    </button>

                                                </div>

                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">

                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1 rounded-md bg-[#EEF4FF] px-3 py-1.5 text-[9px] font-semibold text-[#0757C9]"
                                                >
                                                    <Plus size={11} />
                                                    Add Condition
                                                </button>

                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1 rounded-md bg-[#F1F3F8] px-3 py-1.5 text-[9px] font-semibold text-[#59606E]"
                                                >
                                                    <Filter size={11} />
                                                    Add Nested Filter Group
                                                </button>

                                            </div>

                                        </div>
                                    </section>

                                    {/* =================================================
                                        CONNECTOR
                                    ================================================== */}

                                    <div className="flex justify-center">
                                        <div className="relative h-8 w-px bg-[#D9DEE8]">
                                            <div className="absolute -bottom-1 -left-1.25 flex h-3 w-3 items-center justify-center rounded-full border border-[#D9DEE8] bg-white">
                                                <ArrowDown
                                                    size={8}
                                                    className="text-[#737B8C]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* =================================================
                                        STEP 3
                                    ================================================== */}

                                    <section
                                        className="
                                            overflow-hidden
                                            rounded-xl
                                            border
                                            border-[#E1E4EA]
                                            border-l-[3px]
                                            border-l-[#0757C9]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(20,35,60,0.03)]
                                        "
                                    >

                                        <div className="p-5 sm:p-6">

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">

                                                        <span className="rounded-md bg-[#EEF4FF] px-2 py-1 text-[9px] font-bold uppercase text-[#0757C9]">
                                                            Step 3 · Actions ({actions.length}{' '}
                                                            Sequential)
                                                        </span>

                                                        <h2 className="text-sm font-bold text-[#273142]">
                                                            Execution Sequence
                                                        </h2>

                                                    </div>

                                                    <p className="mt-2 text-[10px] text-[#737B8C]">
                                                        Operations performed sequentially
                                                        when triggers fire and rule
                                                        conditions evaluate to true.
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1 text-[9px] font-semibold text-[#0757C9]"
                                                >
                                                    <GripVertical size={12} />
                                                    Reorder Pipeline
                                                </button>

                                            </div>

                                            <div className="mt-5 space-y-3">

                                                {actions.map((action, index) => {
                                                    const ActionIcon = action.icon

                                                    return (
                                                        <div
                                                            key={action.id}
                                                            className="relative"
                                                        >

                                                            <div className="absolute -left-1 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#0757C9] text-[8px] font-bold text-white">
                                                                {index + 1}
                                                            </div>

                                                            <div className="rounded-xl bg-[#EEF3FF] p-3 pl-7">

                                                                <div className="flex items-center justify-between gap-3">

                                                                    <div className="flex min-w-0 items-center gap-2">

                                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#0757C9]">
                                                                            <ActionIcon size={14} />
                                                                        </div>

                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-[10px] font-bold text-[#273142]">
                                                                                Step 3.{index + 1} ·{' '}
                                                                                {action.title}
                                                                            </p>

                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                {index === 0
                                                                                    ? 'Channel: Executive Alert Channel'
                                                                                    : index === 1
                                                                                        ? 'Module: Task Management'
                                                                                        : 'Database: Sales.Orders.Table'}
                                                                            </p>
                                                                        </div>

                                                                    </div>

                                                                    <div className="flex items-center gap-2">

                                                                        <span className="rounded-md bg-[#EAF8F0] px-2 py-1 text-[8px] font-semibold text-[#18A957]">
                                                                            {action.status}
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            className="text-[#737B8C]"
                                                                        >
                                                                            <GripVertical
                                                                                size={13}
                                                                            />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeAction(
                                                                                    action.id
                                                                                )
                                                                            }
                                                                            className="text-[#737B8C] transition hover:text-[#E83B4B]"
                                                                        >
                                                                            <Trash2
                                                                                size={13}
                                                                            />
                                                                        </button>

                                                                    </div>

                                                                </div>

                                                                {index === 0 && (
                                                                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">

                                                                        <div className="rounded-lg bg-white p-2.5">
                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                Recipient User
                                                                            </p>

                                                                            <p className="mt-1 text-[9px] font-semibold text-[#273142]">
                                                                                Michael Roberts
                                                                                (Operations & Sales GM)
                                                                            </p>
                                                                        </div>

                                                                        <div className="rounded-lg bg-white p-2.5">
                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                Alert Header
                                                                            </p>

                                                                            <p className="mt-1 text-[9px] font-semibold text-[#273142]">
                                                                                High-value sale
                                                                                recorded:
                                                                                {' '}
                                                                                {'{order.amount}'}
                                                                            </p>
                                                                        </div>

                                                                        <div className="rounded-lg bg-white p-2.5 md:col-span-2">
                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                Message Template
                                                                            </p>

                                                                            <p className="mt-1 text-[9px] font-semibold text-[#273142]">
                                                                                New high-value sale
                                                                                for order verified
                                                                                via payment gateway.
                                                                            </p>
                                                                        </div>

                                                                    </div>
                                                                )}

                                                                {index === 1 && (
                                                                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">

                                                                        <div className="rounded-lg bg-white p-2.5">
                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                Task Title
                                                                            </p>
                                                                            <p className="mt-1 text-[9px] font-semibold">
                                                                                VIP Order Review
                                                                            </p>
                                                                        </div>

                                                                        <div className="rounded-lg bg-white p-2.5">
                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                Assigned Role
                                                                            </p>
                                                                            <p className="mt-1 text-[9px] font-semibold">
                                                                                Sales Operations Lead
                                                                            </p>
                                                                        </div>

                                                                        <div className="rounded-lg bg-white p-2.5">
                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                Target SLA Window
                                                                            </p>
                                                                            <p className="mt-1 text-[9px] font-semibold">
                                                                                +1 Business Day
                                                                            </p>
                                                                        </div>

                                                                    </div>
                                                                )}

                                                                {index === 2 && (
                                                                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">

                                                                        <div className="rounded-lg bg-white p-2.5">
                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                Target Column
                                                                            </p>
                                                                            <p className="mt-1 text-[9px] font-semibold">
                                                                                order.fulfillment_state
                                                                            </p>
                                                                        </div>

                                                                        <div className="rounded-lg bg-white p-2.5">
                                                                            <p className="text-[8px] text-[#737B8C]">
                                                                                New Value Applied
                                                                            </p>
                                                                            <p className="mt-1 text-[9px] font-semibold text-[#0757C9]">
                                                                                Processing & VIP Priority
                                                                            </p>
                                                                        </div>

                                                                    </div>
                                                                )}

                                                            </div>

                                                        </div>
                                                    )
                                                })}

                                            </div>

                                            {/* Add Action */}

                                            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-[#F4F6FA] p-2">

                                                <span className="px-2 text-[9px] font-semibold text-[#59606E]">
                                                    Add Action:
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addAction(
                                                            'Send Email',
                                                            Mail
                                                        )
                                                    }
                                                    className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[9px] font-semibold text-[#59606E]"
                                                >
                                                    <Mail size={11} />
                                                    Send Email
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addAction(
                                                            'Update Stock',
                                                            Package
                                                        )
                                                    }
                                                    className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[9px] font-semibold text-[#59606E]"
                                                >
                                                    <Package size={11} />
                                                    Update Stock
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addAction(
                                                            'Call Webhook',
                                                            Webhook
                                                        )
                                                    }
                                                    className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[9px] font-semibold text-[#59606E]"
                                                >
                                                    <Webhook size={11} />
                                                    Call Webhook
                                                </button>

                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1 rounded-md bg-[#0757C9] px-3 py-1.5 text-[9px] font-semibold text-white"
                                                >
                                                    <Plus size={11} />
                                                    More Actions...
                                                </button>

                                            </div>

                                        </div>
                                    </section>

                                    {/* =================================================
                                        TEST AUTOMATION
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-xl
                                            border
                                            border-[#E1E4EA]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(20,35,60,0.03)]
                                            sm:p-6
                                        "
                                    >

                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                            <div className="flex items-start gap-3">

                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF] text-[#0757C9]">
                                                    <FlaskConical size={17} />
                                                </div>

                                                <div>
                                                    <h2 className="text-sm font-bold">
                                                        Test Automation Execution
                                                    </h2>

                                                    <p className="mt-1 text-[9px] text-[#737B8C]">
                                                        Simulate live payload evaluation
                                                        against historical data without
                                                        affecting production databases.
                                                    </p>
                                                </div>

                                            </div>

                                            <div className="flex flex-wrap gap-2">

                                                <button
                                                    type="button"
                                                    className="
                                                        flex
                                                        h-9
                                                        items-center
                                                        gap-2
                                                        rounded-lg
                                                        bg-[#0757C9]
                                                        px-3
                                                        text-[9px]
                                                        font-semibold
                                                        text-white
                                                    "
                                                >
                                                    <Play size={11} />
                                                    Run Dry-Run Test
                                                </button>

                                                <button
                                                    type="button"
                                                    className="
                                                        flex
                                                        h-9
                                                        items-center
                                                        rounded-lg
                                                        bg-[#F1F3F8]
                                                        px-3
                                                        text-[9px]
                                                        font-semibold
                                                        text-[#59606E]
                                                    "
                                                >
                                                    View Sample Payload
                                                </button>

                                            </div>

                                        </div>

                                        <div className="mt-5 rounded-xl bg-[#EEF8F2] p-4">

                                            <div className="flex items-center gap-2">

                                                <CheckCircle2
                                                    size={14}
                                                    className="text-[#18A957]"
                                                />

                                                <p className="text-[10px] font-bold text-[#273142]">
                                                    Test Successful · All 4 Pipeline
                                                    Steps Passed
                                                </p>

                                                <span className="ml-auto hidden text-[8px] text-[#737B8C] sm:block">
                                                    Execution time: 340ms · Sandbox ID:
                                                    SB-9941
                                                </span>

                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">

                                                <div className="rounded-lg bg-white p-3">
                                                    <p className="text-[9px] font-semibold">
                                                        Trigger Detected
                                                    </p>
                                                    <p className="mt-1 text-[8px] text-[#737B8C]">
                                                        Simulated Event Sale #SO-9821
                                                        ($1,450.00 USD)
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-white p-3">
                                                    <p className="text-[9px] font-semibold">
                                                        Rules Evaluated
                                                    </p>
                                                    <p className="mt-1 text-[8px] text-[#737B8C]">
                                                        Amount ($1,450 &gt; $1K) = TRUE,
                                                        Status (Paid) = TRUE
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-white p-3">
                                                    <p className="text-[9px] font-semibold">
                                                        Notification
                                                    </p>
                                                    <p className="mt-1 text-[8px] text-[#737B8C]">
                                                        Message compiled and routed to
                                                        Michael Roberts.
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-white p-3">
                                                    <p className="text-[9px] font-semibold">
                                                        Order Updated
                                                    </p>
                                                    <p className="mt-1 text-[8px] text-[#737B8C]">
                                                        Payload prepared to change
                                                        status to Processing & VIP.
                                                    </p>
                                                </div>

                                            </div>
                                        </div>

                                    </section>

                                </div>

                                {/* =================================================
                                    RIGHT SIDEBAR
                                ================================================== */}

                                <aside className="min-w-0 space-y-5">

                                    {/* =================================================
                                        AUTOMATION SUMMARY
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-xl
                                            border
                                            border-[#E1E4EA]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(20,35,60,0.03)]
                                        "
                                    >

                                        <div className="flex items-center justify-between">

                                            <div className="flex items-center gap-2">
                                                <FileText
                                                    size={15}
                                                    className="text-[#0757C9]"
                                                />

                                                <h2 className="text-sm font-bold">
                                                    Automation Summary
                                                </h2>
                                            </div>

                                            <span className="rounded-full bg-[#EAF8F0] px-2 py-1 text-[8px] font-bold text-[#18A957]">
                                                ● Active Ready
                                            </span>

                                        </div>

                                        <div className="mt-5 space-y-4">

                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[9px] text-[#737B8C]">
                                                    Workflow Identifier
                                                </span>
                                                <span className="text-[9px] font-bold">
                                                    WF-SALES-VIP-09
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[9px] text-[#737B8C]">
                                                    Trigger Event
                                                </span>
                                                <span className="text-[9px] font-bold">
                                                    Sale Created
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[9px] text-[#737B8C]">
                                                    Criteria Filtering
                                                </span>
                                                <span className="text-[9px] font-bold">
                                                    2 Rules (AND)
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[9px] text-[#737B8C]">
                                                    Configured Steps
                                                </span>
                                                <span className="text-[9px] font-bold text-[#0757C9]">
                                                    {actions.length} Actions
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[9px] text-[#737B8C]">
                                                    Priority Tier
                                                </span>

                                                <span className="rounded-md bg-[#FFF0F1] px-2 py-1 text-[8px] font-bold text-[#E83B4B]">
                                                    ● High
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[9px] text-[#737B8C]">
                                                    Author / Owner
                                                </span>
                                                <span className="text-[9px] font-bold">
                                                    Michael Roberts
                                                </span>
                                            </div>

                                        </div>

                                        <div className="mt-5 rounded-lg bg-[#EEF3FF] p-3">

                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-[#59606E]">
                                                    Projected Monthly Volume
                                                </span>

                                                <span className="text-[10px] font-bold">
                                                    ~1,840 executions
                                                </span>
                                            </div>

                                            <div className="mt-4 flex h-8 items-end gap-1">

                                                {[25, 35, 20, 45, 30, 55, 40].map(
                                                    (height, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex-1 rounded-t bg-[#D5E2FF]"
                                                            style={{
                                                                height: `${height}%`,
                                                            }}
                                                        />
                                                    )
                                                )}

                                            </div>

                                        </div>

                                    </section>

                                    {/* =================================================
                                        EXECUTION SETTINGS
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-xl
                                            border
                                            border-[#E1E4EA]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(20,35,60,0.03)]
                                        "
                                    >

                                        <div className="flex items-center gap-2">
                                            <Settings
                                                size={15}
                                                className="text-[#0757C9]"
                                            />

                                            <h2 className="text-sm font-bold">
                                                Execution Settings
                                            </h2>
                                        </div>

                                        <div className="mt-5 space-y-5">

                                            <div>
                                                <label className="mb-2 block text-[9px] font-bold uppercase tracking-wide text-[#59606E]">
                                                    Dispatch Policy
                                                </label>

                                                <SmallSelect value="Immediately (Real-time Stream)" />
                                            </div>

                                            <div className="flex items-center justify-between">

                                                <div>
                                                    <p className="text-[9px] font-semibold">
                                                        Concurrent Executions
                                                    </p>

                                                    <p className="mt-1 text-[8px] text-[#8A91A0]">
                                                        Allow multiple async runs
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setConcurrentExecutions(
                                                            !concurrentExecutions
                                                        )
                                                    }
                                                    className={`
                                                        relative
                                                        h-5
                                                        w-9
                                                        rounded-full
                                                        transition
                                                        ${concurrentExecutions
                                                            ? 'bg-[#2878E5]'
                                                            : 'bg-[#B9C0CC]'
                                                        }
                                                    `}
                                                >
                                                    <span
                                                        className={`
                                                            absolute
                                                            top-0.5
                                                            h-4
                                                            w-4
                                                            rounded-full
                                                            bg-white
                                                            shadow
                                                            transition
                                                            ${concurrentExecutions
                                                                ? 'left-4.5'
                                                                : 'left-0.5'
                                                            }
                                                        `}
                                                    />
                                                </button>

                                            </div>

                                            <div>
                                                <label className="mb-2 block text-[9px] font-bold uppercase tracking-wide text-[#59606E]">
                                                    Error Retry Behavior
                                                </label>

                                                <SmallSelect value="Auto Retry (3x Exponential Backoff)" />
                                            </div>

                                            <div className="flex items-center justify-between">

                                                <div>
                                                    <p className="text-[9px] font-semibold">
                                                        Failure Notifications
                                                    </p>

                                                    <p className="mt-1 text-[8px] text-[#8A91A0]">
                                                        Ping ops channel on error
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFailureNotifications(
                                                            !failureNotifications
                                                        )
                                                    }
                                                    className={`
                                                        relative
                                                        h-5
                                                        w-9
                                                        rounded-full
                                                        transition
                                                        ${failureNotifications
                                                            ? 'bg-[#2878E5]'
                                                            : 'bg-[#B9C0CC]'
                                                        }
                                                    `}
                                                >
                                                    <span
                                                        className={`
                                                            absolute
                                                            top-0.5
                                                            h-4
                                                            w-4
                                                            rounded-full
                                                            bg-white
                                                            shadow
                                                            transition
                                                            ${failureNotifications
                                                                ? 'left-4.5'
                                                                : 'left-0.5'
                                                            }
                                                        `}
                                                    />
                                                </button>

                                            </div>

                                        </div>

                                    </section>

                                    {/* =================================================
                                        AUTOMATION ACTIVITY
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-xl
                                            border
                                            border-[#E1E4EA]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(20,35,60,0.03)]
                                        "
                                    >

                                        <div className="flex items-center justify-between">

                                            <div className="flex items-center gap-2">

                                                <Activity
                                                    size={15}
                                                    className="text-[#0757C9]"
                                                />

                                                <h2 className="text-sm font-bold">
                                                    Automation Activity
                                                </h2>

                                            </div>

                                            <span className="text-[8px] text-[#737B8C]">
                                                Live Audit
                                            </span>

                                        </div>

                                        <div className="mt-5 space-y-4">

                                            <div className="flex gap-3">
                                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0757C9]" />

                                                <div>
                                                    <p className="text-[9px] font-semibold">
                                                        Configuration updated
                                                    </p>
                                                    <p className="mt-1 text-[8px] text-[#8A91A0]">
                                                        Just now by Michael Roberts
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D9DEE8]" />

                                                <div>
                                                    <p className="text-[9px] font-semibold">
                                                        Trigger mapped: Sales.Orders
                                                    </p>
                                                    <p className="mt-1 text-[8px] text-[#8A91A0]">
                                                        2 minutes ago
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D9DEE8]" />

                                                <div>
                                                    <p className="text-[9px] font-semibold">
                                                        Conditions set: Amount &gt; $1K
                                                    </p>
                                                    <p className="mt-1 text-[8px] text-[#8A91A0]">
                                                        4 minutes ago
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D9DEE8]" />

                                                <div>
                                                    <p className="text-[9px] font-semibold">
                                                        New template initiated
                                                    </p>
                                                    <p className="mt-1 text-[8px] text-[#8A91A0]">
                                                        6 minutes ago
                                                    </p>
                                                </div>
                                            </div>

                                        </div>

                                    </section>

                                </aside>

                            </div>

                            {/* =================================================
                                FOOTER
                            ================================================== */}

                            <footer
                                className="
                                    mt-6
                                    flex
                                    min-h-12
                                    flex-col
                                    items-center
                                    justify-between
                                    gap-3
                                    border-t
                                    border-[#E1E4EA]
                                    bg-white
                                    px-2
                                    py-4
                                    text-[9px]
                                    text-[#737B8C]
                                    sm:flex-row
                                "
                            >

                                <p>
                                    © 2026 Business Process Automation System |
                                    Cloud-Based SaaS Platform
                                </p>

                                <div className="flex items-center gap-5">
                                    <button
                                        type="button"
                                        className="hover:text-[#0757C9]"
                                    >
                                        Privacy Policy
                                    </button>

                                    <button
                                        type="button"
                                        className="hover:text-[#0757C9]"
                                    >
                                        Terms of Service
                                    </button>

                                    <button
                                        type="button"
                                        className="hover:text-[#0757C9]"
                                    >
                                        Compliance
                                    </button>
                                </div>

                            </footer>

                        </div>

                    </main>

                </div>
            </div>
        </main>
    )
}

export default AutomationCreate