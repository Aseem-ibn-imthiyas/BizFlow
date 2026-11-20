import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AlertCircle,
    ArrowUpDown,
    Bell,
    CheckCircle2,
    CircleHelp,
    Clock3,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Workflow,
    X,
} from 'lucide-react'

import AdminSidebar from '../../components/sidebar/AdminSidebar'

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '')

// Update this path to match the route in your App.jsx.
// const CREATE_WORKFLOW_PATH = '/admin/workflows/create'
const CREATE_WORKFLOW_PATH = '/admin/workflow'
function formatDate(date) {
    if (!date) return '—'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return '—'

    return parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function WorkflowHome() {
    const navigate = useNavigate()

    const [workflows, setWorkflows] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [sortOrder, setSortOrder] = useState('newest')
    const [workflowToDelete, setWorkflowToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    const fetchWorkflows = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        setError('')

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/workflows`,
                { cache: 'no-store' }
            )

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || 'Unable to load workflows.'
                )
            }

            setWorkflows(
                Array.isArray(data.workflows) ? data.workflows : []
            )
        } catch (err) {
            setError(
                err.message ||
                'Could not connect to the BizFlow backend.'
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])


    const handleDeleteWorkflow = async () => {
        if (!workflowToDelete || deleting) return

        setDeleting(true)
        setDeleteError('')

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/workflows/${workflowToDelete._id}`,
                { method: 'DELETE' }
            )

            const data = await response.json().catch(() => ({}))

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete workflow.')
            }

            setWorkflows((previous) =>
                previous.filter((item) => item._id !== workflowToDelete._id)
            )

            setWorkflowToDelete(null)
        } catch (error) {
            setDeleteError(
                error.message || 'Could not delete the workflow. Please try again.'
            )
        } finally {
            setDeleting(false)
        }
    }


    useEffect(() => {
        const loadWorkflows = async () => {
            await fetchWorkflows()
        }

        loadWorkflows()
    }, [fetchWorkflows])

    const draftCount = workflows.filter(
        (workflow) => workflow.status === 'Draft'
    ).length

    const publishedCount = workflows.filter(
        (workflow) => workflow.status === 'Published'
    ).length

    const filteredWorkflows = useMemo(() => {
        const query = searchTerm.trim().toLowerCase()

        return workflows
            .filter((workflow) => {
                const matchesSearch =
                    !query ||
                    workflow.workflowName?.toLowerCase().includes(query) ||
                    workflow.workflowDescription?.toLowerCase().includes(query) ||
                    workflow.workflowCategory?.toLowerCase().includes(query)

                const matchesStatus =
                    statusFilter === 'All' ||
                    workflow.status === statusFilter

                return matchesSearch && matchesStatus
            })
            .sort((a, b) => {
                const firstDate = new Date(a.updatedAt || 0).getTime()
                const secondDate = new Date(b.updatedAt || 0).getTime()

                return sortOrder === 'newest'
                    ? secondDate - firstDate
                    : firstDate - secondDate
            })
    }, [workflows, searchTerm, statusFilter, sortOrder])

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-full w-full overflow-hidden">
                <AdminSidebar />

                <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                    {/* Header styled to match AdminDashboard */}
                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E1E4EA] bg-white px-5 sm:px-6 lg:px-8">
                        <div className="relative min-w-0 flex-1 sm:max-w-72">
                            <Search
                                size={16}
                                strokeWidth={1.8}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                            />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search workflows..."
                                aria-label="Search workflows"
                                className="h-9 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-10 pr-9 text-xs text-[#343A47] outline-none transition placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#737A87] hover:bg-slate-100"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Bell size={18} strokeWidth={1.7} />
                            </button>
                            <button
                                type="button"
                                aria-label="Help"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <CircleHelp size={18} strokeWidth={1.7} />
                            </button>

                            <div className="hidden h-7 w-px bg-[#E1E4EA] sm:block" />

                            <div className="hidden items-center gap-3 sm:flex">
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-[#242936]">
                                        Admin User
                                    </p>
                                    <p className="text-[9px] font-medium tracking-wide text-[#737A87]">
                                        SYSTEM ADMIN
                                    </p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDE5F5] text-xs font-semibold text-[#315A9E]">
                                    AU
                                </div>
                            </div>

                        </div>
                    </header>

                    {/* Independently scrollable page content */}
                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-7">
                            {/* Page heading */}
                            <div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[#343A47]">Home</span>
                                    <span className="text-[#A1A6B0]">/</span>
                                    <span className="font-medium text-[#0757C9]">
                                        Workflow Automation
                                    </span>
                                </div>

                                <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-[#171B25]">
                                            Workflow Management
                                        </h2>
                                        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#69707D]">
                                            Create, find, and monitor your business process workflows.
                                        </p>
                                    </div>

                                    <div className="flex w-fit flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fetchWorkflows(true)}
                                            disabled={loading || refreshing}
                                            className="inline-flex items-center gap-2 rounded-md border border-[#DDE2EA] bg-white px-3 py-2 text-xs font-medium text-[#465064] shadow-sm transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <RefreshCw
                                                size={14}
                                                className={refreshing ? 'animate-spin' : ''}
                                            />
                                            Refresh
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/admin/workflow')}
                                            className="inline-flex items-center gap-2 rounded-md bg-[#0757C9] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0649A7]"
                                        >
                                            <Plus size={15} />
                                            Create Workflow
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Summary cards use the AdminDashboard style */}
                            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <SummaryCard
                                    title="Total Workflows"
                                    value={workflows.length}
                                    icon={Workflow}
                                    iconClass="bg-blue-50 text-blue-600"
                                    description="All saved workflows"
                                    valueClass="text-[#171B25]"
                                />
                                <SummaryCard
                                    title="Published"
                                    value={publishedCount}
                                    icon={CheckCircle2}
                                    iconClass="bg-emerald-50 text-emerald-600"
                                    description="Published workflows"
                                    valueClass="text-[#171B25]"
                                />
                                <SummaryCard
                                    title="Drafts"
                                    value={draftCount}
                                    icon={Clock3}
                                    iconClass="bg-orange-50 text-orange-600"
                                    description="Workflows in progress"
                                    valueClass="text-[#171B25]"
                                />
                            </div>

                            {/* Workflows table */}
                            <section className="mt-6 overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                <div className="flex flex-col gap-4 border-b border-[#E6E8ED] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            All Workflows
                                        </h3>
                                        <p className="mt-1 text-xs text-[#737A87]">
                                            Showing {filteredWorkflows.length} of {workflows.length} workflows
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <div className="relative sm:hidden">
                                            <Search
                                                size={15}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                                            />
                                            <input
                                                type="search"
                                                value={searchTerm}
                                                onChange={(event) => setSearchTerm(event.target.value)}
                                                placeholder="Search workflows..."
                                                aria-label="Search workflows"
                                                className="h-9 w-full rounded-md border border-[#DDE2EA] bg-white pl-9 pr-8 text-xs outline-none focus:border-[#0757C9]"
                                            />
                                            {searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchTerm('')}
                                                    aria-label="Clear search"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#737A87]"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>

                                        <select
                                            value={statusFilter}
                                            onChange={(event) => setStatusFilter(event.target.value)}
                                            aria-label="Filter by workflow status"
                                            className="h-9 rounded-md border border-[#DDE2EA] bg-white px-3 text-xs text-[#465064] outline-none focus:border-[#0757C9]"
                                        >
                                            <option value="All">All statuses</option>
                                            <option value="Draft">Draft</option>
                                            <option value="Published">Published</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSortOrder((current) =>
                                                    current === 'newest' ? 'oldest' : 'newest'
                                                )
                                            }
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#DDE2EA] bg-white px-3 text-xs font-medium text-[#465064] transition hover:bg-[#F8FAFC]"
                                        >
                                            <ArrowUpDown size={14} />
                                            {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="m-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">Could not load workflows</p>
                                            <p className="mt-1">{error}</p>
                                            <button
                                                type="button"
                                                onClick={() => fetchWorkflows()}
                                                className="mt-2 font-semibold underline underline-offset-2"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-190 border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-[#E6E8ED] bg-[#F9FAFD] text-[10px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                <th className="px-5 py-3.5">Workflow</th>
                                                <th className="px-4 py-3.5">Category</th>
                                                <th className="px-4 py-3.5">Steps</th>
                                                <th className="px-4 py-3.5">Status</th>
                                                <th className="px-5 py-3.5">Last updated</th>
                                                <th className="px-5 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#ECEEF2]">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-16 text-center">
                                                        <RefreshCw size={20} className="mx-auto mb-3 animate-spin text-[#0757C9]" />
                                                        <p className="text-sm font-medium text-[#343A47]">
                                                            Loading workflows from MongoDB...
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : !error && filteredWorkflows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-16 text-center">
                                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF4FF] text-[#0757C9]">
                                                            <Workflow size={23} />
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-[#242936]">
                                                            {workflows.length === 0
                                                                ? 'No workflows yet'
                                                                : 'No matching workflows'}
                                                        </p>
                                                        <p className="mt-1 text-sm text-[#737A87]">
                                                            {workflows.length === 0
                                                                ? 'Create your first workflow to get started.'
                                                                : 'Try changing your search or status filter.'}
                                                        </p>
                                                        {workflows.length === 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(CREATE_WORKFLOW_PATH)}
                                                                className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#0757C9] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0649A7]"
                                                            >
                                                                <Plus size={15} />
                                                                Create Workflow
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredWorkflows.map((workflow) => (
                                                    <tr
                                                        key={workflow._id}
                                                        className="transition-colors hover:bg-[#F9FAFD]"
                                                    >
                                                        <td className="max-w-90 px-5 py-4">
                                                            <div className="flex min-w-0 items-start gap-3">
                                                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EEF4FF] text-[#0757C9]">
                                                                    <Workflow size={17} strokeWidth={1.8} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-xs font-semibold text-[#242936]">
                                                                        {workflow.workflowName}
                                                                    </p>
                                                                    <p className="mt-1 truncate text-[11px] text-[#737A87]">
                                                                        {workflow.workflowDescription || 'No description provided'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex rounded-md border border-[#E1E4EA] bg-[#F8F9FC] px-2 py-1.5 text-[10px] font-medium text-[#465064]">
                                                                {workflow.workflowCategory || 'Uncategorized'}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-[#F1F3FA] px-2 py-1.5 text-xs font-semibold text-[#343A47]">
                                                                {Array.isArray(workflow.workflowSteps)
                                                                    ? workflow.workflowSteps.length
                                                                    : 0}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <StatusBadge status={workflow.status} />
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#737A87]">
                                                            {formatDate(workflow.updatedAt)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-5 py-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        navigate(`/admin/workflow?editId=${workflow._id}`)
                                                                    }
                                                                    title="Edit workflow"
                                                                    aria-label={`Edit ${workflow.workflowName}`}
                                                                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                                                >
                                                                    <Pencil size={14} />
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setWorkflowToDelete(workflow)
                                                                        setDeleteError('')
                                                                    }}
                                                                    title="Delete workflow"
                                                                    aria-label={`Delete ${workflow.workflowName}`}
                                                                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                                                >
                                                                    <Trash2 size={14} />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col gap-2 border-t border-[#E6E8ED] bg-[#F9FAFD] px-5 py-3 text-[10px] text-[#737A87] sm:flex-row sm:items-center sm:justify-between">
                                    <span>Workflow data is loaded from your BizFlow backend.</span>
                                    <span>
                                        Sorted by {sortOrder === 'newest'
                                            ? 'most recently updated'
                                            : 'least recently updated'}
                                    </span>
                                </div>
                            </section>

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <div className="flex flex-col gap-2 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">
                                    <p>
                                        © 2026 Business Process Automation System | Cloud-Based SaaS Platform
                                    </p>
                                    <p className="text-[#737A87]">
                                        BizFlow · Workflow Automation
                                    </p>
                                </div>
                            </footer>


                            {/* Delete Workflow Confirmation Modal */}
                            {workflowToDelete && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[3px]"
                                    onMouseDown={(event) => {
                                        if (
                                            event.target === event.currentTarget &&
                                            !deleting
                                        ) {
                                            setWorkflowToDelete(null)
                                            setDeleteError('')
                                        }
                                    }}
                                >
                                    <div
                                        role="alertdialog"
                                        aria-modal="true"
                                        aria-labelledby="delete-modal-title"
                                        aria-describedby="delete-modal-description"
                                        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                                    >
                                        {/* Modal Header */}
                                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                                    <Trash2 size={23} strokeWidth={1.8} />
                                                </div>

                                                <div>
                                                    <h2
                                                        id="delete-modal-title"
                                                        className="text-lg font-bold tracking-tight text-slate-900"
                                                    >
                                                        Delete workflow?
                                                    </h2>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Permanent deletion confirmation
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!deleting) {
                                                        setWorkflowToDelete(null)
                                                        setDeleteError('')
                                                    }
                                                }}
                                                disabled={deleting}
                                                aria-label="Close delete confirmation"
                                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {/* Modal Content */}
                                        <div className="px-6 py-5">
                                            <p
                                                id="delete-modal-description"
                                                className="text-sm leading-6 text-slate-600"
                                            >
                                                Are you sure you want to delete this workflow?
                                                This action cannot be undone.
                                            </p>

                                            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/70 p-4">
                                                <div className="flex items-start gap-3">
                                                    <Workflow
                                                        size={19}
                                                        className="mt-0.5 shrink-0 text-red-600"
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="wrap-break-word text-sm font-semibold text-slate-900">
                                                            {workflowToDelete.workflowName}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {workflowToDelete.workflowCategory ||
                                                                'Uncategorized'}
                                                            {' · '}
                                                            {Array.isArray(
                                                                workflowToDelete.workflowSteps
                                                            )
                                                                ? workflowToDelete.workflowSteps.length
                                                                : 0}{' '}
                                                            steps
                                                        </p>

                                                        <span className="mt-2 inline-flex rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                                                            {workflowToDelete.status || 'Draft'} workflow
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="mt-4 text-xs leading-5 text-slate-500">
                                                The workflow will be removed from your BizFlow
                                                workflow list once the deletion succeeds.
                                            </p>

                                            {deleteError && (
                                                <div
                                                    role="alert"
                                                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                                                >
                                                    {deleteError}
                                                </div>
                                            )}
                                        </div>

                                        {/* Modal Actions */}
                                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                                            <button
                                                type="button"
                                                disabled={deleting}
                                                onClick={() => {
                                                    setWorkflowToDelete(null)
                                                    setDeleteError('')
                                                }}
                                                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                disabled={deleting}
                                                onClick={handleDeleteWorkflow}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {deleting ? (
                                                    <>
                                                        <RefreshCw
                                                            size={15}
                                                            className="animate-spin"
                                                        />
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 size={15} />
                                                        Delete Workflow
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

function SummaryCard({ title, value, icon: Icon, iconClass, description, valueClass }) {
    return (
        <div className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-[#59606E]">{title}</p>
                    <p className={`mt-2 text-2xl font-bold leading-none ${valueClass}`}>
                        {value}
                    </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${iconClass}`}>
                    <Icon size={19} strokeWidth={1.8} />
                </div>
            </div>
            <p className="mt-3 text-xs font-medium text-[#737A87]">
                {description}
            </p>
        </div>
    )
}

function StatusBadge({ status }) {
    const isPublished = status === 'Published'

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[9px] font-semibold ${
                isPublished
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-orange-50 text-orange-600'
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    isPublished ? 'bg-emerald-500' : 'bg-orange-500'
                }`}
            />
            {isPublished ? 'Published' : status || 'Draft'}
        </span>
    )
}

export default WorkflowHome
