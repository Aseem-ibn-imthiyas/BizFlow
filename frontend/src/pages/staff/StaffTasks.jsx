import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import StaffSidebar from '../../components/sidebar/StaffSidebar'
import StaffHeader from '../../components/header/StaffHeader'
import {
    RefreshCw,
    CheckCircle2,
    Clock3,
    AlertTriangle,
    TrendingUp,
    ClipboardList,
    PauseCircle,
    CalendarDays,
    List,
    LayoutDashboard,
    MoreHorizontal,
    Paperclip,
    MessageSquare,
    Download,
    Info,
    ChevronDown,
    Eye,
    Search,
    XCircle,
    SlidersHorizontal
} from 'lucide-react'

const TASK_STATUSES = ['Pending', 'In Progress', 'Review', 'Completed']

const extractArray = (response, keys = ['tasks', 'items', 'results']) => {
    let current = response

    for (let i = 0; i < 5; i += 1) {
        if (Array.isArray(current)) return current
        if (!current || typeof current !== 'object') return []

        const matchingKey = keys.find((key) => Array.isArray(current[key]))
        if (matchingKey) return current[matchingKey]

        if (current.data !== undefined) {
            current = current.data
            continue
        }
        if (current.result !== undefined) {
            current = current.result
            continue
        }
        break
    }

    return []
}

const extractStats = (response) => {
    let current = response

    for (let i = 0; i < 5; i += 1) {
        if (!current || typeof current !== 'object') return {}
        if (
            current.summary ||
            current.workload ||
            current.recentTasks ||
            current.upcomingDeadlines
        ) return current

        if (current.data !== undefined) {
            current = current.data
            continue
        }
        break
    }

    return current || {}
}

