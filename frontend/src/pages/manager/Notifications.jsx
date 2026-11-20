import{ useState, useEffect, useCallback } from "react"
import api from '../../services/api'
import {
    Bell,
    Search,
    RefreshCw,
    Archive,
    CheckCheck,
    AlertTriangle,
    ClipboardList,
    ShoppingCart,
    FileText,
    Settings,
    Clock3,
    SlidersHorizontal,
    CheckCircle2
} from 'lucide-react'

import ManagerSidebar from '../../components/sidebar/ManagerSidebar'

function Notifications() {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('All')
    const [priorityFilter, setPriorityFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')

    const [notifications, setNotifications] = useState([])
    const [selectedIds, setSelectedIds] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // These preferences remain local until a preferences API is implemented.
    const [preferences, setPreferences] = useState({
        email: true,
        popups: true,
        sales: true,
        inventory: true,
        tasks: false,
    })

    const extractNotifications = (response) => {
        let current = response

        for (let i = 0; i < 4; i += 1) {
            if (Array.isArray(current)) return current

            if (!current || typeof current !== 'object') return []

            if (Array.isArray(current.notifications)) return current.notifications
            if (Array.isArray(current.items)) return current.items
            if (Array.isArray(current.results)) return current.results

            if (current.data !== undefined) {
                current = current.data
                continue
            }

            break
        }

        return []
    }

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            const response = await api.get('/notifications')

            if (response?.success === false) {
                throw new Error(response.message || 'Unable to load notifications.')
            }

            const records = extractNotifications(response)
            setNotifications(records)
            setSelectedIds((current) =>
                current.filter((id) => records.some((item) => item._id === id))
            )
        } catch (err) {
            console.error('Fetch notifications error:', err)
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to load notifications. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        let isMounted = true

        const loadNotifications = async () => {
            try {
                await fetchNotifications()
            } catch (error) {
                console.error("Failed to load notifications:", error)
            }
        }

        if (isMounted) {
            loadNotifications()
        }

        return () => {
            isMounted = false
        }
    }, [fetchNotifications])

    const filteredNotifications = notifications.filter((notification) => {
        const searchText = search.toLowerCase()
        const matchesSearch =
            (notification.title || '').toLowerCase().includes(searchText) ||
            (notification.description || '').toLowerCase().includes(searchText)

        const matchesType =
            typeFilter === 'All' || notification.type === typeFilter

        const matchesPriority =
            priorityFilter === 'All' || notification.priority === priorityFilter

        const notificationStatus = notification.isRead ? 'Read' : 'Unread'
        const matchesStatus =
            statusFilter === 'All' || notificationStatus === statusFilter

        return matchesSearch && matchesType && matchesPriority && matchesStatus
    })

    const stats = {
        total: notifications.length,
        unread: notifications.filter((item) => !item.isRead).length,
        highPriority: notifications.filter((item) => item.priority === 'High').length,
        read: notifications.filter((item) => item.isRead).length,
    }

    const trendCounts = ['Inventory', 'Sales', 'Task', 'System'].map((type) => ({
        type,
        count: notifications.filter((item) => item.type === type).length,
    }))
    const trendTotal = trendCounts.reduce((sum, item) => sum + item.count, 0)
    const trendPercent = (count) =>
        trendTotal === 0 ? 0 : Math.round((count / trendTotal) * 100)

    const toggleNotificationSelection = (id) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        )
    }

    const markAsRead = async (id) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`)
            if (response?.success === false) {
                throw new Error(response.message || 'Unable to mark notification as read.')
            }
            await fetchNotifications()
        } catch (err) {
            console.error('Mark notification as read error:', err)
            setError(err.response?.data?.message || err.message || 'Unable to update notification.')
        }
    }

    const markAllAsRead = async () => {
        try {
            const response = await api.patch('/notifications/read-all')
            if (response?.success === false) {
                throw new Error(response.message || 'Unable to mark notifications as read.')
            }
            await fetchNotifications()
        } catch (err) {
            console.error('Mark all notifications as read error:', err)
            setError(err.response?.data?.message || err.message || 'Unable to update notifications.')
        }
    }

    const archiveSelected = async () => {
        if (selectedIds.length === 0) return

        try {
            const response = await api.patch(
                '/notifications/archive-selected',
                { ids: selectedIds }
            )
            if (response?.success === false) {
                throw new Error(response.message || 'Unable to archive selected notifications.')
            }
            setSelectedIds([])
            await fetchNotifications()
        } catch (err) {
            console.error('Archive notifications error:', err)
            setError(err.response?.data?.message || err.message || 'Unable to archive notifications.')
        }
    }

    const archiveNotification = async (id) => {
        try {
            const response = await api.patch(`/notifications/${id}/archive`)
            if (response?.success === false) {
                throw new Error(response.message || 'Unable to archive notification.')
            }
            setSelectedIds((current) => current.filter((item) => item !== id))
            await fetchNotifications()
        } catch (err) {
            console.error('Archive notification error:', err)
            setError(err.response?.data?.message || err.message || 'Unable to archive notification.')
        }
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'Inventory':
                return AlertTriangle
            case 'Sales':
                return ShoppingCart
            case 'Task':
                return ClipboardList
            case 'Report':
                return FileText
            default:
                return Settings
        }
    }

    const getNotificationTime = (date) => {
        if (!date) return 'Recently'
        const parsedDate = new Date(date)
        if (Number.isNaN(parsedDate.getTime())) return 'Recently'

        return parsedDate.toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
    }

    const togglePreference = (key) => {
        setPreferences((current) => ({
            ...current,
            [key]: !current[key],
        }))
    }

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    SIDEBAR
                ====================================================== */}
                <ManagerSidebar />

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
                            h-14
                            shrink-0
                            items-center
                            justify-between
                            border-b
                            border-[#E1E4EA]
                            bg-white
                            px-6
                        "
                    >
                        {/* Search */}
                        <div className="relative w-72">
                            <Search
                                size={15}
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
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search notifications..."
                                className="
                                    h-8
                                    w-full
                                    rounded-md
                                    border
                                    border-transparent
                                    bg-[#F1F3FA]
                                    pl-9
                                    pr-3
                                    text-[11px]
                                    text-[#343A47]
                                    outline-none
                                    transition
                                    placeholder:text-[#8B919D]
                                    focus:border-[#D4DCF0]
                                    focus:bg-white
                                "
                            />
                        </div>

                        {/* Header Actions */}
                        <div className="flex items-center gap-5">
                            <button
                                type="button"
                                aria-label="Messages"
                                className="text-[#4E5562] transition hover:text-[#0757C9]"
                            >
                                <FileText
                                    size={17}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#4E5562] transition hover:text-[#0757C9]"
                            >
                                <Bell
                                    size={17}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <button
                                type="button"
                                aria-label="Settings"
                                className="text-[#4E5562] transition hover:text-[#0757C9]"
                            >
                                <Settings
                                    size={17}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <button
                                type="button"
                                aria-label="Help"
                                className="text-[#4E5562] transition hover:text-[#0757C9]"
                            >
                                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#59606E] text-[9px] font-semibold">
                                    ?
                                </span>
                            </button>

                            <div
                                className="
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-[#DDE5F5]
                                    text-[9px]
                                    font-semibold
                                    text-[#315A9E]
                                "
                            >
                                AU
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
                        <div className="px-7 py-7">

                            {/* =================================================
                                PAGE HEADING
                            ================================================== */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-[#59606E]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#343A47]">
                                            Notifications
                                        </span>
                                    </div>

                                    <h1
                                        className="
                                            mt-1
                                            text-2xl
                                            font-bold
                                            tracking-tight
                                            text-[#171B25]
                                        "
                                    >
                                        Notifications
                                    </h1>

                                    <p className="mt-0.5 text-xs text-[#69707D]">
                                        View and manage system alerts,
                                        reminders, and business notifications.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={fetchNotifications}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#D9DDE6]
                                            bg-white
                                            px-4
                                            text-[10px]
                                            font-medium
                                            text-[#343A47]
                                            shadow-sm
                                            transition
                                            hover:bg-[#F8F9FC]
                                        "
                                    >
                                        <RefreshCw
                                            size={13}
                                            strokeWidth={1.8}
                                            className={loading ? 'animate-spin' : ''}
                                        />
                                        Refresh
                                    </button>

                                    <button
                                        type="button"
                                        onClick={archiveSelected}
                                        disabled={selectedIds.length === 0}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#D9DDE6]
                                            bg-white
                                            px-4
                                            text-[10px]
                                            font-medium
                                            text-[#343A47]
                                            shadow-sm
                                            transition
                                            hover:bg-[#F8F9FC]
                                        "
                                    >
                                        <Archive
                                            size={13}
                                            strokeWidth={1.8}
                                        />
                                        Archive Selected
                                    </button>

                                    <button
                                        type="button"
                                        onClick={markAllAsRead}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0052CC]
                                            px-4
                                            text-[10px]
                                            font-medium
                                            text-white
                                            shadow-sm
                                            transition
                                            hover:bg-[#0045AD]
                                        "
                                    >
                                        <CheckCheck
                                            size={13}
                                            strokeWidth={2}
                                        />
                                        Mark All as Read
                                    </button>
                                </div>
                            </div>

                            {/* =================================================
                                STATISTICS
                            ================================================== */}
                            <div className="mt-7 grid grid-cols-4 gap-4">

                                {/* Total Notifications */}
                                <div
                                    className="
                                        flex
                                        h-14
                                        items-center
                                        gap-3
                                        rounded-lg
                                        border
                                        border-[#DDE1EA]
                                        bg-white
                                        px-4
                                        shadow-[0_2px_6px_rgba(15,23,42,0.03)]
                                    "
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E3ECFF] text-[#0757C9]">
                                        <Bell size={16} />
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-medium text-[#69707D]">
                                            Total Notifications
                                        </p>

                                        <p className="text-lg font-bold leading-5 text-[#171B25]">
                                            {stats.total}
                                        </p>
                                    </div>
                                </div>

                                {/* Unread */}
                                <div
                                    className="
                                        flex
                                        h-14
                                        items-center
                                        gap-3
                                        rounded-lg
                                        border
                                        border-[#DDE1EA]
                                        bg-white
                                        px-4
                                        shadow-[0_2px_6px_rgba(15,23,42,0.03)]
                                    "
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E4E8FF] text-[#5369D9]">
                                        <ClipboardList size={16} />
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-medium text-[#69707D]">
                                            Unread Items
                                        </p>

                                        <p className="text-lg font-bold leading-5 text-[#171B25]">
                                            {stats.unread}
                                        </p>
                                    </div>
                                </div>

                                {/* High Priority */}
                                <div
                                    className="
                                        flex
                                        h-14
                                        items-center
                                        gap-3
                                        rounded-lg
                                        border
                                        border-[#DDE1EA]
                                        bg-white
                                        px-4
                                        shadow-[0_2px_6px_rgba(15,23,42,0.03)]
                                    "
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FFE4E2] text-[#E53935]">
                                        <AlertTriangle size={16} />
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-medium text-[#69707D]">
                                            High Priority
                                        </p>

                                        <p className="text-lg font-bold leading-5 text-[#171B25]">
                                            {stats.highPriority}
                                        </p>
                                    </div>
                                </div>

                                {/* Completed */}
                                <div
                                    className="
                                        flex
                                        h-14
                                        items-center
                                        gap-3
                                        rounded-lg
                                        border
                                        border-[#DDE1EA]
                                        bg-white
                                        px-4
                                        shadow-[0_2px_6px_rgba(15,23,42,0.03)]
                                    "
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FFE4D9] text-[#A94B09]">
                                        <CheckCircle2 size={16} />
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-medium text-[#69707D]">
                                            Read Notifications
                                        </p>

                                        <p className="text-lg font-bold leading-5 text-[#171B25]">
                                            {stats.read}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[10px] text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* =================================================
                                MAIN GRID
                            ================================================== */}
                            <div className="mt-7 grid grid-cols-[minmax(0,1fr)_250px] gap-4">

                                {/* =================================================
                                    LEFT - NOTIFICATION LIST
                                ================================================== */}
                                <section>

                                    {/* Filters */}
                                    <div
                                        className="
                                            rounded-lg
                                            border
                                            border-[#DDE1EA]
                                            bg-white
                                            p-3
                                        "
                                    >
                                        <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-2">

                                            {/* Search */}
                                            <div className="relative">
                                                <Search
                                                    size={13}
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
                                                    value={search}
                                                    onChange={(event) =>
                                                        setSearch(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Search..."
                                                    className="
                                                        h-8
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-[#D9DDE6]
                                                        bg-[#F8F9FD]
                                                        pl-8
                                                        pr-3
                                                        text-[10px]
                                                        outline-none
                                                        focus:border-[#AFC3ED]
                                                        focus:bg-white
                                                    "
                                                />
                                            </div>

                                            {/* Type */}
                                            <select
                                                value={typeFilter}
                                                onChange={(event) =>
                                                    setTypeFilter(
                                                        event.target.value
                                                    )
                                                }
                                                className="
                                                    h-8
                                                    rounded-md
                                                    border
                                                    border-[#D9DDE6]
                                                    bg-[#F8F9FD]
                                                    px-2
                                                    text-[10px]
                                                    text-[#424854]
                                                    outline-none
                                                "
                                            >
                                                <option value="All">
                                                    Type: All
                                                </option>
                                                <option value="Inventory">
                                                    Inventory
                                                </option>
                                                <option value="Sales">
                                                    Sales
                                                </option>
                                                <option value="Task">
                                                    Task
                                                </option>
                                                <option value="Report">
                                                    Report
                                                </option>
                                                <option value="System">
                                                    System
                                                </option>
                                            </select>

                                            {/* Priority */}
                                            <select
                                                value={priorityFilter}
                                                onChange={(event) =>
                                                    setPriorityFilter(
                                                        event.target.value
                                                    )
                                                }
                                                className="
                                                    h-8
                                                    rounded-md
                                                    border
                                                    border-[#D9DDE6]
                                                    bg-[#F8F9FD]
                                                    px-2
                                                    text-[10px]
                                                    text-[#424854]
                                                    outline-none
                                                "
                                            >
                                                <option value="All">
                                                    Priority: All
                                                </option>
                                                <option value="High">
                                                    High
                                                </option>
                                                <option value="Medium">
                                                    Medium
                                                </option>
                                                <option value="Low">
                                                    Low
                                                </option>
                                            </select>

                                            {/* Status */}
                                            <select
                                                value={statusFilter}
                                                onChange={(event) =>
                                                    setStatusFilter(
                                                        event.target.value
                                                    )
                                                }
                                                className="
                                                    h-8
                                                    rounded-md
                                                    border
                                                    border-[#D9DDE6]
                                                    bg-[#F8F9FD]
                                                    px-2
                                                    text-[10px]
                                                    text-[#424854]
                                                    outline-none
                                                "
                                            >
                                                <option value="All">
                                                    Status: All
                                                </option>
                                                <option value="Unread">
                                                    Unread
                                                </option>
                                                <option value="Read">
                                                    Read
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Notification Cards */}
                                    <div className="mt-3 space-y-2">

                                        {filteredNotifications.map(
                                            (notification) => {
                                                const Icon = getNotificationIcon(notification.type)

                                                const isUnread = !notification.isRead

                                                const iconClass =
                                                    notification.type === 'Inventory'
                                                        ? 'bg-red-100 text-red-600'
                                                        : notification.type === 'Sales'
                                                            ? 'bg-blue-100 text-blue-600'
                                                            : notification.type === 'Task'
                                                                ? 'bg-indigo-100 text-indigo-600'
                                                                : 'bg-slate-100 text-slate-600'

                                                const priorityClass =
                                                    notification.priority === 'High'
                                                        ? 'bg-red-100 text-red-600'
                                                        : notification.priority === 'Medium'
                                                            ? 'bg-indigo-100 text-indigo-600'
                                                            : 'bg-slate-100 text-slate-600'

                                                return (
                                                    <div
                                                        key={notification._id}
                                                        className={`
                                                        group
                                                        flex
                                                        min-h-16.5
                                                        items-start
                                                        gap-3
                                                        rounded-lg
                                                        border
                                                        border-[#DDE1EA]
                                                        border-l-[3px]
                                                        ${isUnread ? 'border-l-[#0757C9]' : 'border-l-transparent'}
                                                        bg-white
                                                        px-3
                                                        py-3
                                                        shadow-[0_2px_5px_rgba(15,23,42,0.025)]
                                                        transition
                                                        hover:shadow-[0_3px_8px_rgba(15,23,42,0.05)]
                                                    `}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(notification._id)}
                                                            onChange={() => toggleNotificationSelection(notification._id)}
                                                            aria-label="Select notification"
                                                            className="mt-2 h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#0757C9]"
                                                        />

                                                        <div
                                                            className={`
                                                                flex
                                                                h-7
                                                                w-7
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                ${iconClass}
                                                            `}
                                                        >
                                                            <Icon
                                                                size={14}
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <h3 className="text-[11px] font-semibold text-[#242936]">
                                                                    {
                                                                        notification.title
                                                                    }
                                                                </h3>

                                                                <span
                                                                    className={`
                                                                        shrink-0
                                                                        rounded-full
                                                                        px-2
                                                                        py-0.5
                                                                        text-[8px]
                                                                        font-semibold
                                                                        ${priorityClass}
                                                                    `}
                                                                >
                                                                    {
                                                                        notification.priority
                                                                    }{' '}
                                                                    Priority
                                                                </span>
                                                            </div>

                                                            <p className="mt-1 text-[9px] text-[#69707D]">
                                                                {
                                                                    notification.description
                                                                }
                                                            </p>

                                                            <div className="mt-1.5 flex items-center gap-1 text-[8px] text-[#737A87]">
                                                                <Clock3
                                                                    size={9}
                                                                    strokeWidth={
                                                                        1.8
                                                                    }
                                                                />
                                                                {
                                                                    getNotificationTime(notification.createdAt)
                                                                }
                                                            </div>

                                                            <div className="mt-2 flex items-center gap-3">
                                                                {!notification.isRead && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => markAsRead(notification._id)}
                                                                        className="text-[9px] font-medium text-[#0757C9] hover:underline"
                                                                    >
                                                                        Mark as Read
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => archiveNotification(notification._id)}
                                                                    className="text-[9px] font-medium text-[#69707D] hover:text-red-600"
                                                                >
                                                                    Archive
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        )}

                                        {filteredNotifications.length ===
                                            0 && (
                                                <div className="rounded-lg border border-[#DDE1EA] bg-white px-5 py-10 text-center">
                                                    <SlidersHorizontal
                                                        size={24}
                                                        className="mx-auto text-[#9AA1AE]"
                                                    />

                                                    <p className="mt-2 text-xs font-semibold text-[#343A47]">
                                                        {loading ? 'Loading notifications...' : 'No notifications found'}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-[#7A808C]">
                                                        Try changing your search or
                                                        filters.
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                </section>

                                {/* =================================================
                                    RIGHT COLUMN
                                ================================================== */}
                                <aside className="space-y-4">

                                    {/* Activity Trends */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#DDE1EA]
                                            bg-white
                                            p-4
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Activity Trends
                                        </h3>

                                        <div className="mt-5 space-y-4">
                                            {[
                                                {
                                                    label: 'Inventory Alerts',
                                                    count: trendCounts.find((item) => item.type === 'Inventory')?.count || 0,
                                                    color: 'bg-[#C82020]',
                                                },
                                                {
                                                    label: 'Sales Updates',
                                                    count: trendCounts.find((item) => item.type === 'Sales')?.count || 0,
                                                    color: 'bg-[#0757C9]',
                                                },
                                                {
                                                    label: 'Task Notifications',
                                                    count: trendCounts.find((item) => item.type === 'Task')?.count || 0,
                                                    color: 'bg-[#53679A]',
                                                },
                                                {
                                                    label: 'System Notifications',
                                                    count: trendCounts.find((item) => item.type === 'System')?.count || 0,
                                                    color: 'bg-[#737987]',
                                                },
                                            ].map((item) => {
                                                const percentage = trendPercent(item.count)

                                                return (
                                                    <div key={item.label}>
                                                        <div className="flex justify-between text-[9px]">
                                                            <span className="text-[#424854]">
                                                                {item.label}
                                                            </span>
                                                            <span className="font-semibold text-[#424854]">
                                                                {percentage}%
                                                            </span>
                                                        </div>

                                                        <div className="mt-1.5 h-1 rounded-full bg-[#E7EAF1]">
                                                            <div
                                                                className={`h-full rounded-full ${item.color}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </section>

                                    {/* Preferences */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#DDE1EA]
                                            bg-white
                                            p-4
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Preferences
                                        </h3>

                                        <div className="mt-4 space-y-4">

                                            {[
                                                {
                                                    key: 'email',
                                                    label: 'Email Notifications',
                                                },
                                                {
                                                    key: 'popups',
                                                    label: 'In-App Popups',
                                                },
                                                {
                                                    key: 'sales',
                                                    label: 'Sales Alerts',
                                                },
                                                {
                                                    key: 'inventory',
                                                    label: 'Inventory Alerts',
                                                },
                                                {
                                                    key: 'tasks',
                                                    label: 'Task Reminders',
                                                },
                                            ].map((item) => (
                                                <div
                                                    key={item.key}
                                                    className="flex items-center justify-between"
                                                >
                                                    <span className="text-[9px] text-[#59606E]">
                                                        {item.label}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            togglePreference(
                                                                item.key
                                                            )
                                                        }
                                                        aria-label={`Toggle ${item.label}`}
                                                        className={`
                                                            relative
                                                            h-3.5
                                                            w-7
                                                            rounded-full
                                                            transition
                                                            ${preferences[
                                                                item.key
                                                            ]
                                                                ? 'bg-[#0757C9]'
                                                                : 'bg-[#E1E4EC]'
                                                            }
                                                        `}
                                                    >
                                                        <span
                                                            className={`
                                                                absolute
                                                                top-0.5
                                                                h-2.5
                                                                w-2.5
                                                                rounded-full
                                                                bg-white
                                                                shadow-sm
                                                                transition
                                                                ${preferences[
                                                                    item.key
                                                                ]
                                                                    ? 'right-0.5'
                                                                    : 'left-0.5'
                                                                }
                                                            `}
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Recent Activity */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#DDE1EA]
                                            bg-white
                                            p-4
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Recent Notifications
                                        </h3>

                                        <div className="relative mt-5 space-y-5">
                                            <div className="absolute left-2 top-2 bottom-2 w-px bg-[#DCE1EB]" />

                                            {notifications.slice(0, 5).map((item) => {
                                                const Icon = getNotificationIcon(item.type)

                                                return (
                                                    <div
                                                        key={item._id}
                                                        className="relative flex gap-3"
                                                    >
                                                        <div className="z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0757C9] text-white">
                                                            <Icon size={8} />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="text-[9px] font-semibold text-[#343A47]">
                                                                {item.title}
                                                            </p>

                                                            <p className="mt-0.5 text-[8px] leading-3 text-[#737A87]">
                                                                {item.description}
                                                            </p>

                                                            <p className="mt-1 text-[7px] font-medium text-[#9AA0AB]">
                                                                {getNotificationTime(item.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </section>
                                </aside>
                            </div>

                            {/* =================================================
                                FOOTER
                            ================================================== */}
                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <div className="flex items-center justify-between text-[9px] text-[#59606E]">
                                    <p>
                                        © 2026 Business Process Automation
                                        System | Cloud-Based SaaS Platform
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

export default Notifications