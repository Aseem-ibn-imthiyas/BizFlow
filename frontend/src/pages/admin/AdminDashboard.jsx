import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import AdminSidebar from '../../components/sidebar/AdminSidebar'
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Clock3,
    Database,
    RefreshCw,
    Search,
    Server,
    ShieldAlert,
    ShieldCheck,
    Users,
    UserRound,
    UserPlus,
    Workflow,
    XCircle,
} from 'lucide-react'

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '')

const numberFormat = new Intl.NumberFormat('en-US')

const getUserRecords = (result) => {
    if (Array.isArray(result?.data)) return result.data
    if (Array.isArray(result?.users)) return result.users
    if (Array.isArray(result?.data?.users)) return result.data.users
    return []
}

const formatDate = (value, options = {}) => {
    if (!value) return 'Date unavailable'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Date unavailable'

    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...options,
    })
}

const getInitials = (name = '') =>
    name.trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'AU'

const statusTone = (status) => {
    if (status === 'Online' || status === 'Connected') return 'healthy'
    if (status === 'Offline' || status === 'Disconnected') return 'critical'
    return 'unknown'
}

function AdminDashboard() {
    const navigate = useNavigate()

    const [users, setUsers] = useState([])
    const [auditSummary, setAuditSummary] = useState(null)
    const [recentActivities, setRecentActivities] = useState([])
    const [healthData, setHealthData] = useState(null)
    const [adminProfile, setAdminProfile] = useState(null)

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [errorMessages, setErrorMessages] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [lastUpdated, setLastUpdated] = useState(null)

    const loadDashboard = useCallback(async ({ silent = false } = {}) => {
        if (silent) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        setErrorMessages([])

        try {
            const currentUser = auth.currentUser
            if (!currentUser) {
                throw new Error('Please sign in again to view the administrator dashboard.')
            }

            const token = await currentUser.getIdToken()
            const headers = {
                Authorization: `Bearer ${token}`,
                'Cache-Control': 'no-cache',
            }

            const requests = [
                {
                    key: 'users',
                    url: `${API_BASE_URL}/api/users`,
                },
                {
                    key: 'audit',
                    url: `${API_BASE_URL}/api/audit-logs?dateRange=all&limit=6&page=1`,
                },
                {
                    key: 'health',
                    url: `${API_BASE_URL}/api/system-health`,
                },
                {
                    key: 'profile',
                    url: `${API_BASE_URL}/api/users/me`,
                },
            ]

            const results = await Promise.allSettled(
                requests.map(async (request) => {
                    const response = await fetch(request.url, {
                        method: 'GET',
                        headers,
                        cache: 'no-store',
                    })

                    const result = await response.json().catch(() => ({}))

                    if (!response.ok || result.success === false) {
                        throw new Error(
                            result.message || `${request.key} request failed (${response.status})`
                        )
                    }

                    return { key: request.key, result }
                })
            )

            const nextErrors = []

            results.forEach((settled, index) => {
                const key = requests[index].key

                if (settled.status === 'rejected') {
                    nextErrors.push({
                        key,
                        message: settled.reason?.message || `Unable to load ${key}.`,
                    })
                    return
                }

                const result = settled.value.result

                if (key === 'users') {
                    setUsers(getUserRecords(result))
                }

                if (key === 'audit') {
                    const data = result.data || {}
                    setAuditSummary(data.summary || null)
                    setRecentActivities(
                        Array.isArray(data.logs) ? data.logs : []
                    )
                }

                if (key === 'health') {
                    setHealthData(result.data || null)
                }

                if (key === 'profile') {
                    setAdminProfile(result.data || result.user || null)
                }
            })

            setErrorMessages(nextErrors)
            setLastUpdated(new Date())
        } catch (error) {
            setErrorMessages([{ key: 'authentication', message: error.message || 'Unable to load dashboard data.' }])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        let active = true

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (!active) return

            if (firebaseUser) {
                loadDashboard()
            } else {
                setUsers([])
                setAuditSummary(null)
                setRecentActivities([])
                setHealthData(null)
                setAdminProfile(null)
                setErrorMessages([{
                    key: 'authentication',
                    message: 'Please sign in as an Administrator to view this dashboard.',
                }])
                setLoading(false)
            }
        })

        return () => {
            active = false
            unsubscribe()
        }
    }, [loadDashboard])

    const userStats = useMemo(() => {
        const total = users.length
        const administrators = users.filter((user) => user.role === 'Administrator').length
        const managers = users.filter((user) => user.role === 'Manager').length
        const staff = users.filter((user) => user.role === 'Staff').length
        const active = users.filter((user) => (user.status || 'Active') === 'Active').length
        const inactive = users.filter((user) => user.status && user.status !== 'Active').length

        return { total, administrators, managers, staff, active, inactive }
    }, [users])

    const roleDistribution = useMemo(() => {
        const roles = [
            { label: 'Administrators', value: userStats.administrators, color: 'bg-[#0757C9]' },
            { label: 'Managers', value: userStats.managers, color: 'bg-[#7189BE]' },
            { label: 'Staff', value: userStats.staff, color: 'bg-[#C7D5EF]' },
        ]

        return roles.map((role) => ({
            ...role,
            percentage: userStats.total
                ? Math.round((role.value / userStats.total) * 100)
                : 0,
        }))
    }, [userStats])

    const recentUsers = useMemo(() => {
        return [...users]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5)
    }, [users])

    const filteredActivities = useMemo(() => {
        const query = searchTerm.trim().toLowerCase()
        if (!query) return recentActivities

        return recentActivities.filter((activity) =>
            [
                activity.userName,
                activity.role,
                activity.action,
                activity.module,
                activity.description,
                activity.status,
            ].some((value) => String(value || '').toLowerCase().includes(query))
        )
    }, [recentActivities, searchTerm])

    const profileName =
        adminProfile?.fullName ||
        adminProfile?.name ||
        auth.currentUser?.displayName ||
        'Administrator'
    const profileRole = adminProfile?.role || 'SYSTEM ADMIN'
    const profileInitials = getInitials(profileName)

    const healthServices = [
        {
            label: 'API Server',
            detail: healthData?.api?.responseTimeMs != null
                ? `${healthData.api.responseTimeMs} ms response time`
                : 'Response time not reported',
            status: healthData?.api?.status || null,
            icon: Server,
        },
        {
            label: 'Database',
            detail: healthData?.database?.status || 'Connection status not reported',
            status: healthData?.database?.status || null,
            icon: Database,
        },
    ]

    const systemAlerts = useMemo(() => {
        if (!healthData) return []

        const alerts = []
        const apiStatus = healthData.api?.status
        const databaseConnected = healthData.database?.connected
        const memoryUsage = Number(healthData.server?.memoryUsagePercent)
        const responseTime = Number(healthData.api?.responseTimeMs)

        if (apiStatus && apiStatus !== 'Online') {
            alerts.push({
                id: 'api-status',
                title: 'API server requires attention',
                detail: `Reported status: ${apiStatus}`,
                severity: 'critical',
            })
        }

        if (databaseConnected === false) {
            alerts.push({
                id: 'database-status',
                title: 'Database connection issue',
                detail: 'The health endpoint reports that the database is disconnected.',
                severity: 'critical',
            })
        }

        if (Number.isFinite(memoryUsage) && memoryUsage >= 85) {
            alerts.push({
                id: 'memory-critical',
                title: 'High server memory usage',
                detail: `Memory usage is ${memoryUsage}%.`,
                severity: 'critical',
            })
        } else if (Number.isFinite(memoryUsage) && memoryUsage >= 70) {
            alerts.push({
                id: 'memory-warning',
                title: 'Server memory usage warning',
                detail: `Memory usage is ${memoryUsage}%.`,
                severity: 'warning',
            })
        }

        if (Number.isFinite(responseTime) && responseTime > 1000) {
            alerts.push({
                id: 'response-time',
                title: 'API response is slower than expected',
                detail: `Reported response time is ${responseTime} ms.`,
                severity: 'warning',
            })
        }

        return alerts
    }, [healthData])

    const stats = [
        {
            title: 'Total Users',
            value: userStats.total,
            description: 'Registered system accounts',
            icon: Users,
            iconClass: 'bg-blue-50 text-blue-600',
        },
        {
            title: 'Administrators',
            value: userStats.administrators,
            description: 'Users with administrator role',
            icon: ShieldCheck,
            iconClass: 'bg-indigo-50 text-indigo-600',
        },
        {
            title: 'Managers',
            value: userStats.managers,
            description: 'Users with manager role',
            icon: UserRound,
            iconClass: 'bg-slate-50 text-slate-600',
        },
        {
            title: 'Staff Members',
            value: userStats.staff,
            description: 'Users with staff role',
            icon: Users,
            iconClass: 'bg-orange-50 text-orange-600',
        },
        {
            title: "Today's Events",
            value: auditSummary?.todayEvents,
            description: 'Recorded audit events today',
            icon: Activity,
            iconClass: 'bg-cyan-50 text-cyan-700',
            unavailable: auditSummary?.todayEvents == null,
        },
        {
            title: 'Failed Actions',
            value: auditSummary?.failedActions,
            description: 'Failed or rejected actions',
            icon: ShieldAlert,
            iconClass: 'bg-red-50 text-red-600',
            danger: true,
            unavailable: auditSummary?.failedActions == null,
        },
    ]

    const handleSearchSubmit = (event) => {
        event.preventDefault()
        const query = searchTerm.toLowerCase()

        if (query.includes('user') || query.includes('staff') || query.includes('manager')) {
            navigate('/admin/users')
        } else if (query.includes('role') || query.includes('permission')) {
            navigate('/admin/roles')
        } else if (query.includes('log') || query.includes('activity') || query.includes('audit')) {
            navigate('/admin/logs')
        } else if (query.includes('health') || query.includes('server') || query.includes('system')) {
            navigate('/admin/health')
        }
    }

    const formatMetric = (value) =>
        value == null ? '—' : numberFormat.format(Number(value) || 0)

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">
                <AdminSidebar />

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-6 lg:px-8">
                        <form onSubmit={handleSearchSubmit} className="relative w-72 max-w-[55vw]">
                            <Search
                                size={16}
                                strokeWidth={1.8}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                            />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search users, logs, settings..."
                                aria-label="Search administrator sections"
                                className="h-9 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-10 pr-4 text-xs text-[#343A47] outline-none transition placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                            />
                        </form>

                        <div className="flex items-center gap-3 sm:gap-5">
                            <button
                                type="button"
                                onClick={() => loadDashboard({ silent: true })}
                                disabled={refreshing}
                                className="flex items-center gap-2 rounded-md border border-[#D9DDE5] bg-white px-3 py-2 text-xs font-medium text-[#454B58] transition hover:bg-[#F8F9FC] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
                            </button>

                            <div className="h-7 w-px bg-[#E1E4EA]" />

                            <div className="flex items-center gap-3">
                                <div className="hidden text-right sm:block">
                                    <p className="text-xs font-semibold text-[#242936]">{profileName}</p>
                                    <p className="text-[9px] font-medium tracking-wide text-[#737A87]">
                                        {String(profileRole).toUpperCase()}
                                    </p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDE5F5] text-xs font-semibold text-[#315A9E]">
                                    {profileInitials}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-6 py-7 lg:px-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">Home</span>
                                        <span className="text-[#A1A6B0]">/</span>
                                        <span className="font-medium text-[#0757C9]">Dashboard</span>
                                    </div>
                                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25]">
                                        Administrator Dashboard
                                    </h1>
                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Monitor users, administrative activity, and the health of your BizFlow platform.
                                    </p>
                                </div>

                                <div className="text-xs text-[#7A808C]">
                                    {lastUpdated
                                        ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                                        : 'Waiting for dashboard data'}
                                </div>
                            </div>

                            {errorMessages.length > 0 && (
                                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4" role="status">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-700" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-amber-900">
                                                Some dashboard information could not be loaded
                                            </p>
                                            <ul className="mt-2 space-y-1">
                                                {errorMessages.map((item) => (
                                                    <li key={item.key} className="text-xs text-amber-800">
                                                        {item.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <div key={index} className="h-32 animate-pulse rounded-lg border border-[#E6E8ED] bg-white p-5">
                                            <div className="h-3 w-24 rounded bg-[#EDF0F5]" />
                                            <div className="mt-5 h-7 w-16 rounded bg-[#EDF0F5]" />
                                            <div className="mt-3 h-2 w-32 rounded bg-[#F2F4F7]" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {stats.map((stat) => {
                                            const Icon = stat.icon
                                            return (
                                                <section
                                                    key={stat.title}
                                                    className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-xs font-medium text-[#59606E]">{stat.title}</p>
                                                            <p className={`mt-2 text-2xl font-bold leading-none ${stat.danger && stat.value > 0 ? 'text-red-600' : 'text-[#171B25]'}`}>
                                                                {stat.unavailable ? '—' : formatMetric(stat.value)}
                                                            </p>
                                                        </div>
                                                        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${stat.iconClass}`}>
                                                            <Icon size={19} strokeWidth={1.8} />
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-xs text-[#7A808C]">{stat.description}</p>
                                                </section>
                                            )
                                        })}
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                                        <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-[#242936]">User Distribution</h2>
                                                    <p className="mt-1 text-xs text-[#7A808C]">Registered accounts by assigned role</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/admin/users')}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0757C9] hover:underline"
                                                >
                                                    Manage users <ArrowRight size={13} />
                                                </button>
                                            </div>

                                            <div className="mt-7 grid grid-cols-1 items-center gap-7 sm:grid-cols-[180px_minmax(0,1fr)]">
                                                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full"
                                                    style={{
                                                        background: userStats.total
                                                            ? `conic-gradient(#0757C9 0% ${roleDistribution[0].percentage}%, #7189BE ${roleDistribution[0].percentage}% ${roleDistribution[0].percentage + roleDistribution[1].percentage}%, #C7D5EF ${roleDistribution[0].percentage + roleDistribution[1].percentage}% 100%)`
                                                            : '#E8ECF3',
                                                    }}
                                                >
                                                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                                                        <span className="text-2xl font-bold text-[#202530]">{formatMetric(userStats.total)}</span>
                                                        <span className="mt-1 text-[9px] uppercase tracking-wide text-[#858B97]">Total users</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {roleDistribution.map((role) => (
                                                        <div key={role.label}>
                                                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                                                <span className="flex items-center gap-2 text-xs text-[#424854]">
                                                                    <span className={`h-2.5 w-2.5 rounded-sm ${role.color}`} />
                                                                    {role.label}
                                                                </span>
                                                                <span className="text-xs font-semibold tabular-nums text-[#242936]">
                                                                    {formatMetric(role.value)} <span className="font-normal text-[#858B97]">({role.percentage}%)</span>
                                                                </span>
                                                            </div>
                                                            <div className="h-2 overflow-hidden rounded-full bg-[#EEF1F6]">
                                                                <div className={`h-full rounded-full ${role.color}`} style={{ width: `${role.percentage}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="border-t border-[#EEF0F4] pt-3 text-xs text-[#737A87]">
                                                        {formatMetric(userStats.active)} active accounts
                                                        {userStats.inactive > 0 ? ` · ${formatMetric(userStats.inactive)} other statuses` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-[#242936]">System Status</h2>
                                                    <p className="mt-1 text-xs text-[#7A808C]">Latest health-check response</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/admin/health')}
                                                    className="text-xs font-medium text-[#0757C9] hover:underline"
                                                >
                                                    Details
                                                </button>
                                            </div>

                                            <div className="mt-6 space-y-5">
                                                {healthServices.map((service) => {
                                                    const Icon = service.icon
                                                    const tone = statusTone(service.status)
                                                    return (
                                                        <div key={service.label} className="flex items-center justify-between gap-3">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F1F4FA] text-[#4E5562]">
                                                                    <Icon size={17} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-medium text-[#343A47]">{service.label}</p>
                                                                    <p className="mt-1 truncate text-[10px] text-[#858B97]">{service.detail}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${tone === 'healthy'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : tone === 'critical'
                                                                        ? 'bg-red-50 text-red-700'
                                                                        : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {service.status || 'UNKNOWN'}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div className="mt-6 border-t border-[#E1E4EA] pt-4">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[#7A808C]">Server memory</span>
                                                    <span className="font-semibold text-[#343A47]">
                                                        {healthData?.server?.memoryUsagePercent != null
                                                            ? `${healthData.server.memoryUsagePercent}%`
                                                            : 'Not reported'}
                                                    </span>
                                                </div>
                                                {healthData?.server?.memoryUsagePercent != null && (
                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF1F6]">
                                                        <div
                                                            className={`h-full rounded-full ${Number(healthData.server.memoryUsagePercent) >= 85
                                                                    ? 'bg-red-500'
                                                                    : Number(healthData.server.memoryUsagePercent) >= 70
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-[#0757C9]'
                                                                }`}
                                                            style={{ width: `${Math.min(100, Math.max(0, Number(healthData.server.memoryUsagePercent)))}%` }}
                                                        />
                                                    </div>
                                                )}
                                                <p className="mt-3 text-[10px] text-[#858B97]">
                                                    {healthData?.checkedAt
                                                        ? `Checked ${formatDate(healthData.checkedAt, { hour: '2-digit', minute: '2-digit' })}`
                                                        : 'Health check timestamp unavailable'}
                                                </p>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                                        <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between border-b border-[#E6E8ED] px-5 py-4">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-[#242936]">Recent Administrative Activity</h2>
                                                    <p className="mt-1 text-xs text-[#7A808C]">Latest events returned by the audit log service</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/admin/logs')}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0757C9] hover:underline"
                                                >
                                                    View logs <ArrowRight size={13} />
                                                </button>
                                            </div>

                                            {filteredActivities.length === 0 ? (
                                                <div className="px-5 py-10 text-center">
                                                    <Activity size={22} className="mx-auto text-[#A0A7B3]" />
                                                    <p className="mt-3 text-xs font-medium text-[#59606E]">
                                                        {recentActivities.length ? 'No activities match your search.' : 'No recent audit events were returned.'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-[#ECEEF2]">
                                                    {filteredActivities.slice(0, 6).map((activity, index) => {
                                                        const failed = /fail|denied|error|reject/i.test(`${activity.status || ''} ${activity.action || ''}`)
                                                        const actor = activity.userName || 'System'
                                                        return (
                                                            <div key={activity._id || `${activity.action}-${activity.createdAt}-${index}`} className="flex items-start gap-3 px-5 py-4">
                                                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${failed ? 'bg-red-50 text-red-600' : 'bg-[#EEF3FF] text-[#315A9E]'}`}>
                                                                    {getInitials(actor)}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                        <p className="text-xs font-semibold text-[#343A47]">{actor}</p>
                                                                        <span className="text-[10px] text-[#9298A3]">{activity.role || 'System'}</span>
                                                                    </div>
                                                                    <p className="mt-1 text-xs text-[#59606E]">
                                                                        {activity.action || activity.event || 'System activity'}
                                                                        {activity.module ? ` · ${activity.module}` : ''}
                                                                    </p>
                                                                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#858B97]">
                                                                        {activity.description || activity.details || activity.message || 'An audit event was recorded.'}
                                                                    </p>
                                                                    <p className="mt-1.5 text-[10px] text-[#9298A3]">
                                                                        {activity.createdAt ? formatDate(activity.createdAt, { hour: '2-digit', minute: '2-digit' }) : 'Time unavailable'}
                                                                    </p>
                                                                </div>
                                                                <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-semibold ${failed ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                                                    {activity.status || (failed ? 'Failed' : 'Recorded')}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </section>

                                        <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between border-b border-[#E6E8ED] px-5 py-4">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-[#242936]">Recently Registered Users</h2>
                                                    <p className="mt-1 text-xs text-[#7A808C]">Latest accounts by creation date</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/admin/users')}
                                                    className="text-xs font-medium text-[#0757C9] hover:underline"
                                                >
                                                    View all
                                                </button>
                                            </div>

                                            {recentUsers.length === 0 ? (
                                                <div className="px-5 py-10 text-center">
                                                    <Users size={22} className="mx-auto text-[#A0A7B3]" />
                                                    <p className="mt-3 text-xs text-[#59606E]">No user records were returned.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-[#ECEEF2]">
                                                    {recentUsers.map((user) => {
                                                        const name = user.fullName || 'Unnamed User'
                                                        const role = user.role || 'Staff'
                                                        return (
                                                            <div key={user._id || user.firebaseUid || user.email} className="flex items-center gap-3 px-5 py-3.5">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-[9px] font-semibold text-[#315A9E]">
                                                                    {getInitials(name)}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-xs font-semibold text-[#343A47]">{name}</p>
                                                                    <p className="mt-1 truncate text-[10px] text-[#858B97]">{user.email || 'Email unavailable'}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block text-[9px] font-semibold text-[#59606E]">{role}</span>
                                                                    <span className="mt-1 block text-[9px] text-[#9298A3]">{formatDate(user.createdAt, { year: undefined })}</span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </section>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                                        <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-[#242936]">System Alerts</h2>
                                                    <p className="mt-1 text-xs text-[#7A808C]">Alerts derived from the latest health-check response</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/admin/health')}
                                                    className="text-xs font-medium text-[#0757C9] hover:underline"
                                                >
                                                    Open health
                                                </button>
                                            </div>

                                            {!healthData ? (
                                                <p className="mt-5 text-xs text-[#858B97]">System alerts are unavailable because health data could not be loaded.</p>
                                            ) : systemAlerts.length === 0 ? (
                                                <div className="mt-5 flex items-center gap-3 rounded-md bg-[#F5FAF7] p-3">
                                                    <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                                                    <p className="text-xs text-[#426B53]">No alerts were detected by the available health checks.</p>
                                                </div>
                                            ) : (
                                                <div className="mt-4 space-y-3">
                                                    {systemAlerts.map((alert) => (
                                                        <div key={alert.id} className="flex items-start gap-3 rounded-md border border-[#F0E1D9] bg-[#FFFAF7] p-3">
                                                            {alert.severity === 'critical'
                                                                ? <XCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                                                                : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />}
                                                            <div>
                                                                <p className="text-xs font-semibold text-[#343A47]">{alert.title}</p>
                                                                <p className="mt-1 text-[10px] leading-4 text-[#737A87]">{alert.detail}</p>
                                                            </div>
                                                            <span className={`ml-auto shrink-0 text-[9px] font-semibold uppercase ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-700'}`}>
                                                                {alert.severity}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <h2 className="text-sm font-semibold text-[#242936]">Quick Actions</h2>
                                            <p className="mt-1 text-xs text-[#7A808C]">Common administrator tasks</p>
                                            <div className="mt-4 space-y-2">
                                                {[
                                                    { label: 'Add User', description: 'Register a system member', icon: UserPlus, path: '/admin/users' },
                                                    { label: 'Manage Roles', description: 'Review access permissions', icon: ShieldCheck, path: '/admin/roles' },
                                                    { label: 'View Audit Logs', description: 'Review administrative events', icon: Activity, path: '/admin/logs' },
                                                    { label: 'System Health', description: 'Inspect platform services', icon: BarChart3, path: '/admin/health' },
                                                    { label: 'Workflow Management', description: 'Manage platform workflows', icon: Workflow, path: '/admin/workflows' },
                                                ].map((action) => {
                                                    const Icon = action.icon
                                                    return (
                                                        <button
                                                            key={action.label}
                                                            type="button"
                                                            onClick={() => navigate(action.path)}
                                                            className="flex w-full items-center gap-3 rounded-md border border-[#EEF0F4] px-3 py-2.5 text-left transition hover:border-[#C8D5F2] hover:bg-[#FAFBFF]"
                                                        >
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EEF3FF] text-[#0757C9]">
                                                                <Icon size={16} />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-xs font-semibold text-[#343A47]">{action.label}</span>
                                                                <span className="mt-0.5 block text-[10px] text-[#858B97]">{action.description}</span>
                                                            </span>
                                                            <ArrowRight size={14} className="text-[#A0A7B3]" />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </section>
                                    </div>
                                </>
                            )}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <div className="flex flex-col gap-3 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">
                                    <p>© 2026 BizFlow | Cloud-Based SaaS Business Process Automation Platform</p>
                                    <p className="flex items-center gap-1.5">
                                        <Clock3 size={11} />
                                        {lastUpdated ? `Dashboard data updated ${lastUpdated.toLocaleTimeString()}` : 'Dashboard data not yet updated'}
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

export default AdminDashboard