function StaffTasks() {
    const navigate = useNavigate()
    const location = useLocation()

    const [tasks, setTasks] = useState([])
    const [taskStats, setTaskStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '')

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [dueDateFilter, setDueDateFilter] = useState('')
    const [sortBy, setSortBy] = useState('newest')

    const [draggedTaskId, setDraggedTaskId] = useState(null)
    const [dragOverStatus, setDragOverStatus] = useState(null)
    const [updatingTaskId, setUpdatingTaskId] = useState(null)

    const fetchTaskDashboard = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            setError('')

            const [tasksResponse, statsResponse] = await Promise.all([
                api.get('/tasks?limit=100&sortBy=updatedAt&order=desc'),
                api.get('/tasks/stats'),
            ])

            const taskData = extractArray(tasksResponse)
            const statsData = extractStats(statsResponse)

            setTasks(taskData)
            setTaskStats(statsData)
        } catch (err) {
            console.error('Staff task dashboard loading error:', err)
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to load your assigned tasks.'
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTaskDashboard()
    }, [fetchTaskDashboard, location.key])

    const summary = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const completed = tasks.filter((task) => task.status === 'Completed').length
        const overdue = tasks.filter((task) => {
            if (!task.dueDate || task.status === 'Completed') return false
            const due = new Date(task.dueDate)
            due.setHours(0, 0, 0, 0)
            return due < today
        }).length

        return {
            total: tasks.length,
            pending: tasks.filter((task) => task.status === 'Pending').length,
            inProgress: tasks.filter((task) => task.status === 'In Progress').length,
            review: tasks.filter((task) => task.status === 'Review').length,
            completed,
            overdue,
            completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        }
    }, [tasks])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filteredTasks = useMemo(() => {
        let result = [...tasks]

        if (search.trim()) {
            const term = search.trim().toLowerCase()
            result = result.filter((task) =>
                [task.taskId, task.title, task.category, task.description]
                    .some((value) => String(value || '').toLowerCase().includes(term))
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter((task) => task.status === statusFilter)
        }

        if (priorityFilter !== 'all') {
            result = result.filter((task) => String(task.priority || '').toLowerCase() === priorityFilter)
        }

        if (dueDateFilter) {
            result = result.filter((task) => {
                if (!task.dueDate) return false
                const due = new Date(task.dueDate)
                return !Number.isNaN(due.getTime()) && due.toISOString().slice(0, 10) === dueDateFilter
            })
        }

        result.sort((a, b) => {
            if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
            if (sortBy === 'priority') {
                const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 }
                return (rank[b.priority] || 0) - (rank[a.priority] || 0)
            }
            return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        })

        return result
    }, [tasks, search, statusFilter, priorityFilter, dueDateFilter, sortBy])

    const formatTaskDate = (value) => {
        if (!value) return 'No due date'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'No due date'
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const getPriorityClass = (priority) => {
        if (priority === 'Critical' || priority === 'High') return 'bg-red-50 text-red-600'
        if (priority === 'Medium') return 'bg-amber-50 text-amber-600'
        return 'bg-purple-50 text-purple-600'
    }

    const getStatusClass = (status) => {
        if (status === 'Completed') return 'bg-emerald-50 text-emerald-600'
        if (status === 'In Progress') return 'bg-blue-50 text-blue-600'
        if (status === 'Review') return 'bg-indigo-50 text-indigo-600'
        return 'bg-slate-100 text-slate-600'
    }

    const openTaskDetails = (task) => {
        navigate('/staff/StaffTaskDetails/', { state: { task, taskId: task?._id } })
    }

    const handleDrop = async (event, newStatus) => {
        event.preventDefault()
        const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId
        setDragOverStatus(null)
        setDraggedTaskId(null)
        if (!taskId) return

        const existingTask = tasks.find((task) => task._id === taskId)
        if (!existingTask || existingTask.status === newStatus) return

        const previousTasks = tasks
        let newProgress = Number(existingTask.progress ?? 0)
        if (newStatus === 'Completed') newProgress = 100
        else if (newStatus === 'Pending') newProgress = 0
        else if (newStatus === 'In Progress' && newProgress === 100) newProgress = 50

        setTasks((current) => current.map((task) => task._id === taskId
            ? { ...task, status: newStatus, progress: newProgress }
            : task
        ))
        setUpdatingTaskId(taskId)

        try {
            await api.patch(`/tasks/${taskId}/status`, {
                status: newStatus,
                progress: newProgress,
            })
            setSuccessMessage(`Task moved to ${newStatus}.`)
            await fetchTaskDashboard(true)
        } catch (err) {
            console.error('Task status update failed:', err)
            setTasks(previousTasks)
            setError(err.response?.data?.message || err.message || 'Unable to update task status.')
        } finally {
            setUpdatingTaskId(null)
        }
    }

    const handleExport = () => {
        if (!filteredTasks.length) {
            window.alert('There are no tasks to export.')
            return
        }

        const headers = ['Task ID', 'Title', 'Category', 'Priority', 'Status', 'Due Date', 'Progress']
        const rows = filteredTasks.map((task) => [
            task.taskId || task._id,
            task.title,
            task.category || '',
            task.priority || '',
            task.status || '',
            task.dueDate ? formatTaskDate(task.dueDate) : '',
            task.progress ?? 0,
        ])
        const escapeCSV = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
        const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'my-tasks.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    const stats = [
        { title: 'Assigned Tasks', value: summary.total, label: 'TOTAL', icon: ClipboardList, iconClass: 'bg-blue-50 text-blue-600' },
        { title: 'Completed', value: summary.completed, label: `${summary.completionRate}%`, icon: CheckCircle2, iconClass: 'bg-emerald-50 text-emerald-600', labelClass: 'text-emerald-600' },
        { title: 'In Progress', value: summary.inProgress, label: 'ACTIVE', icon: Clock3, iconClass: 'bg-blue-50 text-blue-600', labelClass: 'text-blue-600' },
        { title: 'Pending Approval', value: summary.review, label: 'REVIEW', icon: PauseCircle, iconClass: 'bg-amber-50 text-amber-600', labelClass: 'text-amber-600' },
        { title: 'Overdue', value: summary.overdue, label: 'OVERDUE', icon: AlertTriangle, iconClass: 'bg-red-50 text-red-600', labelClass: 'text-red-600' },
        { title: 'Completion Rate', value: `${summary.completionRate}%`, label: '', icon: TrendingUp, iconClass: 'bg-blue-600 text-white' },
    ]

    const workflowColumns = TASK_STATUSES.map((status) => ({
        title: status.toUpperCase(),
        status,
        tasks: filteredTasks.filter((task) => task.status === status),
    }))

    const activeTasks = filteredTasks.filter((task) => task.status !== 'Completed').slice(0, 10)

    const todayDeadlines = filteredTasks
        .filter((task) => task.dueDate && task.status !== 'Completed')
        .filter((task) => {
            const due = new Date(task.dueDate)
            due.setHours(0, 0, 0, 0)
            return due.getTime() === today.getTime()
        })
        .slice(0, 3)

    const upcomingDeadlines = (taskStats?.upcomingDeadlines || [])
        .filter((task) => task?.dueDate)
        .slice(0, 4)

    const recentActivity = (taskStats?.recentTasks || []).slice(0, 5)

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">
                <aside className="h-screen w-60 shrink-0 overflow-hidden lg:w-64">
                    <StaffSidebar />
                </aside>

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <div className="shrink-0"><StaffHeader /></div>

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-5 py-7 sm:px-6 lg:px-8">
                            <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-[#59606E]">Home</span>
                                        <span className="text-[#A1A6B0]">›</span>
                                        <span className="font-medium text-[#171B25]">Tasks</span>
                                    </div>
                                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25] sm:text-3xl">My Tasks</h1>
                                    <p className="mt-1 text-xs text-[#69707D]">Track, update, and complete your assigned tasks.</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => fetchTaskDashboard(true)} disabled={refreshing} className="flex h-9 items-center gap-2 rounded-md border border-[#D6DAE3] bg-white px-3 text-xs font-medium text-[#343A47] transition hover:bg-[#F8F9FC] disabled:opacity-60">
                                        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                                        {refreshing ? 'Refreshing...' : 'Refresh Tasks'}
                                    </button>
                                </div>
                            </section>

                            {successMessage && (
                                <div role="status" className="mt-4 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                                    <span className="flex items-center gap-2"><CheckCircle2 size={14} />{successMessage}</span>
                                    <button type="button" onClick={() => setSuccessMessage('')} className="font-semibold">Dismiss</button>
                                </div>
                            )}
                            {error && (
                                <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                    <span className="flex items-center gap-2"><XCircle size={14} />{error}</span>
                                    <button type="button" onClick={() => setError('')} aria-label="Dismiss error"><XCircle size={14} /></button>
                                </div>
                            )}
                            {loading && <div className="mt-4 rounded-lg border border-[#DCE1EB] bg-white p-4 text-xs text-[#69707D]">Loading your tasks...</div>}

                            <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                {stats.map((stat) => {
                                    const Icon = stat.icon
                                    return (
                                        <div key={stat.title} className="relative min-h-28 rounded-lg border border-[#DCE1EB] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                            <div className="flex items-start justify-between">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.iconClass}`}><Icon size={16} strokeWidth={1.8} /></div>
                                                {stat.label && <span className={`text-[8px] font-semibold ${stat.labelClass || 'text-[#8A909B]'}`}>{stat.label}</span>}
                                            </div>
                                            <p className="mt-3 text-2xl font-bold leading-none text-[#171B25]">{stat.value}</p>
                                            <p className="mt-1 text-[9px] font-medium text-[#59606E]">{stat.title}</p>
                                        </div>
                                    )
                                })}
                            </section>

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                                <section className="rounded-lg border border-[#DCE1EB] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium text-[#59606E]">Search Tasks</label>
                                            <div className="relative">
                                                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#858B97]" />
                                                <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search by ID or title" className="h-9 w-full rounded-md border border-[#CDD3E0] bg-[#F7F8FD] pl-9 pr-3 text-xs outline-none focus:border-[#8AAEE8]" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium text-[#59606E]">Status</label>
                                            <div className="relative">
                                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 w-full appearance-none rounded-md border border-[#CDD3E0] bg-[#F7F8FD] px-3 pr-8 text-xs outline-none focus:border-[#8AAEE8]">
                                                    <option value="all">All Statuses</option>
                                                    {TASK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737A87]" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium text-[#59606E]">Priority</label>
                                            <div className="relative">
                                                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-9 w-full appearance-none rounded-md border border-[#CDD3E0] bg-[#F7F8FD] px-3 pr-8 text-xs outline-none focus:border-[#8AAEE8]">
                                                    <option value="all">All Priorities</option>
                                                    <option value="critical">Critical</option>
                                                    <option value="high">High Priority</option>
                                                    <option value="medium">Medium Priority</option>
                                                    <option value="low">Low Priority</option>
                                                </select>
                                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737A87]" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium text-[#59606E]">Due Date</label>
                                            <input type="date" value={dueDateFilter} onChange={(event) => setDueDateFilter(event.target.value)} className="h-9 w-full rounded-md border border-[#CDD3E0] bg-[#F7F8FD] px-3 text-xs outline-none focus:border-[#8AAEE8]" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F4] pt-3">
                                        <div className="flex items-center gap-2 text-[9px] text-[#69707D]"><SlidersHorizontal size={12} />{filteredTasks.length} task(s) displayed</div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[9px] text-[#69707D]">Sort By</label>
                                            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-8 rounded-md border border-[#CDD3E0] bg-white px-2 text-[10px] outline-none">
                                                <option value="newest">Newest First</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="priority">Priority</option>
                                            </select>
                                            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setDueDateFilter(''); setSortBy('newest') }} className="h-8 rounded-md border border-[#D6DAE3] px-3 text-[10px] font-medium text-[#59606E] hover:bg-[#F8F9FC]">Clear Filters</button>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-lg border border-[#DCE1EB] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-[#242936]">Today's Deadlines</h3>
                                        <span className="rounded bg-red-50 px-2 py-1 text-[7px] font-bold text-red-500">{todayDeadlines.length} DUE</span>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {todayDeadlines.length ? todayDeadlines.map((task) => (
                                            <button type="button" key={task._id} onClick={() => openTaskDetails(task)} className="w-full rounded-md border border-red-200 bg-red-50/30 p-3 text-left transition hover:bg-red-50">
                                                <div className="flex gap-3"><div className="w-1 rounded-full bg-red-500" /><div className="min-w-0"><p className="text-[10px] font-semibold text-red-600">{task.title}</p><p className="mt-1 text-[9px] text-red-500">Due today</p><span className="mt-2 inline-flex rounded bg-red-50 px-1.5 py-1 text-[7px] font-bold text-red-500">{String(task.priority || 'NORMAL').toUpperCase()} PRIORITY</span></div></div>
                                            </button>
                                        )) : <p className="rounded-md bg-[#F7F8FD] p-4 text-center text-[9px] text-[#858B97]">No tasks are due today.</p>}
                                    </div>
                                </section>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                                <section className="rounded-lg border border-[#DCE1EB] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-[#242936]">Workflow Board</h3>
                                        <div className="flex items-center gap-2 text-[#59606E]"><LayoutDashboard size={14} /><List size={15} /></div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        {workflowColumns.map((column) => (
                                            <div key={column.status} className="min-w-0">
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-bold ${column.status === 'Completed' ? 'text-emerald-600' : column.status === 'In Progress' ? 'text-blue-600' : 'text-[#59606E]'}`}>{column.title}</span>
                                                        <span className={`rounded px-1.5 py-0.5 text-[8px] font-semibold ${getStatusClass(column.status)}`}>{column.tasks.length}</span>
                                                    </div>
                                                    <MoreHorizontal size={13} className="text-[#8B919D]" />
                                                </div>
                                                <div
                                                    onDragOver={(event) => { event.preventDefault(); setDragOverStatus(column.status) }}
                                                    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragOverStatus(null) }}
                                                    onDrop={(event) => handleDrop(event, column.status)}
                                                    className={`mt-2 min-h-75 rounded-md border border-dashed bg-[#FCFDFF] p-2 transition ${dragOverStatus === column.status ? 'border-[#0757C9] bg-blue-50 ring-2 ring-blue-100' : 'border-[#CBD2E0]'}`}
                                                >
                                                    {column.tasks.length === 0 ? <div className="flex h-24 items-center justify-center text-[9px] text-[#9AA0AA]">No tasks in this column</div> : (
                                                        <div className="space-y-2">
                                                            {column.tasks.slice(0, 8).map((task) => (
                                                                <div key={task._id} draggable={updatingTaskId !== task._id} onDragStart={(event) => { setDraggedTaskId(task._id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', task._id) }} onDragEnd={() => { setDraggedTaskId(null); setDragOverStatus(null) }} className={`rounded-md border border-[#E3E6EC] bg-white p-3 shadow-[0_1px_4px_rgba(15,23,42,0.03)] cursor-grab active:cursor-grabbing transition ${draggedTaskId === task._id ? 'opacity-40 scale-95' : ''} ${updatingTaskId === task._id ? 'pointer-events-none opacity-50' : ''}`}>
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className={`rounded px-1.5 py-0.5 text-[7px] font-semibold ${getPriorityClass(task.priority)}`}>{task.category || task.priority || 'GENERAL'}</span>
                                                                        <button type="button" onClick={() => openTaskDetails(task)} aria-label={`View ${task.title}`} className="text-[#7D8491] hover:text-[#0757C9]"><Info size={12} /></button>
                                                                    </div>
                                                                    <button type="button" onClick={() => openTaskDetails(task)} className="mt-2 block w-full text-left text-[10px] font-semibold leading-4 text-[#343A47] hover:text-[#0757C9]">{task.title}</button>
                                                                    {task.dueDate && <div className="mt-3 flex items-center justify-end gap-1 text-[8px] text-[#858B97]"><CalendarDays size={10} />{formatTaskDate(task.dueDate)}</div>}
                                                                    <div className="mt-3 h-1 rounded-full bg-[#E3E8F3]"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${Math.min(100, Math.max(0, Number(task.progress || 0)))}%` }} /></div>
                                                                    <div className="mt-2 flex items-center justify-between"><span className="text-[8px] text-[#59606E]">{Number(task.progress || 0)}% complete</span><span className="flex items-center gap-2 text-[8px] text-[#858B97]"><span className="flex items-center gap-1"><Paperclip size={9} />{task.attachments?.length || 0}</span><span className="flex items-center gap-1"><MessageSquare size={9} />{task.comments?.length || 0}</span></span></div>
                                                                </div>
                                                            ))}
                                                            {column.tasks.length > 8 && <p className="px-2 py-1 text-center text-[8px] text-[#69707D]">+{column.tasks.length - 8} more tasks</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-[8px] text-[#9AA0AA]">Drag a task card between columns to update its status.</p>
                                </section>

                                <section className="rounded-lg border border-[#DCE1EB] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                    <h3 className="text-sm font-semibold text-[#242936]">Productivity Insights</h3>
                                    <p className="mt-1 text-[9px] text-[#69707D]">Your task completion overview</p>
                                    <div className="mt-7 flex h-36 items-center justify-center">
                                        <div className="relative flex h-32 w-32 items-center justify-center">
                                            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
                                                <circle cx="60" cy="60" r="46" fill="none" stroke="#E9EDF5" strokeWidth="9" />
                                                <circle cx="60" cy="60" r="46" fill="none" stroke="#2563EB" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 46}`} strokeDashoffset={`${2 * Math.PI * 46 * (1 - summary.completionRate / 100)}`} />
                                            </svg>
                                            <div className="text-center"><p className="text-2xl font-bold text-[#171B25]">{summary.completionRate}%</p><p className="text-[7px] font-semibold text-[#69707D]">COMPLETED</p></div>
                                        </div>
                                    </div>
                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="rounded-md bg-[#F1F3FB] p-3 text-center"><p className="text-lg font-bold text-[#0052CC]">{summary.completed}</p><p className="mt-1 text-[7px] font-bold uppercase text-[#69707D]">COMPLETED</p></div>
                                        <div className="rounded-md bg-[#F1F3FB] p-3 text-center"><p className="text-lg font-bold text-amber-600">{summary.pending + summary.inProgress + summary.review}</p><p className="mt-1 text-[7px] font-bold uppercase text-[#69707D]">REMAINING</p></div>
                                    </div>
                                </section>
                            </div>

                            <section className="mt-5 overflow-hidden rounded-lg border border-[#DCE1EB] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                <div className="flex flex-col gap-3 border-b border-[#E4E7ED] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div><h3 className="text-sm font-semibold text-[#242936]">All Active Tasks</h3><p className="mt-1 text-[8px] text-[#858B97]">{activeTasks.length} active task(s) shown</p></div>
                                    <button type="button" onClick={handleExport} className="flex items-center gap-1 text-[10px] font-medium text-[#0052CC]"><Download size={11} />Export CSV</button>
                                </div>
                                <div className="hidden grid-cols-[100px_minmax(180px,1fr)_100px_120px_110px_120px_50px] bg-[#F4F5FC] px-5 py-3 md:grid">
                                    {['TASK ID', 'TITLE & CATEGORY', 'PRIORITY', 'STATUS', 'DUE DATE', 'PROGRESS', 'ACTIONS'].map((heading) => <span key={heading} className="text-[8px] font-bold text-[#59606E]">{heading}</span>)}
                                </div>
                                {activeTasks.length ? activeTasks.map((task) => (
                                    <div key={task._id} className="grid grid-cols-1 gap-3 border-t border-[#E8EAF0] px-5 py-4 md:grid-cols-[100px_minmax(180px,1fr)_100px_120px_110px_120px_50px] md:items-center md:gap-0">
                                        <span className="text-[9px] font-medium text-[#343A47]">{task.taskId || `#${String(task._id || '').slice(-6)}`}</span>
                                        <div><p className="text-xs font-medium text-[#343A47]">{task.title}</p><p className="mt-1 text-[8px] text-[#858B97]">{task.category || 'General'}</p></div>
                                        <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[7px] font-bold ${getPriorityClass(task.priority)}`}>{String(task.priority || 'Normal').toUpperCase()}</span>
                                        <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[7px] font-bold ${getStatusClass(task.status)}`}>{task.status || 'Pending'}</span>
                                        <span className="text-[9px] text-[#59606E]">{formatTaskDate(task.dueDate)}</span>
                                        <div className="w-20"><div className="h-1 rounded-full bg-[#E3E8F3]"><div className="h-full rounded-full bg-[#0052CC]" style={{ width: `${Math.min(100, Math.max(0, Number(task.progress || 0)))}%` }} /></div><span className="mt-1 block text-[7px] text-[#858B97]">{Number(task.progress || 0)}%</span></div>
                                        <button type="button" onClick={() => openTaskDetails(task)} aria-label={`View ${task.title}`} className="text-[#59606E] transition hover:text-[#0052CC]"><Eye size={13} /></button>
                                    </div>
                                )) : <div className="px-5 py-10 text-center text-xs text-[#858B97]">{loading ? 'Loading tasks...' : 'No active tasks match your filters.'}</div>}
                            </section>

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                                <section className="rounded-lg border border-[#DCE1EB] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                    <h3 className="text-sm font-semibold text-[#242936]">Recent Activity</h3>
                                    <div className="mt-4 space-y-4">
                                        {recentActivity.length ? recentActivity.map((activity, index) => {
                                            const Icon = activity.status === 'Completed' ? CheckCircle2 : Clock3
                                            return <div key={activity._id || `${activity.title}-${index}`} className="flex items-start gap-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${activity.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}><Icon size={13} /></span><div><p className="text-[10px] font-medium text-[#343A47]">{activity.title} – {activity.status}</p><p className="mt-1 text-[8px] text-[#858B97]">{activity.updatedBy?.fullName || 'Task update'} · {formatTaskDate(activity.updatedAt)}</p></div></div>
                                        }) : <p className="py-4 text-[9px] text-[#858B97]">No recent task activity is available.</p>}
                                    </div>
                                </section>

                                <section className="rounded-lg border border-[#DCE1EB] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                    <h3 className="text-sm font-semibold text-[#242936]">Upcoming Deadlines</h3>
                                    <div className="mt-4 space-y-2">
                                        {upcomingDeadlines.length ? upcomingDeadlines.map((task) => {
                                            const due = new Date(task.dueDate)
                                            const isToday = due.toDateString() === new Date().toDateString()
                                            return <button key={task._id} type="button" onClick={() => openTaskDetails(task)} className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left ${isToday ? 'border-orange-100 bg-orange-50 text-orange-600' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><span className="flex items-center gap-2"><CalendarDays size={14} /><span><span className="block text-[9px] font-semibold">{task.title}</span><span className="mt-0.5 block text-[8px] opacity-75">Due {formatTaskDate(task.dueDate)}</span></span></span><ChevronDown size={13} className="-rotate-90" /></button>
                                        }) : <p className="py-4 text-[9px] text-[#858B97]">No upcoming deadlines were returned.</p>}
                                    </div>
                                </section>
                            </div>

                            <footer className="mt-8 border-t border-[#DCE1EB] py-5">
                                <div className="flex flex-col gap-3 text-[9px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">
                                    <p>© 2026 BizFlow | Cloud-Based SaaS Platform</p>
                                    <div className="flex flex-wrap gap-5 text-[#343A47]"><button type="button">Privacy Policy</button><button type="button">Terms of Service</button><button type="button">Compliance</button></div>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default StaffTasks
