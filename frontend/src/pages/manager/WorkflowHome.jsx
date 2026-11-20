
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    //Filter,
    Layers3,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Workflow,
    X,
    Zap,
} from 'lucide-react'

import ManagerSidebar from '../../components/sidebar/ManagerSidebar'
import api from '../../services/api'

const inputClass = `
    h-10 w-full rounded-lg border border-[#DDE2EA]
    bg-white px-3 text-xs text-[#273142] outline-none
    transition focus:border-[#0757C9]
    focus:ring-2 focus:ring-[#0757C9]/10
`

const cardClass = `
    rounded-xl border border-[#E1E4EA] bg-white
    shadow-[0_2px_8px_rgba(20,35,60,0.03)]
`

const formatDate = (dateValue) => {
    if (!dateValue) return 'Not available'

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return 'Not available'

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

const getWorkflowId = (workflow) =>
    workflow?._id || workflow?.id || ''

const getWorkflowSteps = (workflow) =>
    Array.isArray(workflow?.workflowSteps)
        ? workflow.workflowSteps
        : []

const getWorkflowsFromResponse = (response) => {
    if (Array.isArray(response)) return response

    if (Array.isArray(response?.workflows)) {
        return response.workflows
    }

    if (Array.isArray(response?.data?.workflows)) {
        return response.data.workflows
    }

    if (Array.isArray(response?.data)) {
        return response.data
    }

    return []
}

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

function StatCard({ title, value, description, icon: Icon, iconClass }) {
    return (
        <section className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#737B8C]">
                        {title}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-[#171B25]">
                        {value}
                    </h2>

                    <p className="mt-1 text-[10px] text-[#8A91A0]">
                        {description}
                    </p>
                </div>

                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon size={19} />
                </div>
            </div>
        </section>
    )
}

function StatusBadge({ status }) {
    const isPublished = status === 'Published'

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${isPublished
                    ? 'bg-[#EAF8F0] text-[#15934A]'
                    : 'bg-[#FFF5E6] text-[#B7791F]'
                }`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status || 'Draft'}
        </span>
    )
}

function WorkflowHome() {
    const navigate = useNavigate()

    const [workflows, setWorkflows] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [actionError, setActionError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [selectedStatus, setSelectedStatus] = useState('All Statuses')

    const [selectedWorkflow, setSelectedWorkflow] = useState(null)
    const [processingId, setProcessingId] = useState('')

    const fetchWorkflows = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError('')
            setActionError('')

            const response = await api.get('/workflows')
            const workflowList = getWorkflowsFromResponse(response)

            setWorkflows(workflowList)
        } catch (err) {
            setError(err.message || 'Unable to load workflows.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchWorkflows()
    }, [fetchWorkflows])

    const categories = useMemo(() => {
        const values = workflows
            .map((workflow) => workflow.workflowCategory)
            .filter(Boolean)

        return ['All Categories', ...new Set(values)]
    }, [workflows])

    const filteredWorkflows = useMemo(() => {
        const search = searchTerm.trim().toLowerCase()

        return workflows.filter((workflow) => {
            const matchesSearch =
                !search ||
                workflow.workflowName?.toLowerCase().includes(search) ||
                workflow.workflowDescription?.toLowerCase().includes(search) ||
                workflow.workflowCategory?.toLowerCase().includes(search)

            const matchesCategory =
                selectedCategory === 'All Categories' ||
                workflow.workflowCategory === selectedCategory

            const matchesStatus =
                selectedStatus === 'All Statuses' ||
                workflow.status === selectedStatus

            return matchesSearch && matchesCategory && matchesStatus
        })
    }, [workflows, searchTerm, selectedCategory, selectedStatus])

    const publishedCount = workflows.filter(
        (workflow) => workflow.status === 'Published'
    ).length

    const draftCount = workflows.filter(
        (workflow) => workflow.status === 'Draft'
    ).length

    const handleDelete = async (workflow) => {
        const workflowId = getWorkflowId(workflow)

        if (!workflowId) {
            setActionError('Workflow ID is missing.')
            return
        }

        if (workflow.status !== 'Draft') {
            setActionError('Only Draft workflows can be deleted.')
            return
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${workflow.workflowName}"?`
        )

        if (!confirmed) return

        try {
            setProcessingId(workflowId)
            setActionError('')
            setSuccessMessage('')

            await api.delete(`/workflows/${workflowId}`)

            setWorkflows((previous) =>
                previous.filter(
                    (item) => getWorkflowId(item) !== workflowId
                )
            )

            if (
                getWorkflowId(selectedWorkflow) === workflowId
            ) {
                setSelectedWorkflow(null)
            }

            setSuccessMessage('Workflow deleted successfully.')
        } catch (err) {
            setActionError(err.message || 'Unable to delete workflow.')
        } finally {
            setProcessingId('')
        }
    }

    const handlePublish = async (workflow) => {
        const workflowId = getWorkflowId(workflow)

        if (!workflowId) {
            setActionError('Workflow ID is missing.')
            return
        }

        if (workflow.status !== 'Draft') {
            setActionError('This workflow is already published.')
            return
        }

        const steps = getWorkflowSteps(workflow)

        const confirmed = window.confirm(
            `Publish "${workflow.workflowName}"?`
        )

        if (!confirmed) return

        try {
            setProcessingId(workflowId)
            setActionError('')
            setSuccessMessage('')

            const publishData = {
                workflowName: workflow.workflowName,
                workflowDescription: workflow.workflowDescription,
                workflowCategory: workflow.workflowCategory,
                workflowSteps: steps,
            }

            await api.post(
                `/workflows/${workflowId}/publish`,
                publishData
            )

            setSuccessMessage('Workflow published successfully.')
            await fetchWorkflows(true)
        } catch (err) {
            setActionError(err.message || 'Unable to publish workflow.')
        } finally {
            setProcessingId('')
        }
    }

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedCategory('All Categories')
        setSelectedStatus('All Statuses')
    }

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                {/* SIDEBAR */}

                <div className="h-screen shrink-0">
                    <ManagerSidebar />
                </div>

                {/* APPLICATION AREA */}

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* HEADER */}

                    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-5 lg:px-8">

                        <div className="flex h-10 w-full max-w-md items-center gap-2 rounded-lg bg-[#F4F5FA] px-3 text-xs text-[#737B8C]">
                            <Search size={15} />
                            <span>Workflow Automation Management</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <HeaderIcon>
                                <Activity size={17} strokeWidth={1.8} />
                            </HeaderIcon>

                            <HeaderIcon>
                                <Zap size={17} strokeWidth={1.8} />
                            </HeaderIcon>

                            <div className="hidden h-7 w-px bg-[#E1E4EA] sm:block" />

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0FF] text-xs font-bold text-[#0757C9]">
                                M
                            </div>
                        </div>
                    </header>

                    {/* MAIN CONTENT */}

                    <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">

                        <div className="w-full px-5 py-6 sm:px-6 lg:px-8 xl:px-10">

                            {/* PAGE TITLE */}

                            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-[10px] text-[#737B8C]">
                                        <span>Home</span>
                                        <span>›</span>
                                        <span>Workflow Automation</span>
                                    </div>

                                    <h1 className="text-[26px] font-bold tracking-tight text-[#171B25] sm:text-[28px]">
                                        Workflow Automation
                                    </h1>

                                    <p className="mt-1 text-xs text-[#737B8C] sm:text-sm">
                                        Create, organize and manage your automated business workflows.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate('/manager/automation')}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0757C9] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0649A8]"
                                >
                                    <Plus size={16} />
                                    Create Automation
                                </button>
                            </div>

                            {/* ALERTS */}

                            {error && (
                                <div
                                    role="alert"
                                    className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                                >
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <div className="flex-1">{error}</div>
                                    <button
                                        type="button"
                                        onClick={() => fetchWorkflows()}
                                        className="font-semibold underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {actionError && (
                                <div
                                    role="alert"
                                    className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                                >
                                    <AlertCircle size={15} />
                                    {actionError}
                                    <button
                                        type="button"
                                        onClick={() => setActionError('')}
                                        className="ml-auto"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            )}

                            {successMessage && (
                                <div
                                    role="status"
                                    className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800"
                                >
                                    <CheckCircle2 size={15} />
                                    {successMessage}
                                    <button
                                        type="button"
                                        onClick={() => setSuccessMessage('')}
                                        className="ml-auto"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            )}

                            {/* STATISTICS */}

                            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                                <StatCard
                                    title="Total Workflows"
                                    value={loading ? '—' : workflows.length}
                                    description="All saved workflows"
                                    icon={Workflow}
                                    iconClass="bg-[#EEF4FF] text-[#0757C9]"
                                />

                                <StatCard
                                    title="Published"
                                    value={loading ? '—' : publishedCount}
                                    description="Published workflow definitions"
                                    icon={CheckCircle2}
                                    iconClass="bg-[#EAF8F0] text-[#15934A]"
                                />

                                <StatCard
                                    title="Drafts"
                                    value={loading ? '—' : draftCount}
                                    description="Workflows awaiting publication"
                                    icon={FileText}
                                    iconClass="bg-[#FFF5E6] text-[#B7791F]"
                                />

                                <StatCard
                                    title="Categories"
                                    value={loading ? '—' : categories.length - 1}
                                    description="Categories in use"
                                    icon={Layers3}
                                    iconClass="bg-[#F3EEFF] text-[#7651C8]"
                                />

                            </div>

                            {/* WORKFLOW LIST */}

                            <section className={cardClass}>

                                {/* SECTION HEADER */}

                                <div className="flex flex-col gap-4 border-b border-[#EAECEF] p-5 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF4FF] text-[#0757C9]">
                                                <Workflow size={16} />
                                            </div>

                                            <h2 className="text-sm font-bold text-[#171B25]">
                                                All Workflows
                                            </h2>

                                            <span className="rounded-full bg-[#F1F3F7] px-2 py-0.5 text-[9px] font-bold text-[#59606E]">
                                                {loading ? '...' : filteredWorkflows.length}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-[10px] text-[#737B8C]">
                                            Manage your saved automation workflows.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => fetchWorkflows(true)}
                                        disabled={refreshing || loading}
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#DDE2EA] px-3 text-[10px] font-semibold text-[#59606E] transition hover:border-[#0757C9] hover:text-[#0757C9] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            size={13}
                                            className={refreshing ? 'animate-spin' : ''}
                                        />
                                        Refresh
                                    </button>
                                </div>

                                {/* FILTERS */}

                                <div className="grid grid-cols-1 gap-3 border-b border-[#EAECEF] p-5 md:grid-cols-3">

                                    <div className="relative">
                                        <Search
                                            size={15}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9299A7]"
                                        />

                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(event) =>
                                                setSearchTerm(event.target.value)
                                            }
                                            placeholder="Search workflows..."
                                            className={`${inputClass} pl-9`}
                                        />
                                    </div>

                                    <select
                                        value={selectedCategory}
                                        onChange={(event) =>
                                            setSelectedCategory(event.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedStatus}
                                        onChange={(event) =>
                                            setSelectedStatus(event.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        <option value="All Statuses">All Statuses</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Published">Published</option>
                                    </select>
                                </div>

                                {/* WORKFLOW RESULTS */}

                                <div className="p-5">

                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <RefreshCw
                                                size={25}
                                                className="animate-spin text-[#0757C9]"
                                            />
                                            <p className="mt-4 text-xs font-semibold text-[#273142]">
                                                Loading workflows...
                                            </p>
                                            <p className="mt-1 text-[10px] text-[#8A91A0]">
                                                Retrieving your saved workflows.
                                            </p>
                                        </div>
                                    ) : filteredWorkflows.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#0757C9]">
                                                <Workflow size={25} />
                                            </div>

                                            <h3 className="mt-4 text-sm font-bold text-[#273142]">
                                                {workflows.length === 0
                                                    ? 'No workflows created yet'
                                                    : 'No matching workflows found'}
                                            </h3>

                                            <p className="mt-2 max-w-sm text-[10px] leading-5 text-[#737B8C]">
                                                {workflows.length === 0
                                                    ? 'Start building your first automation workflow to streamline your business operations.'
                                                    : 'Try changing your search or filters to find the workflow you are looking for.'}
                                            </p>

                                            {workflows.length === 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/manager/automation')}
                                                    className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#0757C9] px-4 text-[10px] font-semibold text-white hover:bg-[#0649A8]"
                                                >
                                                    <Plus size={14} />
                                                    Create Your First Automation
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={clearFilters}
                                                    className="mt-5 text-[10px] font-semibold text-[#0757C9] hover:underline"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredWorkflows.map((workflow) => {
                                                const workflowId = getWorkflowId(workflow)
                                                const steps = getWorkflowSteps(workflow)
                                                const isProcessing =
                                                    processingId === workflowId

                                                return (
                                                    <article
                                                        key={workflowId}
                                                        className="rounded-xl border border-[#E5E8EE] p-4 transition hover:border-[#B8CBEA] hover:shadow-[0_3px_12px_rgba(20,35,60,0.05)] sm:p-5"
                                                    >
                                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                                                            <div className="min-w-0 flex-1">

                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF] text-[#0757C9]">
                                                                        <Zap size={17} />
                                                                    </div>

                                                                    <h3 className="min-w-0 wrap-break-word text-sm font-bold text-[#273142]">
                                                                        {workflow.workflowName}
                                                                    </h3>

                                                                    <StatusBadge status={workflow.status} />
                                                                </div>

                                                                <p className="mt-3 max-w-3xl text-[10px] leading-5 text-[#737B8C]">
                                                                    {workflow.workflowDescription ||
                                                                        'No description provided.'}
                                                                </p>

                                                                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] text-[#737B8C]">

                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <Layers3 size={12} />
                                                                        {workflow.workflowCategory || 'Uncategorized'}
                                                                    </span>

                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <Workflow size={12} />
                                                                        {steps.length} steps
                                                                    </span>

                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <CalendarDays size={12} />
                                                                        Created {formatDate(workflow.createdAt)}
                                                                    </span>

                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <Clock3 size={12} />
                                                                        Updated {formatDate(workflow.updatedAt)}
                                                                    </span>

                                                                </div>
                                                            </div>

                                                            {/* ACTIONS */}

                                                            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSelectedWorkflow(workflow)
                                                                    }
                                                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDE2EA] px-3 text-[9px] font-semibold text-[#59606E] transition hover:border-[#0757C9] hover:text-[#0757C9]"
                                                                >
                                                                    View Details
                                                                    <ArrowUpRight size={12} />
                                                                </button>

                                                                {workflow.status === 'Draft' && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handlePublish(workflow)}
                                                                            disabled={isProcessing}
                                                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0757C9] px-3 text-[9px] font-semibold text-white transition hover:bg-[#0649A8] disabled:opacity-50"
                                                                        >
                                                                            <CheckCircle2 size={12} />
                                                                            {isProcessing ? 'Processing...' : 'Publish'}
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDelete(workflow)}
                                                                            disabled={isProcessing}
                                                                            title="Delete draft workflow"
                                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F1DADA] text-[#D04444] transition hover:bg-[#FFF1F1] disabled:opacity-50"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </>
                                                                )}

                                                            </div>
                                                        </div>
                                                    </article>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* FOOTER */}

                                {!loading && workflows.length > 0 && (
                                    <div className="flex flex-col gap-2 border-t border-[#EAECEF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-[9px] text-[#8A91A0]">
                                            Showing {filteredWorkflows.length} of {workflows.length} workflows
                                        </p>

                                        <p className="text-[9px] text-[#8A91A0]">
                                            Data retrieved from BizFlow backend
                                        </p>
                                    </div>
                                )}
                            </section>

                            {/* WORKFLOW DETAILS MODAL */}

                            {selectedWorkflow && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 p-4"
                                    onClick={() => setSelectedWorkflow(null)}
                                >
                                    <div
                                        role="dialog"
                                        aria-modal="true"
                                        aria-labelledby="workflow-detail-title"
                                        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between border-b border-[#EAECEF] p-5">
                                            <div>
                                                <h2
                                                    id="workflow-detail-title"
                                                    className="text-base font-bold text-[#171B25]"
                                                >
                                                    Workflow Details
                                                </h2>
                                                <p className="mt-1 text-[10px] text-[#737B8C]">
                                                    Workflow configuration and saved steps
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setSelectedWorkflow(null)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#737B8C] hover:bg-[#F4F5F8]"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-5 p-5">

                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-[#273142]">
                                                        {selectedWorkflow.workflowName}
                                                    </h3>
                                                    <StatusBadge status={selectedWorkflow.status} />
                                                </div>

                                                <p className="text-xs leading-6 text-[#737B8C]">
                                                    {selectedWorkflow.workflowDescription ||
                                                        'No description provided.'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="rounded-lg bg-[#F8F9FC] p-3">
                                                    <p className="text-[9px] font-semibold uppercase text-[#8A91A0]">
                                                        Category
                                                    </p>
                                                    <p className="mt-1 text-xs font-semibold text-[#273142]">
                                                        {selectedWorkflow.workflowCategory}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-[#F8F9FC] p-3">
                                                    <p className="text-[9px] font-semibold uppercase text-[#8A91A0]">
                                                        Created Date
                                                    </p>
                                                    <p className="mt-1 text-xs font-semibold text-[#273142]">
                                                        {formatDate(selectedWorkflow.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="mb-3 text-xs font-bold text-[#273142]">
                                                    Workflow Steps ({getWorkflowSteps(selectedWorkflow).length})
                                                </h3>

                                                <div className="space-y-2">
                                                    {getWorkflowSteps(selectedWorkflow).map((step, index) => (
                                                        <div
                                                            key={step.id || index}
                                                            className="flex items-start gap-3 rounded-lg border border-[#E5E8EE] p-3"
                                                        >
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF] text-[10px] font-bold text-[#0757C9]">
                                                                {step.number || index + 1}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-semibold text-[#273142]">
                                                                    {step.title || step.type || 'Workflow step'}
                                                                </p>

                                                                <p className="mt-1 text-[9px] text-[#737B8C]">
                                                                    {step.description || step.typeKey || 'No additional details'}
                                                                </p>

                                                                <p className="mt-1 text-[9px] text-[#8A91A0]">
                                                                    Type: {step.type || 'Not specified'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {getWorkflowSteps(selectedWorkflow).length === 0 && (
                                                        <p className="rounded-lg bg-[#F8F9FC] p-4 text-center text-[10px] text-[#737B8C]">
                                                            No workflow steps found.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end border-t border-[#EAECEF] p-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedWorkflow(null)}
                                                className="h-9 rounded-lg border border-[#DDE2EA] px-5 text-[10px] font-semibold text-[#59606E] hover:bg-[#F8F9FC]"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </main>
                </div>
            </div>
        </main>
    )
}

export default WorkflowHome
