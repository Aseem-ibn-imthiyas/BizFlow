import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    DollarSign,
    Package,
    RefreshCw,
    Search,
    Settings,
    ShoppingCart,
    Target,
    Wallet,
    XCircle,
} from 'lucide-react'

import ManagerSidebar from '../../components/sidebar/ManagerSidebar'
import api from '../../services/api'

const EMPTY_INVENTORY_STATS = {
    totalProducts: 0,
    availableProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    totalStockUnits: 0,
    categoryBreakdown: [],
}

const getArray = (response, keys = []) => {
    let current = response

    for (let depth = 0; depth < 4; depth += 1) {
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

const getObject = (response) => {
    let current = response

    for (let depth = 0; depth < 4; depth += 1) {
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
            return {}
        }

        if (current.data !== undefined && !Array.isArray(current.data)) {
            current = current.data
            continue
        }

        if (current.result !== undefined && !Array.isArray(current.result)) {
            current = current.result
            continue
        }

        return current
    }

    return {}
}

const formatNumber = (value) => Number(value || 0).toLocaleString()

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value) || 0)

const formatDate = (value, options = { month: 'short', day: 'numeric' }) => {
    if (!value) return '—'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleDateString('en-US', options)
}

const getInitials = (name = '') =>
    String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'M'

const getErrorMessage = (error) =>
    error?.response?.data?.message ||
    error?.message ||
    'Unable to load this information.'

function StatCard({ title, value, subtitle, icon: Icon, tone = 'blue' }) {
    const tones = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-violet-50 text-violet-600',
        slate: 'bg-slate-100 text-slate-600',
    }

    return (
        <article className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-[0_2px_10px_rgba(20,35,70,0.03)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A8290]">
                        {title}
                    </p>
                    <p className="mt-3 truncate text-2xl font-bold tracking-tight text-[#171B25]">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-[#8A919D]">{subtitle}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`}>
                    <Icon size={19} strokeWidth={1.8} />
                </div>
            </div>
        </article>
    )
}

function SectionHeading({ title, subtitle, action, onAction }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <div>
                <h2 className="text-sm font-bold text-[#202633]">{title}</h2>
                {subtitle && <p className="mt-1 text-xs text-[#89909C]">{subtitle}</p>}
            </div>
            {action && (
                <button
                    type="button"
                    onClick={onAction}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#0757C9] transition hover:text-[#03449F]"
                >
                    {action}
                    <ArrowRight size={13} />
                </button>
            )}
        </div>
    )
}

