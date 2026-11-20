import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../services/api'
import {
    Bell,
    CircleHelp,
    Search,
    ClipboardList,
    Settings,
    Plus,
    RefreshCw,
    Download,
    CalendarDays,
    FileText,
    UserPlus,
    MoreHorizontal,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Zap,
    Eye,
    ChevronRight,
    SlidersHorizontal,
    MoreVertical,
} from 'lucide-react'

import ManagerSidebar from '../../components/sidebar/ManagerSidebar'

function TaskManagement() {


    const [draggedTaskId, setDraggedTaskId] = useState(null)
    const [dragOverStatus, setDragOverStatus] = useState(null)
    const [updatingTaskId, setUpdatingTaskId] = useState(null)
    const location = useLocation()

    const [successMessage, setSuccessMessage] = useState(
        location.state?.successMessage || ''
    )

    const navigate = useNavigate()

    const [tasks, setTasks] = useState([])
    const [taskStats, setTaskStats] = useState(null)
    const [assignees, setAssignees] = useState([])

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')

    const fetchTaskDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError('')

            const [
                tasksResponse,
                statsResponse,
                assigneesResponse,
            ] = await Promise.all([
                api.get('/tasks?limit=100&sortBy=updatedAt&order=desc'),
                api.get('/tasks/stats'),
                api.get('/tasks/assignees'),
            ])

            // Extract task array from different possible API response formats.
            const extractArray = (response, possibleKeys = []) => {
                let current = response

                for (let i = 0; i < 4; i++) {
                    if (Array.isArray(current)) {
                        return current
                    }

                    if (!current || typeof current !== 'object') {
                        return []
                    }

                    const arrayKey = possibleKeys.find(
                        (key) => Array.isArray(current[key])
                    )

                    if (arrayKey) {
                        return current[arrayKey]
                    }

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

            // Extract statistics object.
            const extractStats = (response) => {
                let current = response

                for (let i = 0; i < 4; i++) {
                    if (!current || typeof current !== 'object') {
                        return {}
                    }

                    if (
                        current.summary ||
                        current.workload ||
                        current.recentTasks ||
                        current.upcomingDeadlines
                    ) {
                        return current
                    }

                    if (current.data !== undefined) {
                        current = current.data
                        continue
                    }

                    break
                }

                return current || {}
            }

            const tasksData = extractArray(
                tasksResponse,
                ['tasks', 'items', 'results']
            )

            const statsData = extractStats(statsResponse)

            const assigneesData = extractArray(
                assigneesResponse,
                ['assignees', 'employees', 'users']
            )

            console.log('TASKS API:', tasksResponse)
            console.log('EXTRACTED TASKS:', tasksData)
            console.log('TASK STATISTICS:', statsData)

            setTasks(tasksData)
            setTaskStats(statsData)
            setAssignees(assigneesData)

            console.log('Total tasks:', tasksData.length)

            console.table(
                tasksData.map((task) => ({
                    mongoId: task._id,
                    taskId: task.taskId,
                    title: task.title,
                    status: task.status,
                }))
            )

        } catch (err) {
            console.error('Task dashboard loading error:', err)

            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to load task management data.'
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        let active = true

        Promise.resolve().then(async () => {
            if (active) {
                await fetchTaskDashboard()
            }
        })

        return () => {
            active = false
        }
    }, [])


    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const summary = {
        total: tasks.length,

        pending: tasks.filter(
            (task) => task.status === 'Pending'
        ).length,

        inProgress: tasks.filter(
            (task) => task.status === 'In Progress'
        ).length,

        completed: tasks.filter(
            (task) => task.status === 'Completed'
        ).length,

        overdue: tasks.filter((task) => {
            if (!task.dueDate || task.status === 'Completed') {
                return false
            }

            const dueDate = new Date(task.dueDate)
            dueDate.setHours(0, 0, 0, 0)

            return dueDate < today
        }).length,

        highPriority: tasks.filter(
            (task) =>
                task.priority === 'High' ||
                task.priority === 'Critical'
        ).length,

        completionRate: tasks.length
            ? Math.round(
                (tasks.filter(
                    (task) => task.status === 'Completed'
                ).length / tasks.length) * 100
            )
            : 0,
    }

    const stats = [
        {
            title: 'Total Tasks',
            value: summary.total ?? 0,
            change: 'Live total',
            icon: ClipboardList,
            iconClass: 'bg-blue-50 text-blue-600',
            changeClass: 'text-blue-600',
        },
        {
            title: 'Pending',
            value: summary.pending ?? 0,
            change: 'Awaiting work',
            icon: Clock3,
            iconClass: 'bg-slate-50 text-slate-600',
            changeClass: 'text-slate-500',
        },
        {
            title: 'In Progress',
            value: summary.inProgress ?? 0,
            change: 'Currently active',
            icon: Zap,
            iconClass: 'bg-indigo-50 text-indigo-600',
            changeClass: 'text-blue-600',
        },
        {
            title: 'Completed',
            value: summary.completed ?? 0,
            change: `${summary.completionRate ?? 0}% completion`,
            icon: CheckCircle2,
            iconClass: 'bg-emerald-50 text-emerald-600',
            changeClass: 'text-emerald-600',
        },
        {
            title: 'Overdue',
            value: summary.overdue ?? 0,
            change: 'Past due date',
            icon: AlertCircle,
            iconClass: 'bg-red-50 text-red-600',
            changeClass: 'text-red-500',
        },
        {
            title: 'High Priority',
            value: summary.highPriority ?? 0,
            change: 'High and critical',
            icon: AlertCircle,
            iconClass: 'bg-orange-50 text-orange-600',
            changeClass: 'text-slate-500',
        },
    ]



    const getInitials = (name = '') => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join('')
    }

    const formatTaskDate = (date) => {
        if (!date) return 'No due date'

        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical':
            case 'High':
                return 'red'
            case 'Medium':
                return 'orange'
            default:
                return 'purple'
        }
    }




    const ongoingTasks = tasks
        .filter((task) => task.status !== 'Completed')
        .slice(0, 5)
        .map((task) => ({
            ...task,
            _id: task._id,
            id: task.taskId || task._id,
            name: task.title,
            assigned: task.assignedTo?.fullName || 'Unassigned',
            initials: getInitials(task.assignedTo?.fullName || 'U'),
            priority: (task.priority || 'Medium').toUpperCase(),
            status: task.status,
            progress: task.progress ?? 0,
        }))




    const workload = (taskStats?.workload?.members || [])
        .map((member) => ({
            name: member.name || 'Unknown',
            initials: getInitials(member.name || 'U'),
            tasks: `${member.completedTasks}/${member.totalTasks} Tasks`,
            progress: member.completionRate ?? 0,
        }))
        .slice(0, 5)



    const recentActivity = (taskStats?.recentTasks || [])
        .map((task) => ({
            icon: task.status === 'Completed' ? CheckCircle2 : Clock3,
            iconClass: task.status === 'Completed'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-blue-50 text-blue-600',
            title: `${task.title} – ${task.status}`,
            description: `${task.updatedBy?.fullName || 'Task update'} · ${formatTaskDate(task.updatedAt)}`,
        }))




    const deadlines = (taskStats?.upcomingDeadlines || [])
        .map((task) => {
            const dueDate = new Date(task.dueDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const taskDate = new Date(dueDate)
            taskDate.setHours(0, 0, 0, 0)

            const isToday = taskDate.getTime() === today.getTime()

            return {
                title: `${isToday ? 'Due Today' : 'Upcoming'}: ${task.title}`,
                date: `Due ${formatTaskDate(task.dueDate)}`,
                icon: isToday ? Clock3 : CalendarDays,
                className: isToday
                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200',
            }
        })
    
    
    const handleDragStart = (event, taskId) => {
        setDraggedTaskId(taskId)

        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', taskId)
    }

    const handleDragOver = (event, status) => {
        event.preventDefault()

        event.dataTransfer.dropEffect = 'move'

        setDragOverStatus(status)
    }

    const handleDragLeave = (event) => {
        // Avoid clearing the highlight when moving between
        // child elements inside the same Kanban column.
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setDragOverStatus(null)
        }
    }

    const handleDrop = async (event, newStatus) => {
        event.preventDefault()

        const taskId =
            event.dataTransfer.getData('text/plain') ||
            draggedTaskId

        setDragOverStatus(null)
        setDraggedTaskId(null)

        if (!taskId) return

        const existingTask = tasks.find(
            (task) => task._id === taskId
        )

        if (!existingTask || existingTask.status === newStatus) {
            return
        }

        const previousTasks = tasks

        let newProgress = existingTask.progress ?? 0

        if (newStatus === 'Completed') {
            newProgress = 100
        } else if (newStatus === 'Pending') {
            newProgress = 0
        } else if (
            newStatus === 'In Progress' &&
            newProgress === 100
        ) {
            newProgress = 50
        }

        // Optimistically update the Kanban board.
        setTasks((previous) =>
            previous.map((task) =>
                task._id === taskId
                    ? {
                        ...task,
                        status: newStatus,
                        progress: newProgress,
                        completedAt:
                            newStatus === 'Completed'
                                ? new Date().toISOString()
                                : null,
                    }
                    : task
            )
        )

        setUpdatingTaskId(taskId)

        try {
            await api.patch(`/tasks/${taskId}/status`, {
                status: newStatus,
                progress: newProgress,
            })

            // Refresh dashboard statistics and related information.
            await fetchTaskDashboard(true)

        } catch (error) {
            console.error('Task status update failed:', error)

            // Restore the previous board if the API request fails.
            setTasks(previousTasks)

            setError(
                error.response?.data?.message ||
                error.message ||
                'Unable to update task status.'
            )

        } finally {
            setUpdatingTaskId(null)
        }
    }

    const handleDragEnd = () => {
        setDraggedTaskId(null)
        setDragOverStatus(null)
    }


    const kanbanDefinitions = [
        { title: 'PENDING', status: 'Pending', type: 'pending' },
        { title: 'IN PROGRESS', status: 'In Progress', type: 'progress' },
        { title: 'REVIEW', status: 'Review', type: 'review' },
        { title: 'COMPLETED', status: 'Completed', type: 'completed' },
    ]

    const kanbanColumns = kanbanDefinitions.map((column) => {
        const columnTasks = tasks.filter(
            (task) => task.status === column.status
        )

        return {
            ...column,
            count: columnTasks.length,
            tasks: columnTasks.slice(0, 5).map((task) => ({
                id: task._id,
                tag: task.category || 'GENERAL',
                title: task.title,
                color: getPriorityColor(task.priority),
                date: formatTaskDate(task.dueDate),
                comments: String(task.comments?.length || 0),
                completed: task.status === 'Completed'
                    ? `Completed ${formatTaskDate(task.completedAt)}`
                    : null,
            })),
        }
    })


    const quickActions = [
        {
            title: 'Create',
            subtitle: 'Task',
            icon: Plus,
            active: true,
        },
        {
            title: 'Assign',
            subtitle: 'Task',
            icon: UserPlus,
        },
        {
            title: 'View',
            subtitle: 'Calendar',
            icon: CalendarDays,
        },
        {
            title: 'Report',
            subtitle: '',
            icon: FileText,
        },
    ]

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">

            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    SIDEBAR
                ====================================================== */}

                <aside className="h-screen w-60 shrink-0 overflow-hidden lg:w-64">
                    <ManagerSidebar />
                </aside>

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

                        {/* Header actions */}

                        <div className="flex items-center gap-5">

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

                            <button
                                type="button"
                                aria-label="Settings"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Settings size={18} strokeWidth={1.7} />
                            </button>

                            <div className="h-7 w-px bg-[#E1E4EA]" />

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
                                EM
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

                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                                <div>

                                    <div className="flex items-center gap-2 text-xs">

                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            /
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            Task Management
                                        </span>

                                    </div>

                                    <h2
                                        className="
                                            mt-2
                                            text-2xl
                                            font-bold
                                            tracking-tight
                                            text-[#171B25]
                                        "
                                    >
                                        Task Management
                                    </h2>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Create, assign, monitor, and manage employee tasks efficiently.
                                    </p>

                                </div>

                                {successMessage && (
                                    <div
                                        role="status"
                                        className="mt-4 flex items-center justify-between gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700"
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={15} />
                                            <span>{successMessage}</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setSuccessMessage('')}
                                            className="font-semibold hover:text-green-900"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={() => fetchTaskDashboard(true)}
                                        disabled={refreshing}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#DDE1E8]
                                            bg-white
                                            px-3
                                            text-xs
                                            font-medium
                                            text-[#424854]
                                            transition
                                            hover:bg-[#F8F9FC]
                                        "
                                    >
                                        <RefreshCw
                                            size={14}
                                            className={refreshing ? 'animate-spin' : ''}
                                        />
                                        {refreshing ? 'Refreshing...' : 'Refresh'}
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
                                            border-[#DDE1E8]
                                            bg-white
                                            px-3
                                            text-xs
                                            font-medium
                                            text-[#424854]
                                            transition
                                            hover:bg-[#F8F9FC]
                                        "
                                    >
                                        <Download size={14} />
                                        Export Tasks
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/manager/tasks/add')}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0052CC]
                                            px-4
                                            text-xs
                                            font-medium
                                            text-white
                                            shadow-sm
                                            transition
                                            hover:bg-[#0045AD]
                                        "
                                    >
                                        <Plus size={14} />
                                        Create New Task
                                    </button>

                                </div>

                            </div>

                            {loading && (
                                <div className="mt-5 rounded-lg border border-[#E6E8ED] bg-white p-4 text-sm text-[#69707D]">
                                    Loading task management data...
                                </div>
                            )}

                            {error && (
                                <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {/* =================================================
                                STATISTICS
                            ================================================== */}

                            <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-6">

                                {stats.map((stat) => {

                                    const Icon = stat.icon

                                    return (
                                        <div
                                            key={stat.title}
                                            className="
                                                rounded-lg
                                                border
                                                border-[#E6E8ED]
                                                bg-white
                                                p-4
                                                shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                            "
                                        >

                                            <div className="flex items-start justify-between">

                                                <div>

                                                    <p className="text-[10px] font-medium text-[#59606E]">
                                                        {stat.title}
                                                    </p>

                                                    <p className="mt-2 text-xl font-bold leading-none text-[#171B25]">
                                                        {stat.value}
                                                    </p>

                                                </div>

                                                <div
                                                    className={`
                                                        flex
                                                        h-8
                                                        w-8
                                                        items-center
                                                        justify-center
                                                        rounded-md
                                                        ${stat.iconClass}
                                                    `}
                                                >
                                                    <Icon
                                                        size={16}
                                                        strokeWidth={1.8}
                                                    />
                                                </div>

                                            </div>

                                            <p
                                                className={`
                                                    mt-3
                                                    text-[9px]
                                                    font-medium
                                                    ${stat.changeClass}
                                                `}
                                            >
                                                {stat.change}
                                            </p>

                                        </div>
                                    )

                                })}

                            </div>

                            {/* =================================================
                                SEARCH / FILTERS
                            ================================================== */}

                            <section
                                className="
                                    mt-5
                                    rounded-lg
                                    border
                                    border-[#E6E8ED]
                                    bg-white
                                    p-4
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >

                                <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(260px,1fr)_150px_150px_150px_140px_auto]">

                                    <div className="relative">

                                        <Search
                                            size={14}
                                            className="
                                                pointer-events-none
                                                absolute
                                                left-3
                                                top-1/2
                                                -translate-y-1/2
                                                text-[#8B919D]
                                            "
                                        />

                                        <input
                                            type="text"
                                            placeholder="By ID, name or tags..."
                                            className="
                                                h-9
                                                w-full
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                pl-9
                                                pr-3
                                                text-xs
                                                outline-none
                                                focus:border-[#AFC4ED]
                                            "
                                        />

                                    </div>

                                    <select
                                        className="
                                            h-9
                                            rounded-md
                                            border
                                            border-[#DDE1E8]
                                            bg-white
                                            px-3
                                            text-xs
                                            text-[#59606E]
                                            outline-none
                                        "
                                        defaultValue="all"
                                    >
                                        <option value="all">
                                            All Members
                                        </option>
                                        {assignees.map((employee) => (
                                            <option key={employee._id} value={employee._id}>
                                                {employee.fullName}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        className="
                                            h-9
                                            rounded-md
                                            border
                                            border-[#DDE1E8]
                                            bg-white
                                            px-3
                                            text-xs
                                            text-[#59606E]
                                            outline-none
                                        "
                                        defaultValue="all"
                                    >
                                        <option value="all">
                                            All Priorities
                                        </option>
                                        <option value="high">
                                            High
                                        </option>
                                        <option value="medium">
                                            Medium
                                        </option>
                                        <option value="low">
                                            Low
                                        </option>
                                    </select>

                                    <select
                                        className="
                                            h-9
                                            rounded-md
                                            border
                                            border-[#DDE1E8]
                                            bg-white
                                            px-3
                                            text-xs
                                            text-[#59606E]
                                            outline-none
                                        "
                                        defaultValue="all"
                                    >
                                        <option value="all">
                                            All Status
                                        </option>
                                        <option value="pending">
                                            Pending
                                        </option>
                                        <option value="progress">
                                            In Progress
                                        </option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                    </select>

                                    <input
                                        type="text"
                                        placeholder="mm/dd/yyyy"
                                        className="
                                            h-9
                                            rounded-md
                                            border
                                            border-[#DDE1E8]
                                            bg-white
                                            px-3
                                            text-xs
                                            outline-none
                                            focus:border-[#AFC4ED]
                                        "
                                    />

                                    <button
                                        type="button"
                                        className="
                                            h-9
                                            rounded-md
                                            border
                                            border-[#DDE1E8]
                                            bg-white
                                            px-4
                                            text-xs
                                            font-medium
                                            text-[#59606E]
                                            transition
                                            hover:bg-[#F8F9FC]
                                        "
                                    >
                                        Clear Filters
                                    </button>

                                </div>

                            </section>

                            {/* =================================================
                                ONGOING TASKS + TEAM WORKLOAD
                            ================================================== */}

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">

                                {/* Ongoing Tasks */}

                                <section
                                    className="
                                        overflow-hidden
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >

                                    <div className="flex items-center justify-between border-b border-[#E6E8ED] px-5 py-4">

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Ongoing Tasks
                                        </h3>

                                        <button
                                            type="button"
                                            className="text-[10px] font-medium text-[#0757C9]"
                                        >
                                            View All Tasks
                                        </button>

                                    </div>

                                    <div className="hidden grid-cols-[100px_minmax(150px,1fr)_150px_80px_110px_80px_45px] bg-[#F9FAFD] px-5 py-3 md:grid">

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            TASK ID
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            NAME
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            ASSIGNED TO
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            PRIORITY
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            STATUS
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            PROGRESS
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            ACTION
                                        </span>

                                    </div>

                                    {ongoingTasks.map((task, index) => (

                                        <div
                                            key={`${task.id}-${index}`}
                                            className="
                                                grid
                                                grid-cols-1
                                                gap-3
                                                border-t
                                                border-[#ECEEF2]
                                                px-5
                                                py-4
                                                md:grid-cols-[100px_minmax(150px,1fr)_150px_80px_110px_80px_45px]
                                                md:items-center
                                                md:gap-0
                                            "
                                        >

                                            <span className="text-[10px] text-[#7A808C]">
                                                {task.id}
                                            </span>

                                            <div>
                                                <p className="text-[11px] font-semibold text-[#343A47]">
                                                    {task.name}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">

                                                <span
                                                    className="
                                                        flex
                                                        h-6
                                                        w-6
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        bg-[#E4EBFF]
                                                        text-[8px]
                                                        font-semibold
                                                        text-[#315A9E]
                                                    "
                                                >
                                                    {task.initials}
                                                </span>

                                                <span className="text-[10px] text-[#59606E]">
                                                    {task.assigned}
                                                </span>

                                            </div>

                                            <span
                                                className="
                                                    w-fit
                                                    rounded
                                                    bg-red-50
                                                    px-2
                                                    py-1
                                                    text-[8px]
                                                    font-semibold
                                                    text-red-500
                                                "
                                            >
                                                {task.priority}
                                            </span>

                                            <span className="flex items-center gap-2 text-[9px] font-medium text-[#0757C9]">

                                                <span className="h-1.5 w-1.5 rounded-full bg-[#0757C9]" />

                                                {task.status}

                                            </span>

                                            <div className="w-12">

                                                <div className="h-1 rounded-full bg-[#E5EAF5]">

                                                    <div
                                                        className="h-full rounded-full bg-[#0757C9]"
                                                        style={{
                                                            width: `${task.progress}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => navigate(`/manager/tasks/details/${task._id}`)}
                                                title="View Task Details"
                                                aria-label={`View details for ${task.name}`}
                                                className="
                                                flex
                                                h-7
                                                w-7
                                                items-center
                                                justify-center
                                                rounded-md
                                                text-[#0757C9]
                                                transition-colors
                                                hover:bg-[#EAF1FF]
                                                hover:text-[#0345A5]
                                            "
                                            >
                                                <Eye size={15} />
                                            </button>

                                        </div>

                                    ))}

                                </section>

                                {/* Team Workload */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >

                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Team Workload
                                    </h3>

                                    <div className="mt-5 space-y-5">

                                        {workload.map((member, index) => (

                                            <div key={member.name}>

                                                <div className="flex items-center justify-between">

                                                    <div className="flex items-center gap-2">

                                                        <span
                                                            className="
                                                                flex
                                                                h-6
                                                                w-6
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                bg-[#E4EBFF]
                                                                text-[8px]
                                                                font-semibold
                                                                text-[#315A9E]
                                                            "
                                                        >
                                                            {member.initials}
                                                        </span>

                                                        <span className="text-[10px] font-medium text-[#343A47]">
                                                            {member.name}
                                                        </span>

                                                    </div>

                                                    <span className="text-[9px] text-[#59606E]">
                                                        {member.tasks}
                                                    </span>

                                                </div>

                                                <div className="mt-2 h-1 rounded-full bg-[#E3E8F3]">

                                                    <div
                                                        className={`
                                                            h-full
                                                            rounded-full
                                                            ${index === 2
                                                                ? 'bg-[#18A957]'
                                                                : 'bg-[#0757C9]'
                                                            }
                                                        `}
                                                        style={{
                                                            width: `${member.progress}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                    <div className="mt-5 grid grid-cols-2 border-t border-[#E6E8ED] pt-4">

                                        <div className="text-center">

                                            {workload.length
                                                ? `${Math.round(
                                                    workload.reduce((total, member) => total + member.progress, 0) /
                                                    workload.length
                                                )}%`
                                                : '0%'}

                                        </div>

                                        <div className="text-center">

                                            <p className="text-[9px] text-[#7A808C]">
                                                Capacity
                                            </p>

                                            <p className="mt-1 text-lg font-bold text-[#18A957]">
                                                High
                                            </p>

                                        </div>

                                    </div>

                                </section>

                            </div>

                            {/* =================================================
                                KANBAN BOARD
                            ================================================== */}

                            <section className="mt-5">

                                <div className="flex items-center justify-between">

                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Task Kanban Board
                                    </h3>

                                    <div className="flex items-center gap-2">

                                        <button
                                            type="button"
                                            className="
                                                flex
                                                h-7
                                                w-7
                                                items-center
                                                justify-center
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                text-[#59606E]
                                            "
                                        >
                                            <SlidersHorizontal size={13} />
                                        </button>

                                        <button
                                            type="button"
                                            className="
                                                flex
                                                h-7
                                                w-7
                                                items-center
                                                justify-center
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                text-[#59606E]
                                            "
                                        >
                                            <MoreHorizontal size={14} />
                                        </button>

                                    </div>

                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

                                    {kanbanColumns.map((column) => (

                                        <div key={column.title}>

                                            <div className="flex items-center justify-between px-1">

                                                <div className="flex items-center gap-2">

                                                    <span className="text-[9px] font-semibold text-[#59606E]">
                                                        {column.title}
                                                    </span>

                                                    <span className="rounded-full bg-[#EEF0F5] px-1.5 py-0.5 text-[8px] text-[#7A808C]">
                                                        {column.count}
                                                    </span>

                                                </div>

                                                {column.type === 'pending' && (
                                                    <Plus
                                                        size={13}
                                                        className="text-[#7A808C]"
                                                    />
                                                )}

                                            </div>

                                            <div
                                                onDragOver={(event) => handleDragOver(event, column.status)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(event) => handleDrop(event, column.status)}
                                                className={`
                                                mt-2
                                                min-h-28
                                                rounded-lg
                                                border
                                                p-2
                                                transition-all
                                                duration-200
                                                ${column.type === 'review'
                                                        ? 'border-dashed border-[#C7CEDC] bg-[#FCFDFF]'
                                                        : 'border-[#E3E6EC] bg-white'
                                                    }
                                                        ${dragOverStatus === column.status
                                                        ? 'border-[#0757C9] bg-blue-50 ring-2 ring-blue-100'
                                                        : ''
                                                    }
                                                `}
                                            >

                                                {column.tasks.length === 0 ? (

                                                    <div className="flex h-24 items-center justify-center text-[9px] text-[#9AA0AA]">
                                                        Drag cards here for review
                                                    </div>

                                                ) : (

                                                    <div className="space-y-2">

                                                        {column.tasks.map((task, index) => (

                                                            <div
                                                                key={`${task.id}-${index}`}
                                                                draggable={updatingTaskId !== task.id}
                                                                onDragStart={(event) => handleDragStart(event, task.id)}
                                                                onDragEnd={handleDragEnd}
                                                                className={`
                                                                        rounded-md
                                                                        border
                                                                        border-[#E3E6EC]
                                                                        bg-white
                                                                        p-3
                                                                        shadow-[0_1px_4px_rgba(15,23,42,0.03)]
                                                                        cursor-grab
                                                                        active:cursor-grabbing
                                                                        transition-all
                                                                        duration-200
                                                                        ${draggedTaskId === task.id
                                                                        ? 'opacity-40 scale-95'
                                                                        : 'opacity-100'
                                                                    }
                                                                        ${updatingTaskId === task.id
                                                                        ? 'pointer-events-none opacity-50'
                                                                        : ''
                                                                    }
                                                                `}
                                                            >

                                                                <div className="flex items-center justify-between">

                                                                    <span
                                                                        className={`
                                                                            rounded
                                                                            px-1.5
                                                                            py-0.5
                                                                            text-[7px]
                                                                            font-semibold
                                                                            ${task.color === 'red'
                                                                                ? 'bg-red-50 text-red-500'
                                                                                : 'bg-purple-50 text-purple-600'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {task.tag}
                                                                    </span>

                                                                    <MoreVertical
                                                                        size={12}
                                                                        className="text-[#9AA0AA]"
                                                                    />

                                                                </div>

                                                                <p className="mt-2 text-[10px] font-semibold leading-4 text-[#343A47]">
                                                                    {task.title}
                                                                </p>

                                                                {task.date && (
                                                                    <div className="mt-3 flex items-center justify-end gap-1 text-[8px] text-[#858B97]">
                                                                        <CalendarDays size={10} />
                                                                        {task.date}
                                                                    </div>
                                                                )}

                                                                {task.comments && (
                                                                    <div className="mt-3 flex justify-end text-[8px] text-[#59606E]">
                                                                        💬 {task.comments}
                                                                    </div>
                                                                )}

                                                                {task.completed && (
                                                                    <div className="mt-3 flex items-center justify-end gap-1 text-[8px] text-[#858B97]">
                                                                        <CheckCircle2
                                                                            size={10}
                                                                            className="text-emerald-500"
                                                                        />
                                                                        {task.completed}
                                                                    </div>
                                                                )}

                                                            </div>

                                                        ))}

                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </section>

                            {/* =================================================
                                BOTTOM SECTION
                            ================================================== */}

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_210px]">

                                {/* Recent Activity */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >

                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Recent Activity
                                    </h3>

                                    <div className="mt-4 space-y-4">

                                        {recentActivity.map((activity, index) => {

                                            const Icon = activity.icon

                                            return (
                                                <div
                                                    key={index}
                                                    className="flex items-start gap-3"
                                                >

                                                    <span
                                                        className={`
                                                            flex
                                                            h-7
                                                            w-7
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            ${activity.iconClass}
                                                        `}
                                                    >
                                                        <Icon size={13} />
                                                    </span>

                                                    <div>

                                                        <p className="text-[10px] font-medium text-[#343A47]">
                                                            {activity.title}
                                                        </p>

                                                        <p className="mt-1 text-[8px] text-[#858B97]">
                                                            {activity.description}
                                                        </p>

                                                    </div>

                                                </div>
                                            )

                                        })}

                                    </div>

                                </section>

                                {/* Upcoming Deadlines */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >

                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Upcoming Deadlines
                                    </h3>

                                    <div className="mt-4 space-y-2">

                                        {deadlines.map((deadline) => {

                                            const Icon = deadline.icon

                                            return (
                                                <div
                                                    key={deadline.title}
                                                    className={`
                                                        flex
                                                        items-center
                                                        justify-between
                                                        rounded-md
                                                        border
                                                        px-3
                                                        py-2.5
                                                        ${deadline.className}
                                                    `}
                                                >

                                                    <div className="flex items-center gap-2">

                                                        <Icon size={14} />

                                                        <div>

                                                            <p className="text-[9px] font-semibold">
                                                                {deadline.title}
                                                            </p>

                                                            <p className="mt-0.5 text-[8px] opacity-75">
                                                                {deadline.date}
                                                            </p>

                                                        </div>

                                                    </div>

                                                    <ChevronRight size={13} />

                                                </div>
                                            )

                                        })}

                                    </div>

                                </section>

                                {/* Quick Actions */}

                                <section className="grid grid-cols-2 gap-3 xl:grid-cols-2">

                                    {quickActions.map((action) => {

                                        const Icon = action.icon

                                        return (
                                            <button
                                                key={`${action.title}-${action.subtitle}`}
                                                type="button"
                                                className={`
                                                    flex
                                                    min-h-24
                                                    flex-col
                                                    items-start
                                                    justify-center
                                                    rounded-lg
                                                    border
                                                    p-4
                                                    text-left
                                                    transition
                                                    ${action.active
                                                        ? 'border-[#0052CC] bg-[#0052CC] text-white shadow-sm'
                                                        : 'border-[#E3E6EC] bg-white text-[#343A47] hover:border-[#C8D5F2]'
                                                    }
                                                `}
                                            >

                                                <Icon
                                                    size={16}
                                                    className={
                                                        action.active
                                                            ? 'text-white'
                                                            : 'text-[#0757C9]'
                                                    }
                                                />

                                                <span className="mt-2 text-[9px] font-semibold">
                                                    {action.title}
                                                </span>

                                                {action.subtitle && (
                                                    <span
                                                        className={`
                                                            text-[9px]
                                                            ${action.active
                                                                ? 'text-white/80'
                                                                : 'text-[#59606E]'
                                                            }
                                                        `}
                                                    >
                                                        {action.subtitle}
                                                    </span>
                                                )}

                                            </button>
                                        )

                                    })}

                                </section>

                            </div>

                            {/* =================================================
                                FOOTER
                            ================================================== */}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">

                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-3
                                        text-[10px]
                                        text-[#59606E]
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >

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

export default TaskManagement