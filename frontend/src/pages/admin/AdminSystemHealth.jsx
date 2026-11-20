import { onAuthStateChanged } from 'firebase/auth'
import { useCallback, useEffect, useState } from 'react'
import { auth } from '../../config/firebase'
import AdminSidebar from '../../components/sidebar/AdminSidebar'
import {
    Bell,
    CircleHelp,
    Search,
    ShieldCheck,
    AlertTriangle,
    Database,
    Cloud,
    Server,
    Activity,
    Download,
    FileText,
    RotateCcw,
} from 'lucide-react'

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '')

function formatUptime(totalSeconds = 0) {
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${days}d ${hours}h ${minutes}m ${seconds}s`
}

function AdminSystemHealth() {

    const [recentActivities, setRecentActivities] = useState([])
    const [activityLoading, setActivityLoading] = useState(false)
    const [activityError, setActivityError] = useState('')
    
    const [healthData, setHealthData] = useState(null)
    const [healthLoading, setHealthLoading] = useState(false)
    const [healthError, setHealthError] = useState('')

    const fetchSystemHealth = useCallback(async () => {
        setHealthLoading(true)
        setHealthError('')

        try {
            const currentUser = auth.currentUser

            if (!currentUser) {
                throw new Error('Please sign in again to view system health.')
            }

            const token = await currentUser.getIdToken()

            const response = await fetch(`${API_BASE_URL}/api/system-health`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Unable to load system health.'
                )
            }

            setHealthData(result.data)
        } catch (error) {
            setHealthError(error.message || 'Unable to load system health.')
        } finally {
            setHealthLoading(false)
        }
    }, [])

    const fetchRecentActivities = useCallback(async () => {
        setActivityLoading(true)
        setActivityError('')

        try {
            const currentUser = auth.currentUser

            if (!currentUser) {
                throw new Error('Please sign in again to view audit logs.')
            }

            const token = await currentUser.getIdToken()

            const response = await fetch(`${API_BASE_URL}/api/audit-logs?limit=4&page=1`, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache',
                },
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Unable to load recent activity.'
                )
            }

            // The backend returns logs inside result.data.logs
            const logs = Array.isArray(result.data?.logs)
                ? result.data.logs
                : []

            setRecentActivities(
                logs.map((log) => ({
                    id: log._id || `${log.action}-${log.createdAt}`,
                    title: log.action || log.event || 'System activity',
                    description:
                        log.description ||
                        log.details ||
                        log.message ||
                        'An audit event was recorded.',
                    time: log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : 'Time unavailable',
                    color: /fail|denied|error/i.test(
                        `${log.action || ''} ${log.status || ''}`
                    )
                        ? 'bg-[#D63D3D]'
                        : 'bg-[#0757C9]',
                }))
            )
        } catch (error) {
            setActivityError(
                error.message || 'Unable to load recent activity.'
            )
        } finally {
            setActivityLoading(false)
        }
    }, [])


    const systemAlerts = []

    if (healthData) {
        const apiStatus = healthData.api?.status
        const databaseConnected = healthData.database?.connected
        const memoryUsage = Number(
            healthData.server?.memoryUsagePercent ?? 0
        )
        const responseTime = Number(
            healthData.api?.responseTimeMs ?? 0
        )

        if (apiStatus !== 'Online') {
            systemAlerts.push({
                id: 'api-offline',
                title: 'API Server Unavailable',
                description: 'The API server is not reporting an online status.',
                severity: 'Critical',
            })
        }

        if (databaseConnected === false) {
            systemAlerts.push({
                id: 'database-disconnected',
                title: 'Database Disconnected',
                description: 'BizFlow cannot confirm an active database connection.',
                severity: 'Critical',
            })
        }

        if (memoryUsage >= 85) {
            systemAlerts.push({
                id: 'memory-critical',
                title: 'High Memory Usage',
                description: `Server memory usage is ${memoryUsage}%.`,
                severity: 'Critical',
            })
        } else if (memoryUsage >= 70) {
            systemAlerts.push({
                id: 'memory-warning',
                title: 'Memory Usage Warning',
                description: `Server memory usage is ${memoryUsage}%.`,
                severity: 'Warning',
            })
        }

        if (responseTime > 1000) {
            systemAlerts.push({
                id: 'api-response-slow',
                title: 'Slow API Response',
                description: `The health endpoint responded in ${responseTime} ms.`,
                severity: 'Warning',
            })
        }
    }



    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchSystemHealth()
                fetchRecentActivities()
            }
        })

        return () => unsubscribe()
    }, [fetchSystemHealth, fetchRecentActivities])


    /* =========================================================
       SALES CHART
    ========================================================= */

    const salesData = [
        {
            day: 'Mon',
            value: 42,
        },
        {
            day: 'Tue',
            value: 65,
        },
        {
            day: 'Wed',
            value: 53,
        },
        {
            day: 'Thu',
            value: 76,
        },
        {
            day: 'Fri',
            value: 88,
        },
        {
            day: 'Sat',
            value: 70,
            active: true,
        },
        {
            day: 'Sun',
            value: 58,
        },
    ]

    /* =========================================================
       SYSTEM SERVICES
    ========================================================= */

    const systemServices = [
        {
            title: 'API Server',
            description: healthData
                ? `${healthData.api.status} · ${healthData.api.responseTimeMs} ms`
                : healthLoading
                    ? 'Checking status...'
                    : 'Status unavailable',
            icon: Server,
            status: healthData?.api.status,
            updated: healthData
                ? `Checked ${new Date(healthData.checkedAt).toLocaleTimeString()}`
                : 'Not checked',
        },
        {
            title: 'Database',
            description: healthData
                ? healthData.database.status
                : healthLoading
                    ? 'Checking connection...'
                    : 'Status unavailable',
            icon: Database,
            status: healthData?.database.status,
            updated: healthData
                ? `Checked ${new Date(healthData.checkedAt).toLocaleTimeString()}`
                : 'Not checked',
        },
        {
            title: 'Auth Service',
            description: 'Firebase Authentication',
            icon: ShieldCheck,
            status: null,
            updated: 'Not monitored',
        },
        {
            title: 'Cloud Storage',
            description: 'Storage status not connected',
            icon: Cloud,
            status: null,
            updated: 'Not monitored',
        },
    ]

    /* =========================================================
       INVENTORY
    ========================================================= */

    const inventoryData = [
        {
            label: 'In Stock',
            value: '1,240',
            color: 'bg-[#0757C9]',
        },
        {
            label: 'Low Stock',
            value: '250',
            color: 'bg-[#F1C40F]',
        },
        {
            label: 'Out Stock',
            value: '50',
            color: 'bg-[#D63D3D]',
        },
    ]

    /* =========================================================
       TASK PROGRESS
    ========================================================= */

    const taskProgress = [
        {
            label: 'High Priority',
            value: '85%',
            progress: 85,
            color: 'bg-[#D63D3D]',
        },
        {
            label: 'Medium Priority',
            value: '42%',
            progress: 42,
            color: 'bg-[#566B9D]',
        },
        {
            label: 'Recurring Tasks',
            value: '18%',
            progress: 18,
            color: 'bg-[#0757C9]',
        },
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

                            <div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[#343A47]">
                                        Home
                                    </span>

                                    <span className="text-[#A1A6B0]">
                                        ›
                                    </span>

                                    <span className="font-medium text-[#0757C9]">
                                        System Health
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
                                    System Health
                                </h2>

                                <p className="mt-1 text-sm text-[#69707D]">
                                    Monitor platform performance, business
                                    activities, and system health in real-time.
                                    Actionable insights for enterprise-level
                                    decision-making.
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                    <span
                                        className={`h-2 w-2 rounded-full ${healthData
                                                ? 'bg-[#18A957]'
                                                : healthError
                                                    ? 'bg-[#D63D3D]'
                                                    : 'bg-[#F1C40F]'
                                            }`}
                                    />

                                    <span className="text-[#59606E]">
                                        {healthLoading
                                            ? 'Checking server health...'
                                            : healthError
                                                ? 'Health check failed'
                                                : healthData
                                                    ? `Last checked ${new Date(
                                                        healthData.checkedAt
                                                    ).toLocaleTimeString()}`
                                                    : 'Waiting for health data'}
                                    </span>
                                </div>

                            </div>



                            {/* =================================================
                                SALES + HARDWARE
                            ================================================== */}

                            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* Sales Performance */}

                                <section
                                    className="
                                        min-h-52.5
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Sales Performance
                                        </h3>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="
                                                    rounded
                                                    bg-[#F1F3F8]
                                                    px-2
                                                    py-1.5
                                                    text-[9px]
                                                    font-medium
                                                    text-[#59606E]
                                                "
                                            >
                                                7D
                                            </button>

                                            <button
                                                type="button"
                                                className="
                                                    rounded
                                                    bg-[#0757C9]
                                                    px-2
                                                    py-1.5
                                                    text-[9px]
                                                    font-medium
                                                    text-white
                                                "
                                            >
                                                30D
                                            </button>

                                            <button
                                                type="button"
                                                className="
                                                    rounded
                                                    bg-[#F1F3F8]
                                                    px-2
                                                    py-1.5
                                                    text-[9px]
                                                    font-medium
                                                    text-[#59606E]
                                                "
                                            >
                                                1Y
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chart */}

                                    <div className="mt-6 flex h-36 items-end justify-between gap-4 border-b border-[#EEF0F4] px-3">
                                        {salesData.map((item) => (
                                            <div
                                                key={item.day}
                                                className="flex h-full flex-1 items-end justify-center"
                                            >
                                                <div
                                                    className={`
                                                        w-10
                                                        rounded-t
                                                        ${item.active
                                                            ? 'bg-[#9AB5E4]'
                                                            : 'bg-[#D1DDF3]'
                                                        }
                                                    `}
                                                    style={{
                                                        height: `${item.value}%`,
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-2 flex justify-between px-3">
                                        {salesData.map((item) => (
                                            <span
                                                key={item.day}
                                                className="flex-1 text-center text-[8px] text-[#6D7480]"
                                            >
                                                {item.day}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                {/* Hardware Resource Usage */}


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
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Server Resource Usage
                                        </h3>

                                        <Activity
                                            size={16}
                                            className="text-[#0757C9]"
                                        />
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <ResourceBar
                                            label="Node.js Heap Usage"
                                            value={
                                                healthData
                                                    ? `${healthData.server.memoryUsagePercent}%`
                                                    : healthLoading
                                                        ? 'Checking...'
                                                        : 'Unavailable'
                                            }
                                            percentage={healthData?.server.memoryUsagePercent ?? 0}
                                            color="bg-[#566B9D]"
                                        />

                                        <div className="border-t border-[#EEF0F4] pt-3">
                                            <p className="text-[10px] text-[#59606E]">
                                                Heap memory used
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-[#242936]">
                                                {healthData
                                                    ? `${healthData.server.memoryUsageMB} MB / ${healthData.server.memoryTotalMB} MB`
                                                    : '—'}
                                            </p>
                                        </div>

                                        <div className="border-t border-[#EEF0F4] pt-3">
                                            <p className="text-[10px] text-[#59606E]">
                                                API Response Time
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-[#242936]">
                                                {healthData
                                                    ? `${healthData.api.responseTimeMs} ms`
                                                    : '—'}
                                            </p>
                                        </div>

                                        <div className="border-t border-[#EEF0F4] pt-3">
                                            <p className="text-[10px] text-[#59606E]">
                                                Server Uptime
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-[#242936]">
                                                {healthData
                                                    ? formatUptime(healthData.uptimeSeconds)
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                            </div>

                            {/* =================================================
                                INVENTORY + TASK + RECENT ACTIVITY
                            ================================================== */}

                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* Left */}

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                                    {/* Inventory Status */}

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
                                            Inventory Status
                                        </h3>

                                        <div className="mt-5 flex items-center gap-7">
                                            {/* Donut */}

                                            <div
                                                className="
                                                    relative
                                                    flex
                                                    h-24
                                                    w-24
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    bg-[conic-gradient(#F9B51B_0deg_300deg,#E4E7ED_300deg_360deg)]
                                                "
                                            >
                                                <div
                                                    className="
                                                        flex
                                                        h-16
                                                        w-16
                                                        flex-col
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        bg-white
                                                    "
                                                >
                                                    <span className="text-sm font-bold text-[#202530]">
                                                        1.5k
                                                    </span>

                                                    <span className="text-[7px] uppercase text-[#858B97]">
                                                        Total
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Legend */}

                                            <div className="flex-1 space-y-3">
                                                {inventoryData.map((item) => (
                                                    <div
                                                        key={item.label}
                                                        className="flex items-center justify-between gap-4"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`
                                                                    h-2
                                                                    w-2
                                                                    rounded-full
                                                                    ${item.color}
                                                                `}
                                                            />

                                                            <span className="text-[10px] text-[#59606E]">
                                                                {item.label}
                                                            </span>
                                                        </div>

                                                        <span className="text-[10px] font-semibold text-[#343A47]">
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Task Progress */}

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
                                            Task Progress
                                        </h3>

                                        <div className="mt-5 space-y-5">
                                            {taskProgress.map((task) => (
                                                <div key={task.label}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-[#59606E]">
                                                            {task.label}
                                                        </span>

                                                        <span className="text-[10px] font-semibold text-[#343A47]">
                                                            {task.value}
                                                        </span>
                                                    </div>

                                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E9EBF3]">
                                                        <div
                                                            className={`
                                                                h-full
                                                                rounded-full
                                                                ${task.color}
                                                            `}
                                                            style={{
                                                                width: `${task.progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Recent Activity */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E6E8ED]
                                        bg-white
                                        p-4
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Recent Activity
                                        </h3>
                                    </div>

                                    {activityLoading && (
                                        <p className="text-xs text-[#7B818D]">
                                            Loading recent activity...
                                        </p>
                                    )}

                                    {activityError && (
                                        <p role="alert" className="text-xs text-red-600">
                                            {activityError}
                                        </p>
                                    )}

                                    {!activityLoading &&
                                        !activityError &&
                                        recentActivities.length === 0 && (
                                            <p className="text-xs text-[#7B818D]">
                                                No audit activity has been recorded yet.
                                            </p>
                                        )}

                                    <div className="mt-4 space-y-4">
                                        {recentActivities.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex gap-3"
                                            >
                                                <div className="relative pt-1">
                                                    <span
                                                        className={`
                                                            block
                                                            h-2
                                                            w-2
                                                            rounded-full
                                                            ${activity.color}
                                                        `}
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] font-semibold leading-3 text-[#343A47]">
                                                        {activity.title}
                                                    </p>

                                                    <p className="mt-0.5 text-[7px] leading-3 text-[#7B818D]">
                                                        {activity.description}
                                                    </p>

                                                    <p className="mt-0.5 text-[7px] text-[#9A9FAA]">
                                                        {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="
                                            mt-4
                                            w-full
                                            text-center
                                            text-[9px]
                                            font-semibold
                                            text-[#0757C9]
                                        "
                                    >
                                        View All Activity
                                    </button>
                                </section>
                            </div>

                            {/* =================================================
                                SYSTEM HEALTH
                            ================================================== */}

                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* Services */}

                                <section>
                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        System Health
                                    </h3>

                                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {systemServices.map((service) => {
                                            const Icon = service.icon

                                            return (
                                                <div
                                                    key={service.title}
                                                    className="
                                                        flex
                                                        min-h-14.5
                                                        items-center
                                                        justify-between
                                                        rounded-lg
                                                        border
                                                        border-[#E6E8ED]
                                                        bg-white
                                                        px-3
                                                        py-3
                                                    "
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-7 w-7 items-center justify-center rounded-md ${service.status === 'Online' ||
                                                                    service.status === 'Connected'
                                                                    ? 'bg-[#E8F8EF] text-[#18A957]'
                                                                    : service.status
                                                                        ? 'bg-[#FFF0E8] text-[#C65D2F]'
                                                                        : 'bg-[#F1F3F7] text-[#7B818D]'
                                                                }`}
                                                        >
                                                            <Icon
                                                                size={14}
                                                                strokeWidth={1.8}
                                                            />
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] font-semibold text-[#343A47]">
                                                                {service.title}
                                                            </p>

                                                            <p className="text-[7px] text-[#7B818D]">
                                                                {service.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <span
                                                            className={`ml-auto block h-1.5 w-1.5 rounded-full ${service.status === 'Online' ||
                                                                    service.status === 'Connected'
                                                                    ? 'bg-[#18A957]'
                                                                    : service.status
                                                                        ? 'bg-[#D63D3D]'
                                                                        : 'bg-[#9CA3AF]'
                                                                }`}
                                                        />

                                                        <p className="mt-1 text-[6px] text-[#7B818D]">
                                                            {service.updated}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>

                                {/* Critical Alerts */}


                                {/* Live System Alerts */}

                                <section className="rounded-lg border border-[#E6E8ED] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle
                                                size={15}
                                                className={
                                                    systemAlerts.some(
                                                        (alert) => alert.severity === 'Critical'
                                                    )
                                                        ? 'text-[#D63D3D]'
                                                        : systemAlerts.length > 0
                                                            ? 'text-[#C27A12]'
                                                            : 'text-[#18A957]'
                                                }
                                            />

                                            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#343A47]">
                                                System Alerts
                                            </h3>
                                        </div>

                                        <span
                                            className={`rounded-full px-2 py-1 text-[7px] font-semibold ${systemAlerts.length > 0
                                                    ? 'bg-[#FFE5E5] text-[#D63D3D]'
                                                    : 'bg-[#E8F8EF] text-[#15803D]'
                                                }`}
                                        >
                                            {healthLoading
                                                ? 'Checking...'
                                                : `${systemAlerts.length} Active`}
                                        </span>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        {healthLoading && !healthData && (
                                            <p className="text-xs text-[#7B818D]">
                                                Checking system health...
                                            </p>
                                        )}

                                        {healthError && !healthData && (
                                            <p role="alert" className="text-xs text-red-600">
                                                Unable to check system alerts: {healthError}
                                            </p>
                                        )}

                                        {!healthLoading && !healthData && !healthError && (
                                            <p className="text-xs text-[#7B818D]">
                                                System health data is not available yet.
                                            </p>
                                        )}

                                        {healthData && systemAlerts.length === 0 && (
                                            <div className="rounded-md border border-[#CDEBD8] bg-[#F0FBF4] p-3">
                                                <p className="text-[10px] font-semibold text-[#15803D]">
                                                    All Monitored Systems Healthy
                                                </p>

                                                <p className="mt-1 text-[9px] text-[#537B61]">
                                                    No issues were detected in the current health metrics.
                                                </p>
                                            </div>
                                        )}

                                        {systemAlerts.map((alert) => {
                                            const critical = alert.severity === 'Critical'

                                            return (
                                                <div
                                                    key={alert.id}
                                                    className={`rounded-md border p-3 ${critical
                                                            ? 'border-[#F2D7D7] bg-[#FFF5F5]'
                                                            : 'border-[#F2E2C4] bg-[#FFFAF0]'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-[10px] font-semibold text-[#343A47]">
                                                            {alert.title}
                                                        </p>

                                                        <span
                                                            className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-semibold ${critical
                                                                    ? 'bg-[#FFE5E5] text-[#D63D3D]'
                                                                    : 'bg-[#FFF0D6] text-[#9A6700]'
                                                                }`}
                                                        >
                                                            {alert.severity}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-[9px] leading-relaxed text-[#7B818D]">
                                                        {alert.description}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>

                            </div>

                            {/* =================================================
                                ACTION BUTTONS
                            ================================================== */}

                            <div className="mt-8 flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    className="
                                        flex
                                        h-9
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-md
                                        bg-[#0757C9]
                                        px-4
                                        text-[10px]
                                        font-semibold
                                        text-white
                                        shadow-sm
                                        transition
                                        hover:bg-[#0045AD]
                                    "
                                >
                                    <FileText
                                        size={13}
                                        strokeWidth={1.8}
                                    />

                                    Generate Report
                                </button>

                                {healthError && (
                                    <p
                                        role="alert"
                                        className="mb-3 text-xs text-red-600"
                                    >
                                        {healthError}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        fetchSystemHealth()
                                        fetchRecentActivities()
                                    }}
                                    disabled={healthLoading}
                                    className="
                                        flex
                                        h-9
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-md
                                        border
                                        border-[#D8DCE5]
                                        bg-white
                                        px-4
                                        text-[10px]
                                        font-semibold
                                        text-[#59606E]
                                        transition
                                        hover:bg-[#F7F8FB]
                                    "
                                >
                                    <RotateCcw
                                        size={13}
                                        strokeWidth={1.8}
                                    />

                                    Refresh Dashboard
                                </button>

                                <button
                                    type="button"
                                    className="
                                        flex
                                        h-9
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-md
                                        border
                                        border-[#0757C9]
                                        bg-white
                                        px-4
                                        text-[10px]
                                        font-semibold
                                        text-[#0757C9]
                                        transition
                                        hover:bg-[#F2F6FF]
                                    "
                                >
                                    <Download
                                        size={13}
                                        strokeWidth={1.8}
                                    />

                                    Export Data
                                </button>
                            </div>

                            {/* =================================================
                                FOOTER
                            ================================================== */}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
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

/* =========================================================
   RESOURCE BAR
========================================================= */

function ResourceBar({
    label,
    value,
    percentage,
    color,
}) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#59606E]">
                    {label}
                </span>

                <span className="text-[10px] font-semibold text-[#343A47]">
                    {value}
                </span>
            </div>

            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E9EBF3]">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    )
}

export default AdminSystemHealth