function EmptyState({ message }) {
    return (
        <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-[#E2E6ED] px-4 text-center text-xs text-[#9299A5]">
            {message}
        </div>
    )
}

function ManagerDashboard() {
    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [inventoryStats, setInventoryStats] = useState(EMPTY_INVENTORY_STATS)
    const [inventoryProducts, setInventoryProducts] = useState([])
    const [stockAlerts, setStockAlerts] = useState([])
    const [sales, setSales] = useState([])
    const [salesStats, setSalesStats] = useState(null)
    const [tasks, setTasks] = useState([])
    const [taskStats, setTaskStats] = useState(null)

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [errors, setErrors] = useState({})

    const loadDashboard = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        setErrors({})

        const requests = [
            api.get('/users/me'),
            api.get('/inventory?page=1&limit=5&sortBy=updatedAt&sortOrder=desc'),
            api.get('/inventory/stats'),
            api.get('/inventory/alerts'),
            api.get('/sales'),
            api.get('/sales/stats'),
            api.get('/tasks?limit=100&sortBy=updatedAt&order=desc'),
            api.get('/tasks/stats'),
        ]

        const results = await Promise.allSettled(requests)
        const nextErrors = {}

        const apply = (index, key, setter, transform = (value) => value) => {
            const result = results[index]

            if (result.status === 'fulfilled') {
                setter(transform(result.value))
            } else {
                nextErrors[key] = getErrorMessage(result.reason)
                console.error(`Manager dashboard ${key} request failed:`, result.reason)
            }
        }

        apply(0, 'profile', setProfile, (response) => getObject(response))
        apply(1, 'inventory', setInventoryProducts, (response) =>
            getArray(response, ['products', 'items', 'results'])
        )
        apply(2, 'inventoryStats', setInventoryStats, (response) => ({
            ...EMPTY_INVENTORY_STATS,
            ...getObject(response),
        }))
        apply(3, 'stockAlerts', setStockAlerts, (response) =>
            getArray(response, ['alerts', 'items', 'products'])
        )
        apply(4, 'sales', setSales, (response) =>
            getArray(response, ['sales', 'items', 'results'])
        )
        apply(5, 'salesStats', setSalesStats, (response) => getObject(response))
        apply(6, 'tasks', setTasks, (response) =>
            getArray(response, ['tasks', 'items', 'results'])
        )
        apply(7, 'taskStats', setTaskStats, (response) => getObject(response))

        setErrors(nextErrors)
        setLoading(false)
        setRefreshing(false)
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadDashboard()
    }, [loadDashboard])

    const taskSummary = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const pending = tasks.filter((task) => task.status === 'Pending').length
        const inProgress = tasks.filter((task) => task.status === 'In Progress').length
        const completed = tasks.filter((task) => task.status === 'Completed').length
        const overdue = tasks.filter((task) => {
            if (!task.dueDate || task.status === 'Completed') return false
            const dueDate = new Date(task.dueDate)
            if (Number.isNaN(dueDate.getTime())) return false
            dueDate.setHours(0, 0, 0, 0)
            return dueDate < today
        }).length

        return {
            pending,
            inProgress,
            completed,
            overdue,
            // The task list endpoint currently returns up to 100 records.
            // Keep this label explicit rather than implying a full database total.
            loaded: tasks.length,
        }
    }, [tasks])

    const recentSales = useMemo(() => {
        const source = sales.length ? sales : (salesStats?.recentSales || [])
        return [...source]
            .sort((a, b) => new Date(b.saleDate || b.createdAt || 0) - new Date(a.saleDate || a.createdAt || 0))
            .slice(0, 5)
    }, [sales, salesStats])

    const salesTrend = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date()
            date.setHours(0, 0, 0, 0)
            date.setDate(date.getDate() - (6 - index))
            return date
        })

        const dailyTotals = days.map((date) => {
            const key = date.toDateString()
            const total = sales.reduce((sum, sale) => {
                const saleDate = new Date(sale.saleDate || sale.createdAt)
                if (Number.isNaN(saleDate.getTime()) || saleDate.toDateString() !== key) return sum
                if (sale.saleStatus === 'Cancelled') return sum
                return sum + Number(sale.grandTotal || 0)
            }, 0)

            return {
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: date,
                total,
            }
        })

        const max = Math.max(...dailyTotals.map((item) => item.total), 1)
        return dailyTotals.map((item) => ({
            ...item,
            height: Math.max((item.total / max) * 100, item.total > 0 ? 5 : 0),
        }))
    }, [sales])

    const upcomingDeadlines = useMemo(() => {
        const fromStats = taskStats?.upcomingDeadlines
        if (Array.isArray(fromStats)) return fromStats.slice(0, 5)

        const now = new Date()
        now.setHours(0, 0, 0, 0)

        return tasks
            .filter((task) => task.dueDate && task.status !== 'Completed')
            .filter((task) => new Date(task.dueDate) >= now)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5)
    }, [taskStats, tasks])

    const managerName =
        profile?.fullName ||
        profile?.name ||
        profile?.username ||
        'Manager'
    const managerRole = profile?.role || 'Manager'
    const managerImage = profile?.profileImage

    const inventoryDistribution = [
        {
            label: 'Available',
            value: Number(inventoryStats.availableProducts || 0),
            color: 'bg-emerald-500',
            text: 'text-emerald-600',
        },
        {
            label: 'Low stock',
            value: Number(inventoryStats.lowStockProducts || 0),
            color: 'bg-orange-400',
            text: 'text-orange-600',
        },
        {
            label: 'Out of stock',
            value: Number(inventoryStats.outOfStockProducts || 0),
            color: 'bg-red-500',
            text: 'text-red-600',
        },
    ]

    const inventoryTotal = Number(inventoryStats.totalProducts || 0)

    const statCards = [
        {
            title: 'Inventory Items',
            value: formatNumber(inventoryStats.totalProducts),
            subtitle: `${formatNumber(inventoryStats.totalStockUnits)} stock units`,
            icon: Package,
            tone: 'blue',
        },
        {
            title: 'Low Stock Items',
            value: formatNumber(inventoryStats.lowStockProducts),
            subtitle: 'Need stock attention',
            icon: AlertTriangle,
            tone: 'orange',
        },
        {
            title: "Today's Sales",
            value: formatCurrency(salesStats?.today?.revenue),
            subtitle: `${formatNumber(salesStats?.today?.totalOrders)} orders today`,
            icon: DollarSign,
            tone: 'green',
        },
        {
            title: 'Monthly Revenue',
            value: formatCurrency(salesStats?.month?.revenue),
            subtitle: `${formatNumber(salesStats?.totalOrders)} total orders`,
            icon: Wallet,
            tone: 'purple',
        },
        {
            title: 'Pending Tasks',
            value: formatNumber(taskSummary.pending),
            subtitle: `${formatNumber(taskSummary.inProgress)} currently in progress`,
            icon: Clock3,
            tone: 'orange',
        },
        {
            title: 'Completed Tasks',
            value: formatNumber(taskSummary.completed),
            subtitle: `${formatNumber(taskSummary.overdue)} overdue tasks`,
            icon: CheckCircle2,
            tone: 'green',
        },
    ]

    const viewInventory = () => navigate('/manager/inventory')
    const viewSales = () => navigate('/manager/sales')
    const viewTasks = () => navigate('/manager/tasks')

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">
                <aside className="h-screen w-60 shrink-0 overflow-hidden lg:w-64">
                    <ManagerSidebar />
                </aside>

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-5 lg:px-8">
                        <div className="relative hidden w-72 sm:block">
                            <Search
                                size={16}
                                strokeWidth={1.8}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                            />
                            <input
                                type="search"
                                placeholder="Search dashboard..."
                                aria-label="Search dashboard"
                                className="h-9 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-10 pr-4 text-xs text-[#343A47] outline-none transition placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        const value = event.currentTarget.value.toLowerCase()
                                        if (value.includes('inventory') || value.includes('stock')) viewInventory()
                                        else if (value.includes('sale') || value.includes('revenue')) viewSales()
                                        else if (value.includes('task')) viewTasks()
                                    }
                                }}
                            />
                        </div>

                        <div className="ml-auto flex items-center gap-4">
                            <button
                                type="button"
                                aria-label="Settings"
                                onClick={() => navigate('/manager/settings')}
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Settings size={18} strokeWidth={1.7} />
                            </button>
                            <div className="h-7 w-px bg-[#E1E4EA]" />
                            <div className="flex items-center gap-2.5">
                                {managerImage ? (
                                    <img
                                        src={managerImage}
                                        alt={`${managerName} profile`}
                                        className="h-9 w-9 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDE5F5] text-xs font-semibold text-[#315A9E]">
                                        {getInitials(managerName)}
                                    </div>
                                )}
                                <div className="hidden sm:block">
                                    <p className="max-w-36 truncate text-xs font-semibold text-[#343A47]">{managerName}</p>
                                    <p className="text-[10px] text-[#858B97]">{managerRole}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="mx-auto w-full max-w-[1600px] px-5 py-7 lg:px-8">
                            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-xs text-[#89909C]">
                                        <span>Home</span>
                                        <span>/</span>
                                        <span className="font-medium text-[#0757C9]">Dashboard</span>
                                    </div>
                                    <h1 className="text-2xl font-bold tracking-tight text-[#171B25]">
                                        Welcome back, {managerName.split(' ')[0]}!
                                    </h1>
                                    <p className="mt-1.5 text-sm text-[#7D8491]">
                                        Here is what is happening across your business today.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => loadDashboard(true)}
                                    disabled={refreshing}
                                    className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#DCE1E9] bg-white px-4 text-xs font-semibold text-[#465064] shadow-sm transition hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                                >
                                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                                    {refreshing ? 'Refreshing...' : 'Refresh data'}
                                </button>
                            </div>

                            {Object.keys(errors).length > 0 && (
                                <div className="mb-5 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                                    <AlertTriangle size={17} className="mt-0.5 shrink-0 text-orange-600" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-orange-800">
                                            Some dashboard information could not be loaded.
                                        </p>
                                        <p className="mt-1 text-[11px] leading-5 text-orange-700">
                                            {Object.entries(errors).map(([key, message]) => `${key}: ${message}`).join(' • ')}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setErrors({})}
                                        aria-label="Dismiss errors"
                                        className="text-orange-700 hover:text-orange-900"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-[#E7EAF0] bg-white text-sm text-[#7D8491]">
                                    <RefreshCw size={18} className="animate-spin text-[#0757C9]" />
                                    Loading your business dashboard...
                                </div>
                            ) : (
                                <>
                                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {statCards.map((card) => (
                                            <StatCard key={card.title} {...card} />
                                        ))}
                                    </section>

                                    <section className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
                                        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-[0_2px_10px_rgba(20,35,70,0.03)]">
                                            <SectionHeading
                                                title="Sales overview"
                                                subtitle="Daily sales from the sales records currently returned by the API"
                                                action="View sales"
                                                onAction={viewSales}
                                            />

                                            {salesTrend.some((item) => item.total > 0) ? (
                                                <div className="mt-5">
                                                    <div className="flex h-44 items-end gap-3 border-b border-[#EDF0F4] px-1">
                                                        {salesTrend.map((item) => (
                                                            <div key={item.label + item.date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                                                                <span className="text-[9px] font-medium text-[#697386]">
                                                                    {item.total > 0 ? formatCurrency(item.total) : ''}
                                                                </span>
                                                                <div className="flex h-28 w-full items-end justify-center">
                                                                    <div
                                                                        title={`${formatDate(item.date, { month: 'short', day: 'numeric' })}: ${formatCurrency(item.total)}`}
                                                                        className="w-full max-w-12 rounded-t-md bg-[#1765D1] transition-all"
                                                                        style={{ height: `${item.height}%`, minHeight: item.total > 0 ? '5px' : '0px' }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] text-[#89909C]">{item.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="mt-3 text-[10px] text-[#9AA1AC]">
                                                        This chart uses the dates present in the sales list response; it is not a separate historical analytics endpoint.
                                                    </p>
                                                </div>
                                            ) : (
                                                <EmptyState message="No sales records are available for the last seven days in the current response." />
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-[0_2px_10px_rgba(20,35,70,0.03)]">
                                            <SectionHeading
                                                title="Inventory status"
                                                subtitle={`${formatNumber(inventoryTotal)} products in inventory`}
                                                action="View inventory"
                                                onAction={viewInventory}
                                            />

                                            <div className="mt-6 space-y-5">
                                                {inventoryDistribution.map((item) => {
                                                    const percentage = inventoryTotal > 0
                                                        ? Math.min((item.value / inventoryTotal) * 100, 100)
                                                        : 0

                                                    return (
                                                        <div key={item.label}>
                                                            <div className="mb-2 flex items-center justify-between text-xs">
                                                                <span className="font-medium text-[#59606E]">{item.label}</span>
                                                                <span className={`font-semibold ${item.text}`}>{formatNumber(item.value)}</span>
                                                            </div>
                                                            <div className="h-2 overflow-hidden rounded-full bg-[#F0F2F6]">
                                                                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-[#EEF0F4] pt-4">
                                                <div>
                                                    <p className="text-[10px] text-[#89909C]">Categories</p>
                                                    <p className="mt-1 text-lg font-bold text-[#252B38]">{formatNumber(inventoryStats.totalCategories)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-[#89909C]">Suppliers</p>
                                                    <p className="mt-1 text-lg font-bold text-[#252B38]">{formatNumber(inventoryStats.totalSuppliers)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                                        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-[0_2px_10px_rgba(20,35,70,0.03)]">
                                            <SectionHeading
                                                title="Task progress"
                                                subtitle={`Based on ${formatNumber(taskSummary.loaded)} task records returned`}
                                                action="Manage tasks"
                                                onAction={viewTasks}
                                            />

                                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                {[
                                                    { label: 'Pending', value: taskSummary.pending, icon: Clock3, tone: 'text-slate-600 bg-slate-100' },
                                                    { label: 'In progress', value: taskSummary.inProgress, icon: Activity, tone: 'text-blue-600 bg-blue-50' },
                                                    { label: 'Completed', value: taskSummary.completed, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
                                                    { label: 'Overdue', value: taskSummary.overdue, icon: AlertTriangle, tone: 'text-red-600 bg-red-50' },
                                                ].map((item) => (
                                                    <div key={item.label} className="rounded-lg bg-[#F8F9FC] p-3">
                                                        <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${item.tone}`}>
                                                            <item.icon size={15} />
                                                        </div>
                                                        <p className="text-xl font-bold text-[#252B38]">{formatNumber(item.value)}</p>
                                                        <p className="mt-1 text-[10px] text-[#89909C]">{item.label}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-5 flex items-center justify-between border-t border-[#EEF0F4] pt-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-[#465064]">Task completion rate</p>
                                                    <p className="mt-1 text-[10px] text-[#89909C]">Calculated from the loaded task records</p>
                                                </div>
                                                <p className="text-lg font-bold text-[#0757C9]">
                                                    {taskSummary.loaded
                                                        ? Math.round((taskSummary.completed / taskSummary.loaded) * 100)
                                                        : 0}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-[0_2px_10px_rgba(20,35,70,0.03)]">
                                            <SectionHeading
                                                title="Upcoming deadlines"
                                                subtitle="Tasks requiring attention"
                                                action="View tasks"
                                                onAction={viewTasks}
                                            />

                                            {upcomingDeadlines.length === 0 ? (
                                                <EmptyState message="No upcoming task deadlines were returned." />
                                            ) : (
                                                <div className="divide-y divide-[#EEF0F4]">
                                                    {upcomingDeadlines.map((task, index) => (
                                                        <div key={task._id || task.taskId || `${task.title}-${index}`} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                                                <CalendarDays size={16} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-xs font-semibold text-[#343A47]">{task.title || 'Untitled task'}</p>
                                                                <p className="mt-1 text-[10px] text-[#89909C]">
                                                                    {task.assignedTo?.fullName ? `Assigned to ${task.assignedTo.fullName} · ` : ''}
                                                                    Due {formatDate(task.dueDate)}
                                                                </p>
                                                            </div>
                                                            <span className="shrink-0 rounded-md bg-orange-50 px-2 py-1 text-[9px] font-semibold text-orange-700">
                                                                {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                                        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-[0_2px_10px_rgba(20,35,70,0.03)]">
                                            <SectionHeading
                                                title="Low stock alerts"
                                                subtitle="Products at or below their minimum stock level"
                                                action="Manage inventory"
                                                onAction={viewInventory}
                                            />

                                            {stockAlerts.length === 0 ? (
                                                <div className="flex min-h-24 items-center gap-3 rounded-lg bg-emerald-50/70 px-4">
                                                    <CheckCircle2 size={19} className="text-emerald-600" />
                                                    <p className="text-xs font-medium text-emerald-800">No stock alerts returned. Inventory is looking healthy.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-[#EEF0F4]">
                                                    {stockAlerts.slice(0, 5).map((item) => {
                                                        const out = Number(item.quantity) === 0
                                                        return (
                                                            <div key={item._id || item.productId} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0">
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${out ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                                        <Package size={16} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-xs font-semibold text-[#343A47]">{item.productName || 'Unnamed product'}</p>
                                                                        <p className="mt-1 text-[10px] text-[#89909C]">{item.category || 'Uncategorised'} · Current {formatNumber(item.quantity)} / Min {formatNumber(item.minimumStockLevel)}</p>
                                                                    </div>
                                                                </div>
                                                                <span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-semibold ${out ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                                                                    {out ? 'Out of stock' : 'Low stock'}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-[0_2px_10px_rgba(20,35,70,0.03)]">
                                            <SectionHeading
                                                title="Recent sales"
                                                subtitle="Latest sales records returned by the API"
                                                action="View all sales"
                                                onAction={viewSales}
                                            />

                                            {recentSales.length === 0 ? (
                                                <EmptyState message="No sales records are available yet." />
                                            ) : (
                                                <div className="divide-y divide-[#EEF0F4]">
                                                    {recentSales.map((sale, index) => {
                                                        const customerName = typeof sale.customer === 'string'
                                                            ? sale.customer
                                                            : sale.customer?.name

                                                        return (
                                                            <div key={sale._id || sale.invoiceId || index} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0">
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                                        <ShoppingCart size={16} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-xs font-semibold text-[#343A47]">{sale.invoiceId || 'Sale record'}</p>
                                                                        <p className="mt-1 truncate text-[10px] text-[#89909C]">{customerName || 'Unknown customer'} · {formatDate(sale.saleDate || sale.createdAt)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="shrink-0 text-right">
                                                                    <p className="text-xs font-bold text-[#343A47]">{formatCurrency(sale.grandTotal)}</p>
                                                                    <p className={`mt-1 text-[9px] font-semibold ${sale.saleStatus === 'Completed' ? 'text-emerald-600' : sale.saleStatus === 'Cancelled' ? 'text-red-600' : 'text-orange-600'}`}>
                                                                        {sale.saleStatus || sale.paymentStatus || '—'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="mt-5 rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-[0_2px_10px_rgba(20,35,70,0.03)]">
                                        <SectionHeading
                                            title="Inventory snapshot"
                                            subtitle="Latest products from your inventory"
                                            action="Open inventory"
                                            onAction={viewInventory}
                                        />

                                        {inventoryProducts.length === 0 ? (
                                            <EmptyState message="No inventory products were returned." />
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-155 text-left">
                                                    <thead>
                                                        <tr className="border-b border-[#EEF0F4] text-[10px] uppercase tracking-wide text-[#89909C]">
                                                            <th className="pb-3 font-semibold">Product</th>
                                                            <th className="pb-3 font-semibold">Category</th>
                                                            <th className="pb-3 font-semibold">Price</th>
                                                            <th className="pb-3 font-semibold">Quantity</th>
                                                            <th className="pb-3 font-semibold">Stock status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#F0F2F5]">
                                                        {inventoryProducts.map((product) => {
                                                            const status = product.stockStatus ||
                                                                (Number(product.quantity) === 0
                                                                    ? 'Out of Stock'
                                                                    : Number(product.quantity) <= Number(product.minimumStockLevel)
                                                                        ? 'Low Stock'
                                                                        : 'In Stock')

                                                            return (
                                                                <tr key={product._id || product.productId}>
                                                                    <td className="py-3 pr-4">
                                                                        <p className="text-xs font-semibold text-[#343A47]">{product.productName || 'Unnamed product'}</p>
                                                                        <p className="mt-0.5 text-[10px] text-[#89909C]">{product.productId || '—'}</p>
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-xs text-[#697386]">{product.category || '—'}</td>
                                                                    <td className="py-3 pr-4 text-xs text-[#343A47]">{formatCurrency(product.price)}</td>
                                                                    <td className="py-3 pr-4 text-xs text-[#343A47]">{formatNumber(product.quantity)}</td>
                                                                    <td className="py-3">
                                                                        <span className={`rounded-md px-2 py-1 text-[9px] font-semibold ${status === 'Out of Stock' ? 'bg-red-50 text-red-700' : status === 'Low Stock' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                                            {status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>

                                    <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/manager/inventory/add')}
                                            className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-4 text-left transition hover:border-[#B9CBE8] hover:shadow-sm"
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Package size={18} /></span>
                                                <span><span className="block text-xs font-semibold text-[#343A47]">Add product</span><span className="mt-1 block text-[10px] text-[#89909C]">Update your inventory</span></span>
                                            </span>
                                            <ArrowUpRight size={16} className="text-[#89909C]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/manager/sales/add')}
                                            className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-4 text-left transition hover:border-[#B9CBE8] hover:shadow-sm"
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><DollarSign size={18} /></span>
                                                <span><span className="block text-xs font-semibold text-[#343A47]">Record sale</span><span className="mt-1 block text-[10px] text-[#89909C]">Create a sales record</span></span>
                                            </span>
                                            <ArrowUpRight size={16} className="text-[#89909C]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/manager/tasks')}
                                            className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-4 text-left transition hover:border-[#B9CBE8] hover:shadow-sm"
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Target size={18} /></span>
                                                <span><span className="block text-xs font-semibold text-[#343A47]">Manage tasks</span><span className="mt-1 block text-[10px] text-[#89909C]">Review team progress</span></span>
                                            </span>
                                            <ArrowUpRight size={16} className="text-[#89909C]" />
                                        </button>
                                    </section>
                                </>
                            )}

                            <footer className="py-7 text-center text-[10px] text-[#A0A6B0]">
                                BizFlow Manager Dashboard · Live data from your business modules
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default ManagerDashboard
