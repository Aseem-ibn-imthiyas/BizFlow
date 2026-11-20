import { useEffect, useState } from 'react'
import { auth } from '../../config/firebase'

import {
    Bell,
    CircleHelp,
    Search,
    RefreshCw,
    Download,
    Activity,
    CalendarDays,
    ShieldAlert,
    TriangleAlert,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react'

import AdminSidebar from '../../components/sidebar/AdminSidebar'

function AdminAutomationLogs() {
    const [logs, setLogs] = useState([])
    const [summary, setSummary] = useState({
        totalEvents: 0,
        todayEvents: 0,
        securityEvents: 0,
        failedActions: 0,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [filters, setFilters] = useState({
        dateRange: 'today',
        user: '',
        action: '',
        module: '',
        status: '',
    })
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })

    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')

    const fetchLogs = async (overrides = {}) => {
        setLoading(true)
        setError('')
        try {
            const currentFilters = { ...filters, ...overrides }
            const params = new URLSearchParams({
                search: overrides.search ?? search,
                dateRange: currentFilters.dateRange,
                user: currentFilters.user,
                action: currentFilters.action,
                module: currentFilters.module,
                status: currentFilters.status,
                page: String(overrides.page ?? page),
                limit: String(overrides.limit ?? limit),
            })
            const currentUser = auth.currentUser
            if (!currentUser) throw new Error('Please sign in again to view audit logs.')
            const token = await currentUser.getIdToken()
            const response = await fetch(`${apiBaseUrl}/api/audit-logs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                throw new Error(result.message || `Request failed (${response.status})`)
            }

            const mappedLogs = (result.data.logs || []).map((item) => {
                const createdAt = item.createdAt ? new Date(item.createdAt) : null
                const userName = item.userName || 'System'
                return {
                    id: item._id,
                    date: createdAt && !Number.isNaN(createdAt.getTime())
                        ? createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—',
                    time: createdAt && !Number.isNaN(createdAt.getTime())
                        ? createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '—',
                    initials: userName.split(/\\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
                    user: userName,
                    role: item.role || 'System',
                    action: item.action || 'Unknown',
                    module: item.module || 'System',
                    description: item.description || '—',
                    ip: item.ipAddress || '—',
                    status: item.status || 'Success',
                }
            })
            setLogs(mappedLogs)
            setSummary(result.data.summary || {
                totalEvents: 0, todayEvents: 0, securityEvents: 0, failedActions: 0,
            })
            setPagination(result.data.pagination || { total: 0, totalPages: 0 })
            setPage(Number(overrides.page ?? page))
        } catch (err) {
            setError(err.message || 'Failed to load audit logs.')
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadInitialLogs = async () => {
            await fetchLogs();
        };

        loadInitialLogs();

        // Initial load; filters/search are submitted on change below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const summaryCards = [
        {
            title: 'TOTAL EVENTS',
            value: Number(summary.totalEvents || 0).toLocaleString(),
            change: '',
            description: 'All recorded administrative events',
            icon: Activity,
            iconClass: 'bg-blue-50 text-blue-600',
            valueClass: 'text-[#171B25]',
        },
        {
            title: "TODAY'S EVENTS",
            value: Number(summary.todayEvents || 0).toLocaleString(),
            change: 'since 12:00 AM',
            description: 'Events recorded today',
            icon: CalendarDays,
            iconClass: 'bg-indigo-50 text-indigo-600',
            valueClass: 'text-[#171B25]',
        },
        {
            title: 'SECURITY EVENTS',
            value: Number(summary.securityEvents || 0).toLocaleString(),
            change: 'Audited',
            description: 'Security-related activities',
            icon: ShieldAlert,
            iconClass: 'bg-orange-50 text-orange-600',
            valueClass: 'text-[#171B25]',
        },
        {
            title: 'FAILED ACTIONS',
            value: Number(summary.failedActions || 0).toLocaleString(),
            change: 'Requires review',
            description: 'Failed or rejected actions flagged',
            icon: TriangleAlert,
            iconClass: 'bg-red-50 text-red-600',
            valueClass: 'text-red-600',
        },
    ]

    const updateFilter = (key, value) => {
        const nextFilters = { ...filters, [key]: value }
        setFilters(nextFilters)
        setPage(1)
        fetchLogs({ ...nextFilters, page: 1 })
    }

    const clearFilters = () => {
        const reset = { dateRange: 'all', user: '', action: '', module: '', status: '' }
        setFilters(reset)
        setSearch('')
        setPage(1)
        fetchLogs({ ...reset, page: 1, search: '' })
    }

    const handleSearch = (value) => {
        setSearch(value)
        setPage(1)
        // Debounce is intentionally avoided to keep this module dependency-free.
        fetchLogs({ page: 1, search: value })
    }

    const exportLogs = () => {
        if (!logs.length) {
            setError('There are no logs on this page to export.')
            return
        }
        const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Description', 'IP Address', 'Status']
        const rows = logs.map((log) => [
            `${log.date} ${log.time}`, log.user, log.role, log.action,
            log.module, log.description, log.ip, log.status,
        ])
        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\\r\\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'bizflow-audit-logs.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    ADMIN SIDEBAR
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

                        {/* Header Actions */}

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

                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                                <div>

                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            Automation Logs
                                        </span>
                                    </div>

                                    <h1
                                        className="
                                            mt-2
                                            text-2xl
                                            font-bold
                                            tracking-tight
                                            text-[#171B25]
                                        "
                                    >
                                        Admin Logs
                                    </h1>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Monitor administrative activities, user
                                        actions, security events, and important
                                        system changes.
                                    </p>

                                </div>

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={() => fetchLogs()}
                                        disabled={loading}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#D9DDE5]
                                            bg-white
                                            px-3
                                            text-xs
                                            font-medium
                                            text-[#454B58]
                                            transition
                                            hover:bg-[#F8F9FC]
                                        "
                                    >
                                        <RefreshCw
                                            size={14}
                                            strokeWidth={1.8}
                                        />

                                        Refresh
                                    </button>

                                    <button
                                        type="button"
                                        onClick={exportLogs}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#BFD2FF]
                                            bg-[#F5F8FF]
                                            px-3
                                            text-xs
                                            font-medium
                                            text-[#0757C9]
                                            transition
                                            hover:bg-[#EAF0FF]
                                        "
                                    >
                                        <Download
                                            size={14}
                                            strokeWidth={1.8}
                                        />

                                        Export Logs
                                    </button>

                                </div>

                            </div>

                            {/* =================================================
                                SUMMARY CARDS
                            ================================================== */}

                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                                {summaryCards.map((card) => {
                                    const Icon = card.icon

                                    return (
                                        <div
                                            key={card.title}
                                            className="
                                                rounded-lg
                                                border
                                                border-[#E2E6EC]
                                                bg-white
                                                p-5
                                                shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                            "
                                        >

                                            <div className="flex items-start justify-between">

                                                <div>

                                                    <p className="text-[10px] font-medium tracking-wide text-[#69707D]">
                                                        {card.title}
                                                    </p>

                                                    <div className="mt-3 flex items-end gap-2">

                                                        <span
                                                            className={`text-2xl font-bold leading-none ${card.valueClass}`}
                                                        >
                                                            {card.value}
                                                        </span>

                                                        {card.title === 'TOTAL EVENTS' && (
                                                            <span className="mb-0.5 text-[9px] font-semibold text-[#18A957]">
                                                                ↗ {card.change}
                                                            </span>
                                                        )}

                                                        {card.title === "TODAY'S EVENTS" && (
                                                            <span className="mb-0.5 text-[9px] text-[#68707D]">
                                                                {card.change}
                                                            </span>
                                                        )}

                                                        {card.title === 'SECURITY EVENTS' && (
                                                            <span className="mb-0.5 rounded border border-[#F5C879] bg-[#FFF9E8] px-1.5 py-0.5 text-[8px] font-medium text-[#D88900]">
                                                                {card.change}
                                                            </span>
                                                        )}

                                                        {card.title === 'FAILED ACTIONS' && (
                                                            <span className="mb-0.5 text-[9px] font-medium text-red-500">
                                                                {card.change}
                                                            </span>
                                                        )}

                                                    </div>

                                                </div>

                                                <div
                                                    className={`
                                                        flex
                                                        h-9
                                                        w-9
                                                        items-center
                                                        justify-center
                                                        rounded-md
                                                        ${card.iconClass}
                                                    `}
                                                >
                                                    <Icon
                                                        size={17}
                                                        strokeWidth={1.8}
                                                    />
                                                </div>

                                            </div>

                                            <p className="mt-3 text-[10px] text-[#858B96]">
                                                {card.description}
                                            </p>

                                        </div>
                                    )
                                })}

                            </div>

                            {/* =================================================
                                ACTIVITY LOG FILTERS
                            ================================================== */}

                            <section
                                className="
                                    mt-5
                                    rounded-lg
                                    border
                                    border-[#E2E6EC]
                                    bg-white
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >

                                <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">

                                    <div className="flex items-center gap-2">

                                        <h2 className="text-sm font-semibold text-[#242936]">
                                            Activity Logs
                                        </h2>

                                        <span className="rounded-full bg-[#F1F3F8] px-2 py-0.5 text-[9px] font-medium text-[#59606E]">
                                            Live Feed
                                        </span>

                                    </div>

                                    <div className="relative w-full xl:w-72">

                                        <Search
                                            size={14}
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
                                            onChange={(event) => handleSearch(event.target.value)}
                                            placeholder="Search logs by user, action, IP address, or description..."
                                            className="
                                                h-9
                                                w-full
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                pl-9
                                                pr-3
                                                text-[10px]
                                                outline-none
                                                placeholder:text-[#949AA5]
                                                focus:border-[#AFC5F5]
                                            "
                                        />

                                    </div>

                                </div>

                                <div className="border-t border-[#ECEEF2] px-5 py-4">

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

                                        {/* Date Range */}

                                        <div>
                                            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-wide text-[#69707D]">
                                                Date Range
                                            </label>

                                            <select
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#DDE1E8]
                                                    bg-white
                                                    px-3
                                                    text-[10px]
                                                    text-[#454B58]
                                                    outline-none
                                                "
                                                value={filters.dateRange}
                                                onChange={(event) => updateFilter('dateRange', event.target.value)}
                                            >
                                                <option value="today">Today</option>
                                                <option value="yesterday">Yesterday</option>
                                                <option value="last7days">Last 7 Days</option>
                                                <option value="last30days">Last 30 Days</option>
                                                <option value="all">All Time</option>
                                            </select>
                                        </div>

                                        {/* User */}

                                        <div>
                                            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-wide text-[#69707D]">
                                                User
                                            </label>

                                            <select
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#DDE1E8]
                                                    bg-white
                                                    px-3
                                                    text-[10px]
                                                    text-[#454B58]
                                                    outline-none
                                                "
                                                value={filters.user}
                                                onChange={(event) => updateFilter('user', event.target.value)}
                                            >
                                                <option value="">All Users</option>
                                                <option value="Admin User">Admin User</option>
                                                <option value="Managers">Managers</option>
                                                <option value="Staff">Staff</option>
                                            </select>
                                        </div>

                                        {/* Action Type */}

                                        <div>
                                            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-wide text-[#69707D]">
                                                Action Type
                                            </label>

                                            <select
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#DDE1E8]
                                                    bg-white
                                                    px-3
                                                    text-[10px]
                                                    text-[#454B58]
                                                    outline-none
                                                "
                                                value={filters.action}
                                                onChange={(event) => updateFilter('action', event.target.value)}
                                            >
                                                <option value="">All Actions</option>
                                                <option value="Created User">Created User</option>
                                                <option value="Updated User">Updated User</option>
                                                <option value="Deleted User">Deleted User</option>
                                                <option value="Login">Login</option>
                                            </select>
                                        </div>

                                        {/* Module */}

                                        <div>
                                            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-wide text-[#69707D]">
                                                Module
                                            </label>

                                            <select
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#DDE1E8]
                                                    bg-white
                                                    px-3
                                                    text-[10px]
                                                    text-[#454B58]
                                                    outline-none
                                                "
                                                value={filters.module}
                                                onChange={(event) => updateFilter('module', event.target.value)}
                                            >
                                                <option value="">All Modules</option>
                                                <option value="User Management">User Management</option>
                                                <option value="Roles & Permissions">Roles & Permissions</option>
                                                <option value="System Settings">System Settings</option>
                                                <option value="Automation">Automation</option>
                                            </select>
                                        </div>

                                        {/* Status */}

                                        <div>
                                            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-wide text-[#69707D]">
                                                Status
                                            </label>

                                            <select
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#DDE1E8]
                                                    bg-white
                                                    px-3
                                                    text-[10px]
                                                    text-[#454B58]
                                                    outline-none
                                                "
                                                value={filters.status}
                                                onChange={(event) => updateFilter('status', event.target.value)}
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Success">Success</option>
                                                <option value="Failed">Failed</option>
                                                <option value="Pending">Pending</option>
                                            </select>
                                        </div>

                                    </div>

                                    <div className="mt-4 flex justify-end">

                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="
                                                flex
                                                items-center
                                                gap-1.5
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                px-3
                                                py-1.5
                                                text-[10px]
                                                font-medium
                                                text-[#69707D]
                                                transition
                                                hover:bg-[#F8F9FC]
                                            "
                                        >
                                            <X size={12} />

                                            Clear Filters
                                        </button>

                                    </div>

                                </div>

                            </section>

                            {/* =================================================
                                INFORMATION NOTICE
                            ================================================== */}

                            <div
                                className="
                                    mt-4
                                    flex
                                    items-center
                                    gap-2
                                    rounded-md
                                    border
                                    border-[#CFE0FF]
                                    bg-[#F3F7FF]
                                    px-3
                                    py-2.5
                                    text-[10px]
                                    text-[#0757C9]
                                "
                            >
                                <ShieldAlert
                                    size={14}
                                    strokeWidth={1.8}
                                />

                                <span>
                                    Audit logs are read-only and cannot be modified
                                    or deleted. Cryptographic timestamp verification
                                    active.
                                </span>
                            </div>

                            {/* =================================================
                                RECENT ADMINISTRATIVE ACTIVITY
                            ================================================== */}

                            <section
                                className="
                                    mt-4
                                    overflow-hidden
                                    rounded-lg
                                    border
                                    border-[#E2E6EC]
                                    bg-white
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >

                                <div className="flex items-center justify-between border-b border-[#E6E8ED] px-5 py-4">

                                    <div>
                                        <h2 className="text-sm font-semibold text-[#242936]">
                                            Recent Administrative Activity
                                        </h2>

                                        <p className="mt-0.5 text-[9px] text-[#858B96]">
                                            Showing chronological events captured
                                            across all enterprise tenants
                                        </p>
                                    </div>

                                    <span className="rounded-md bg-[#F5F6FA] px-2 py-1 text-[9px] text-[#69707D]">
                                        ◷ Auto-synced 1m ago
                                    </span>

                                </div>

                                {/* Table Header */}

                                <div
                                    className="
                                        hidden
                                        grid-cols-[95px_170px_110px_125px_minmax(220px,1fr)_105px_75px_45px]
                                        gap-0
                                        bg-[#F8F9FC]
                                        px-5
                                        py-3
                                        lg:grid
                                    "
                                >
                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                        Timestamp
                                    </span>

                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                        User
                                    </span>

                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                        Action
                                    </span>

                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                        Module
                                    </span>

                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                        Description
                                    </span>

                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                        IP Address
                                    </span>

                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                        Status
                                    </span>

                                    <span className="text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                        Details
                                    </span>
                                </div>

                                {/* Table Rows */}

                                {error && (
                                    <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs text-red-700">
                                        {error}
                                    </div>
                                )}

                                {loading && (
                                    <div className="border-t border-[#ECEEF2] px-5 py-6 text-center text-xs text-[#69707D]">
                                        Loading audit logs...
                                    </div>
                                )}

                                {!loading && !error && logs.length === 0 && (
                                    <div className="border-t border-[#ECEEF2] px-5 py-8 text-center text-xs text-[#69707D]">
                                        No audit logs found for the selected filters.
                                    </div>
                                )}

                                {logs.map((log, index) => (
                                    <div
                                        key={log.id || `${log.date}-${index}`}
                                        className="
                                            grid
                                            grid-cols-1
                                            gap-3
                                            border-t
                                            border-[#ECEEF2]
                                            px-5
                                            py-4
                                            lg:grid-cols-[95px_170px_110px_125px_minmax(220px,1fr)_105px_75px_45px]
                                            lg:items-center
                                            lg:gap-0
                                        "
                                    >

                                        {/* Timestamp */}

                                        <div>
                                            <p className="text-[9px] font-semibold text-[#343A47]">
                                                {log.date}
                                            </p>

                                            <p className="mt-0.5 text-[8px] text-[#858B96]">
                                                {log.time}
                                            </p>
                                        </div>

                                        {/* User */}

                                        <div className="flex items-center gap-2">

                                            <span
                                                className="
                                                    flex
                                                    h-6
                                                    w-6
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    bg-[#E4EDFF]
                                                    text-[7px]
                                                    font-semibold
                                                    text-[#0757C9]
                                                "
                                            >
                                                {log.initials}
                                            </span>

                                            <div>
                                                <p className="text-[9px] font-semibold text-[#343A47]">
                                                    {log.user}
                                                </p>

                                                <p className="text-[8px] text-[#858B96]">
                                                    {log.role}
                                                </p>
                                            </div>

                                        </div>

                                        {/* Action */}

                                        <span
                                            className="
                                                w-fit
                                                rounded
                                                border
                                                border-[#9CE4C2]
                                                bg-[#EEFCF4]
                                                px-2
                                                py-1
                                                text-[8px]
                                                font-medium
                                                text-[#149653]
                                            "
                                        >
                                            {log.action}
                                        </span>

                                        {/* Module */}

                                        <span className="text-[9px] font-medium text-[#454B58]">
                                            {log.module}
                                        </span>

                                        {/* Description */}

                                        <span className="text-[9px] text-[#69707D]">
                                            {log.description}
                                        </span>

                                        {/* IP */}

                                        <span className="font-mono text-[8px] text-[#7B8492]">
                                            {log.ip}
                                        </span>

                                        {/* Status */}

                                        <span
                                            className="
                                                flex
                                                w-fit
                                                items-center
                                                gap-1
                                                rounded-full
                                                border
                                                border-[#A9E8C8]
                                                bg-[#F0FDF5]
                                                px-2
                                                py-1
                                                text-[8px]
                                                font-medium
                                                text-[#159957]
                                            "
                                        >
                                            <CheckCircle2
                                                size={9}
                                                strokeWidth={2}
                                            />

                                            {log.status}
                                        </span>

                                        {/* Details */}

                                        <button
                                            type="button"
                                            aria-label="View log details"
                                            className="
                                                flex
                                                h-7
                                                w-7
                                                items-center
                                                justify-center
                                                rounded-md
                                                text-[#69707D]
                                                transition
                                                hover:bg-[#F3F5F9]
                                                hover:text-[#0757C9]
                                            "
                                        >
                                            <Eye
                                                size={14}
                                                strokeWidth={1.7}
                                            />
                                        </button>

                                    </div>
                                ))}

                                {/* =================================================
                                    PAGINATION
                                ================================================== */}

                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-3
                                        border-t
                                        border-[#E6E8ED]
                                        px-5
                                        py-3
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >

                                    <div className="flex items-center gap-4">

                                        <span className="text-[9px] text-[#69707D]">
                                            Showing {pagination.total === 0 ? 0 : ((page - 1) * limit) + 1}–{Math.min(page * limit, pagination.total)} of {Number(pagination.total || 0).toLocaleString()} events
                                        </span>

                                        <div className="flex items-center gap-2">

                                            <span className="text-[9px] text-[#69707D]">
                                                Rows per page:
                                            </span>

                                            <select
                                                className="
                                                    h-7
                                                    rounded
                                                    border
                                                    border-[#DDE1E8]
                                                    bg-white
                                                    px-2
                                                    text-[9px]
                                                    text-[#454B58]
                                                "
                                                value={String(limit)}
                                                onChange={(event) => {
                                                    setLimit(Number(event.target.value))
                                                    setPage(1)
                                                    fetchLogs({ page: 1, limit: Number(event.target.value) })
                                                }}
                                            >
                                                <option value="10">10</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                            </select>

                                        </div>

                                    </div>

                                    <div className="flex items-center gap-1">

                                        <button
                                            type="button"
                                            disabled={page <= 1 || loading}
                                            onClick={() => fetchLogs({ page: page - 1 })}
                                            className="flex h-7 items-center gap-1 rounded border border-[#E0E3E9] px-2 text-[9px] text-[#454B58] disabled:opacity-40"
                                        >
                                            <ChevronLeft size={12} />
                                            Previous
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => fetchLogs({ page: 1 })}
                                            className={`h-7 min-w-7 rounded px-2 text-[9px] font-semibold ${page === 1 ? 'bg-[#0757C9] text-white' : 'text-[#59606E] hover:bg-[#F3F5F9]'}`}
                                        >
                                            {page}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={page >= pagination.totalPages || loading}
                                            onClick={() => fetchLogs({ page: page + 1 })}
                                            className="flex h-7 items-center gap-1 rounded border border-[#E0E3E9] px-2 text-[9px] text-[#454B58] hover:bg-[#F3F5F9] disabled:opacity-40"
                                        >
                                            Next

                                            <ChevronRight size={12} />
                                        </button>

                                    </div>

                                </div>

                            </section>

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
                                        © 2026 BizFlow | Cloud-Based SaaS Platform
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

export default AdminAutomationLogs
