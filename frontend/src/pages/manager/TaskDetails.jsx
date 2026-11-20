
import ManagerSidebar from '../../components/sidebar/ManagerSidebar'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Flag,
    MessageSquare,
    Printer,
    Send,
    Tag,
    UserRound,
    RefreshCw,
} from 'lucide-react'

function TaskDetails() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [comment, setComment] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)

    const extractTask = (response) => {
        const body = response?.data ?? response
        return body?.data ?? body
    }

    useEffect(() => {
        let cancelled = false

        const loadTask = async () => {
            try {
                const response = await api.get(`/tasks/${id}`)
                const taskData = extractTask(response)

                if (!taskData?._id) {
                    throw new Error('Task details could not be found.')
                }

                if (!cancelled) {
                    setTask(taskData)
                    setError('')
                }
            } catch (err) {
                console.error('Task details loading error:', err)

                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        'Unable to load task details.'
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        if (id) loadTask()

        return () => {
            cancelled = true
        }
    }, [id])

    const formatDate = (date) => {
        if (!date) return 'Not set'

        const parsed = new Date(date)

        if (Number.isNaN(parsed.getTime())) return 'Not available'

        return parsed.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const formatDateTime = (date) => {
        if (!date) return 'Not available'

        const parsed = new Date(date)

        if (Number.isNaN(parsed.getTime())) return 'Not available'

        return parsed.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getInitials = (name = '') => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join('')
    }

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'Critical':
                return 'bg-red-50 text-red-700 border-red-200'
            case 'High':
                return 'bg-orange-50 text-orange-700 border-orange-200'
            case 'Medium':
                return 'bg-amber-50 text-amber-700 border-amber-200'
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200'
        }
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-50 text-green-700 border-green-200'
            case 'In Progress':
                return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'Review':
                return 'bg-purple-50 text-purple-700 border-purple-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getRemainingDays = (dueDate) => {
        if (!dueDate) return null

        const due = new Date(dueDate)
        if (Number.isNaN(due.getTime())) return null

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        due.setHours(0, 0, 0, 0)

        return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    }

    const remainingDays = getRemainingDays(task?.dueDate)
    const progress = Math.min(100, Math.max(0, Number(task?.progress) || 0))

    const updateTaskStatus = async (newStatus) => {
        if (!task || saving || task.status === newStatus) return

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            const newProgress =
                newStatus === 'Completed'
                    ? 100
                    : newStatus === 'Pending'
                        ? 0
                        : newStatus === 'In Progress' && progress === 100
                            ? 50
                            : progress

            const response = await api.patch(
                `/tasks/${task._id}/status`,
                {
                    status: newStatus,
                    progress: newProgress,
                }
            )

            const updatedTask = extractTask(response)

            if (updatedTask?._id) {
                setTask(updatedTask)
            } else {
                setTask((previous) => ({
                    ...previous,
                    status: newStatus,
                    progress: newProgress,
                }))
            }

            setSuccess('Task status updated successfully.')
        } catch (err) {
            console.error('Task status update error:', err)

            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to update task status.'
            )
        } finally {
            setSaving(false)
        }
    }

    const addComment = async (event) => {
        event.preventDefault()

        if (!comment.trim() || submittingComment || !task) return

        try {
            setSubmittingComment(true)
            setError('')
            setSuccess('')

            await api.post(
                `/tasks/${task._id}/comments`,
                {
                    message: comment.trim(),
                }
            )

            setComment('')

            // Reload populated task data so the latest comment
            // and its user information are displayed.
            const response = await api.get(`/tasks/${task._id}`)
            const updatedTask = extractTask(response)

            if (updatedTask?._id) {
                setTask(updatedTask)
            }

            setSuccess('Comment added successfully.')
        } catch (err) {
            console.error('Add comment error:', err)

            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to add comment.'
            )
        } finally {
            setSubmittingComment(false)
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC]">
                <div className="text-center">
                    <RefreshCw className="mx-auto animate-spin text-[#0757C9]" size={30} />
                    <p className="mt-3 text-sm text-gray-500">
                        Loading task details...
                    </p>
                </div>
            </main>
        )
    }

    if (!task) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC]">
                <div className="max-w-md px-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Task not found
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {error || 'Unable to retrieve this task.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/manager/tasks')}
                        className="mt-5 rounded-lg bg-[#0757C9] px-5 py-2.5 text-sm font-medium text-white"
                    >
                        Back to Task Management
                    </button>
                </div>
            </main>
        )
    }

    const assignee = task.assignedTo
    const creator = task.createdBy
    const comments = Array.isArray(task.comments) ? task.comments : []
    const tags = Array.isArray(task.tags) ? task.tags : []

    return (
        <main className="h-screen overflow-hidden bg-[#F7F8FC] text-[#202635]">
            <div className="flex h-full">

                <ManagerSidebar />

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

                    {/* Header */}
                    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E6E9F0] bg-white px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/manager/tasks')}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                                aria-label="Back to tasks"
                            >
                                <ArrowLeft size={17} />
                            </button>

                            <div>
                                <p className="text-xs text-gray-400">
                                    Task Management / Details
                                </p>
                                <h1 className="text-sm font-semibold text-gray-800">
                                    {task.taskId || 'Task Details'}
                                </h1>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                            <Printer size={15} />
                            Print
                        </button>
                    </header>

                    {/* Scrollable page */}
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="mx-auto max-w-362.5 space-y-5 px-5 py-7 lg:px-8">

                            {/* Page heading */}
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-[#0757C9]">
                                        Task overview
                                    </p>
                                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#202635]">
                                        {task.title}
                                    </h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                                        {task.description || 'No description has been provided for this task.'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getPriorityStyle(task.priority)}`}>
                                        <Flag className="mr-1 inline" size={12} />
                                        {task.priority || 'Low'} Priority
                                    </span>

                                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(task.status)}`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>

                            {/* Alerts */}
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    {success}
                                </div>
                            )}

                            {/* Main layout */}
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

                                {/* Left column */}
                                <div className="min-w-0 space-y-5">

                                    {/* Progress card */}
                                    <section className="rounded-xl border border-[#E6E9F0] bg-white p-5 shadow-sm">
                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-800">
                                                    Task Progress
                                                </h3>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Current completion based on recorded progress
                                                </p>
                                            </div>

                                            <span className="text-2xl font-bold text-[#0757C9]">
                                                {progress}%
                                            </span>
                                        </div>

                                        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#EDF0F6]">
                                            <div
                                                className="h-full rounded-full bg-[#0757C9] transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>

                                        <div className="mt-3 flex justify-between text-[11px] text-gray-400">
                                            <span>0%</span>
                                            <span>100%</span>
                                        </div>
                                    </section>

                                    {/* Task information */}
                                    <section className="rounded-xl border border-[#E6E9F0] bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <h3 className="text-sm font-semibold text-gray-800">
                                                Task Information
                                            </h3>
                                            <span className="text-xs text-gray-400">
                                                ID: {task.taskId || task._id}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
                                            <div>
                                                <p className="text-xs text-gray-400">Category</p>
                                                <p className="mt-1.5 text-sm font-medium text-gray-700">
                                                    {task.category || 'Not specified'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-400">Priority</p>
                                                <p className="mt-1.5 text-sm font-medium text-gray-700">
                                                    {task.priority || 'Not specified'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-400">Status</p>
                                                <p className="mt-1.5 text-sm font-medium text-gray-700">
                                                    {task.status || 'Not specified'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-400">Start Date</p>
                                                <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                                                    <CalendarDays size={14} className="text-gray-400" />
                                                    {formatDate(task.startDate)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-400">Due Date</p>
                                                <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                                                    <CalendarDays size={14} className="text-gray-400" />
                                                    {formatDate(task.dueDate)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-400">Created</p>
                                                <p className="mt-1.5 text-sm font-medium text-gray-700">
                                                    {formatDate(task.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {tags.length > 0 && (
                                            <div className="border-t border-gray-100 pt-4">
                                                <p className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500">
                                                    <Tag size={14} />
                                                    Task Tags
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {tags.map((tag, index) => (
                                                        <span
                                                            key={`${tag}-${index}`}
                                                            className="rounded-md bg-[#F0F4FC] px-3 py-1.5 text-xs font-medium text-[#315A9E]"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    {/* Schedule */}
                                    <section className="rounded-xl border border-[#E6E9F0] bg-white p-5 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Schedule
                                        </h3>

                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="rounded-lg bg-[#F7F8FC] p-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <CalendarDays size={15} />
                                                    Start Date
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-gray-800">
                                                    {formatDate(task.startDate)}
                                                </p>
                                            </div>

                                            <div className="rounded-lg bg-[#F7F8FC] p-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Clock3 size={15} />
                                                    Due Date
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-gray-800">
                                                    {formatDate(task.dueDate)}
                                                </p>

                                                {remainingDays !== null && task.status !== 'Completed' && (
                                                    <p className={`mt-1 text-xs ${remainingDays < 0
                                                            ? 'text-red-600'
                                                            : remainingDays === 0
                                                                ? 'text-orange-600'
                                                                : 'text-green-600'
                                                        }`}>
                                                        {remainingDays < 0
                                                            ? `${Math.abs(remainingDays)} days overdue`
                                                            : remainingDays === 0
                                                                ? 'Due today'
                                                                : `${remainingDays} days remaining`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Discussion */}
                                    <section className="overflow-hidden rounded-xl border border-[#E6E9F0] bg-white shadow-sm">
                                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-800">
                                                    Discussion
                                                </h3>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                                                </p>
                                            </div>
                                            <MessageSquare size={18} className="text-gray-400" />
                                        </div>

                                        <div className="max-h-105 min-h-32 space-y-5 overflow-y-auto p-5">
                                            {comments.length > 0 ? (
                                                comments.map((item, index) => {
                                                    const name = item.user?.fullName || 'Unknown User'

                                                    return (
                                                        <div key={item._id || index} className="flex gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8EFFB] text-xs font-semibold text-[#315A9E]">
                                                                {getInitials(name)}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                                    <p className="text-xs font-semibold text-gray-800">
                                                                        {name}
                                                                    </p>
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {formatDateTime(item.createdAt)}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-2 rounded-lg rounded-tl-none bg-[#F5F6FA] px-4 py-3">
                                                                    <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-600">
                                                                        {item.message}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="flex min-h-32 flex-col items-center justify-center text-center">
                                                    <MessageSquare size={25} className="text-gray-300" />
                                                    <p className="mt-3 text-sm font-medium text-gray-500">
                                                        No discussion yet
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Add the first comment to this task.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <form
                                            onSubmit={addComment}
                                            className="flex items-center gap-3 border-t border-gray-100 bg-[#FAFBFD] p-4"
                                        >
                                            <input
                                                type="text"
                                                value={comment}
                                                onChange={(event) => setComment(event.target.value)}
                                                placeholder="Write a comment..."
                                                maxLength={1000}
                                                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#0757C9]"
                                            />

                                            <button
                                                type="submit"
                                                disabled={!comment.trim() || submittingComment}
                                                className="flex h-10 items-center gap-2 rounded-lg bg-[#0757C9] px-4 text-xs font-medium text-white transition hover:bg-[#0647A6] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Send size={14} />
                                                {submittingComment ? 'Sending...' : 'Send'}
                                            </button>
                                        </form>
                                    </section>
                                </div>

                                {/* Right column */}
                                <aside className="space-y-5">

                                    {/* Assignee */}
                                    <section className="rounded-xl border border-[#E6E9F0] bg-white p-5 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Assigned Personnel
                                        </h3>

                                        {assignee ? (
                                            <div className="mt-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8EFFB] text-sm font-bold text-[#315A9E]">
                                                        {getInitials(assignee.fullName || 'User')}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-800">
                                                            {assignee.fullName || 'Unknown User'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            {assignee.role || 'Staff'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {assignee.email && (
                                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                                        <p className="text-[11px] text-gray-400">
                                                            Email Address
                                                        </p>
                                                        <p className="mt-1 break-all text-xs text-gray-600">
                                                            {assignee.email}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-5 flex flex-col items-center rounded-lg bg-[#F7F8FC] px-4 py-7 text-center">
                                                <UserRound size={30} className="text-gray-300" />
                                                <p className="mt-2 text-sm font-medium text-gray-600">
                                                    Unassigned
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    No employee assigned to this task.
                                                </p>
                                            </div>
                                        )}
                                    </section>

                                    {/* Creator */}
                                    <section className="rounded-xl border border-[#E6E9F0] bg-white p-5 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Task Created By
                                        </h3>

                                        {creator && typeof creator === 'object' ? (
                                            <div className="mt-4 flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F1F5] text-xs font-semibold text-gray-600">
                                                    {getInitials(creator.fullName || 'User')}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-700">
                                                        {creator.fullName || 'Unknown User'}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-gray-400">
                                                        {creator.email || ''}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="mt-3 text-xs text-gray-400">
                                                Creator information unavailable.
                                            </p>
                                        )}

                                        <div className="mt-4 border-t border-gray-100 pt-4">
                                            <p className="text-[11px] text-gray-400">
                                                Last Updated
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-gray-600">
                                                {formatDateTime(task.updatedAt)}
                                            </p>
                                        </div>

                                        {task.updatedBy && typeof task.updatedBy === 'object' && (
                                            <div className="mt-3">
                                                <p className="text-[11px] text-gray-400">
                                                    Updated By
                                                </p>
                                                <p className="mt-1 text-xs font-medium text-gray-600">
                                                    {task.updatedBy.fullName || 'Unknown User'}
                                                </p>
                                            </div>
                                        )}
                                    </section>

                                    {/* Task actions */}
                                    <section className="rounded-xl border border-[#E6E9F0] bg-white p-5 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Update Task Status
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Change the current task status.
                                        </p>

                                        <div className="mt-4 space-y-2">
                                            {['Pending', 'In Progress', 'Review', 'Completed'].map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    disabled={saving || task.status === status}
                                                    onClick={() => updateTaskStatus(status)}
                                                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-xs font-medium transition ${task.status === status
                                                            ? 'border-[#0757C9] bg-[#F0F5FF] text-[#0757C9]'
                                                            : 'border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                        } disabled:cursor-not-allowed`}
                                                >
                                                    <span>{status}</span>
                                                    {task.status === status && (
                                                        <CheckCircle2 size={15} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {saving && (
                                            <p className="mt-3 text-center text-xs text-gray-400">
                                                Updating task...
                                            </p>
                                        )}
                                    </section>

                                </aside>
                            </div>

                            {/* Footer */}
                            <footer className="border-t border-[#E6E9F0] py-5">
                                <div className="flex flex-col justify-between gap-2 text-[11px] text-gray-400 sm:flex-row">
                                    <p>
                                        © 2026 BizFlow | Business Process Automation System
                                    </p>
                                    <p>
                                        Task ID: {task.taskId || task._id}
                                    </p>
                                </div>
                            </footer>

                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default TaskDetails
