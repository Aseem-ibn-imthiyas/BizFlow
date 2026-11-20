import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    RefreshCw,
    Download,
    ClipboardCheck,
    CheckCircle2,
    Clock3,
    DollarSign,
    Package,
    BarChart3,
    Edit3,
    FileText,
    CircleCheck,
    BellRing,
    AlertTriangle,
    LoaderCircle,
} from 'lucide-react'

import StaffSidebar from '../../components/sidebar/StaffSidebar'
import StaffHeader from '../../components/header/StaffHeader'
import api from '../../services/api'

const unwrapArray = (response, keys = []) => {
    let current = response

    for (let index = 0; index < 4; index += 1) {
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

        return []
    }

    return []
}

const unwrapObject = (response) => {
    let current = response

    for (let index = 0; index < 4; index += 1) {
        if (!current || typeof current !== 'object' || Array.isArray(current)) return {}
        if (current.summary || current.recentTasks || current.upcomingDeadlines || current.today || current.totalProducts !== undefined) {
            return current
        }
        if (current.data !== undefined) {
            current = current.data
            continue
        }
        return current
    }

    return {}
}

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
}).format(Number(value) || 0)

const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', options)
}

const formatRelativeTime = (value) => {
    if (!value) return 'Recently'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Recently'

    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
    return formatDate(value)
}

function StaffDashboard() {
    const navigate = useNavigate()

    const [tasks, setTasks] = useState([])
    const [taskStats, setTaskStats] = useState({})
    const [sales, setSales] = useState([])
    const [salesStats, setSalesStats] = useState({})
    const [inventory, setInventory] = useState([])
    const [inventoryStats, setInventoryStats] = useState({})
    const [stockAlerts, setStockAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')

    const fetchDashboard = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)
            setError('')

            const results = await Promise.allSettled([
                api.get('/tasks?limit=100&sortBy=updatedAt&order=desc'),
                api.get('/tasks/stats'),
                api.get('/sales?limit=5&sortBy=saleDate&order=desc'),
                api.get('/sales/stats'),
                api.get('/inventory?page=1&limit=100&sortBy=updatedAt&sortOrder=desc'),
                api.get('/inventory/stats'),
                api.get('/inventory/alerts'),
            ])

            const [tasksResult, taskStatsResult, salesResult, salesStatsResult, inventoryResult, inventoryStatsResult, alertsResult] = results
            const failures = results.filter((result) => result.status === 'rejected')

            if (tasksResult.status === 'fulfilled') {
                setTasks(unwrapArray(tasksResult.value, ['tasks', 'items', 'results']))
            }
            if (taskStatsResult.status === 'fulfilled') {
                setTaskStats(unwrapObject(taskStatsResult.value))
            }
            if (salesResult.status === 'fulfilled') {
                setSales(unwrapArray(salesResult.value, ['sales', 'transactions', 'items', 'results']))
            }
            if (salesStatsResult.status === 'fulfilled') {
                setSalesStats(unwrapObject(salesStatsResult.value))
            }
            if (inventoryResult.status === 'fulfilled') {
                setInventory(unwrapArray(inventoryResult.value, ['products', 'inventory', 'items', 'results']))
            }
            if (inventoryStatsResult.status === 'fulfilled') {
                setInventoryStats(unwrapObject(inventoryStatsResult.value))
            }
            if (alertsResult.status === 'fulfilled') {
                setStockAlerts(unwrapArray(alertsResult.value, ['alerts', 'items', 'results']))
            }

            if (failures.length === results.length) {
                throw failures[0].reason || new Error('Unable to load dashboard data.')
            }
            if (failures.length) {
                setError('Some dashboard sections could not be loaded. Please refresh to try again.')
                console.error('Some Staff Dashboard requests failed:', failures.map((item) => item.reason))
            }
        } catch (err) {
            console.error('Staff dashboard loading error:', err)
            setError(err.message || 'Unable to load dashboard information.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDashboard()
    }, [fetchDashboard])

    const today = useMemo(() => {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        return date
    }, [])

    const taskSummary = useMemo(() => {
        const source = taskStats.summary || taskStats
        const total = Number(source.totalTasks ?? tasks.length)
        const completed = Number(source.completedTasks ?? tasks.filter((task) => task.status === 'Completed').length)
        const pending = Number(source.pendingTasks ?? tasks.filter((task) => task.status === 'Pending').length)
        const inProgress = Number(source.inProgressTasks ?? tasks.filter((task) => task.status === 'In Progress').length)
        const overdue = Number(source.overdueTasks ?? tasks.filter((task) => {
            if (!task.dueDate || task.status === 'Completed') return false
            const due = new Date(task.dueDate)
            due.setHours(0, 0, 0, 0)
            return due < today
        }).length)
        const completionRate = Number(source.completionRate ?? (total ? Math.round((completed / total) * 100) : 0))

        return { total, completed, pending, inProgress, overdue, completionRate }
    }, [taskStats, tasks, today])

    const todayRevenue = Number(salesStats.today?.revenue ?? salesStats.todayRevenue ?? 0)
    const inventoryUpdateCount = Number(inventoryStats.totalProducts ?? inventoryStats.totalItems ?? inventory.length)
    const lowStockCount = Number(inventoryStats.lowStockProducts ?? inventoryStats.lowStockItems ?? stockAlerts.length)

    const todayTasks = useMemo(() => tasks
        .filter((task) => {
            if (!task.dueDate || task.status === 'Completed') return false
            const due = new Date(task.dueDate)
            return due.toDateString() === new Date().toDateString()
        })
        .slice(0, 5), [tasks])

    const recentSales = useMemo(() => [...sales]
        .sort((a, b) => new Date(b.saleDate || b.createdAt || 0) - new Date(a.saleDate || a.createdAt || 0))
        .slice(0, 3), [sales])

    const recentTaskActivity = useMemo(() => {
        const recent = Array.isArray(taskStats.recentTasks) ? taskStats.recentTasks : []
        if (recent.length) return recent.slice(0, 3)
        return [...tasks]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
            .slice(0, 3)
    }, [taskStats, tasks])

    const upcomingDeadlines = useMemo(() => {
        const source = Array.isArray(taskStats.upcomingDeadlines)
            ? taskStats.upcomingDeadlines
            : tasks.filter((task) => task.dueDate && task.status !== 'Completed')
        return [...source]
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3)
    }, [taskStats, tasks])

    const recentActivities = useMemo(() => [
        ...recentTaskActivity.map((task) => ({
            id: `task-${task._id || task.taskId || task.title}`,
            icon: task.status === 'Completed' ? CircleCheck : ClipboardCheck,
            iconClass: task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600',
            title: task.status === 'Completed' ? 'Task Completed' : 'Task Updated',
            description: task.title || task.taskTitle || 'Assigned task updated',
            time: formatRelativeTime(task.updatedAt || task.createdAt),
            date: new Date(task.updatedAt || task.createdAt || 0).getTime(),
        })),
        ...recentSales.slice(0, 2).map((sale) => ({
            id: `sale-${sale._id}`,
            icon: FileText,
            iconClass: 'bg-indigo-50 text-indigo-600',
            title: sale.saleStatus === 'Draft' ? 'Draft Sale Saved' : 'Sale Recorded',
            description: `${sale.invoiceId || 'Sale'} · ${(typeof sale.customer === 'string' ? sale.customer : sale.customer?.name) || 'Unknown customer'}`,
            time: formatRelativeTime(sale.saleDate || sale.createdAt),
            date: new Date(sale.saleDate || sale.createdAt || 0).getTime(),
        })),
    ].sort((a, b) => b.date - a.date).slice(0, 4), [recentTaskActivity, recentSales])

    const calendar = useMemo(() => {
        const year = new Date().getFullYear()
        const month = new Date().getMonth()
        const firstDay = new Date(year, month, 1)
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const mondayOffset = (firstDay.getDay() + 6) % 7
        const cells = [...Array(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
        while (cells.length % 7 !== 0) cells.push(null)
        const deadlineDays = new Set(upcomingDeadlines
            .filter((task) => {
                const dueDate = new Date(task.dueDate)
                return dueDate.getFullYear() === year && dueDate.getMonth() === month
            })
            .map((task) => new Date(task.dueDate).getDate()))
        return {
            label: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            weeks: Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7)),
            today: new Date().getDate(),
            deadlineDays,
        }
    }, [upcomingDeadlines])

    const stats = [
        { title: 'Assigned Tasks', value: taskSummary.total, note: `${taskSummary.inProgress} in progress`, icon: ClipboardCheck, iconClass: 'bg-blue-50 text-blue-600', noteClass: 'text-blue-600' },
        { title: 'Completed', value: taskSummary.completed, note: `${taskSummary.completionRate}% completion rate`, icon: CheckCircle2, iconClass: 'bg-orange-50 text-orange-600', noteClass: 'text-orange-600' },
        { title: 'Pending Tasks', value: taskSummary.pending, note: `${taskSummary.overdue} overdue`, icon: Clock3, iconClass: 'bg-red-50 text-red-500', noteClass: 'text-red-500' },
        { title: "Today's Sales", value: formatCurrency(todayRevenue), note: 'Recorded today', icon: DollarSign, iconClass: 'bg-blue-50 text-blue-600', noteClass: 'text-blue-600' },
        { title: 'Inventory Items', value: inventoryUpdateCount, note: `${lowStockCount} low-stock alerts`, icon: Package, iconClass: 'bg-indigo-50 text-indigo-600', noteClass: 'text-indigo-600' },
        { title: 'Completion Rate', value: `${taskSummary.completionRate}%`, note: `${taskSummary.completed} completed tasks`, icon: BarChart3, iconClass: 'bg-blue-50 text-blue-600', noteClass: 'text-blue-600', progress: taskSummary.completionRate },
    ]

    const handleExport = () => {
        const rows = [
            ['Section', 'Reference', 'Name', 'Status', 'Value / Date'],
            ...tasks.map((task) => ['Task', task.taskId || task._id, task.title, task.status, task.dueDate || '']),
            ...sales.map((sale) => ['Sale', sale.invoiceId || sale._id, (typeof sale.customer === 'string' ? sale.customer : sale.customer?.name) || '', sale.paymentStatus || sale.saleStatus || '', sale.grandTotal ?? '']),
            ...inventory.map((item) => ['Inventory', item.productId || item._id, item.productName || '', item.stockStatus || '', item.quantity ?? '']),
        ]
        const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
        const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `bizflow-staff-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    const priorityClass = (priority) => {
        if (priority === 'Critical' || priority === 'High') return 'bg-red-50 text-red-500'
        if (priority === 'Medium') return 'bg-orange-50 text-orange-600'
        return 'bg-slate-100 text-slate-600'
    }

    const statusClass = (status) => {
        if (status === 'Completed') return 'bg-emerald-50 text-emerald-600'
        if (status === 'In Progress') return 'bg-blue-50 text-blue-600'
        if (status === 'Review') return 'bg-purple-50 text-purple-600'
        return 'bg-slate-100 text-slate-600'
    }

    if (loading) {
        return (
            <main className="flex h-screen w-full items-center justify-center bg-[#FBFCFE] text-[#171B25]">
                <div className="flex flex-col items-center gap-3">
                    <LoaderCircle size={30} className="animate-spin text-[#0052CC]" />
                    <p className="text-xs font-medium text-[#69707D]">Loading your dashboard...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">
                <aside className="h-screen w-60 shrink-0 overflow-hidden lg:w-64">
                    <StaffSidebar />
                </aside>

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <StaffHeader />

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-5 py-6 lg:px-7 lg:py-7">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-[#343A47]">Home</span>
                                        <span className="text-[#A1A6B0]">›</span>
                                        <span className="font-medium text-[#343A47]">Dashboard</span>
                                    </div>
                                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25]">Staff Dashboard</h1>
                                    <p className="mt-1 text-xs text-[#69707D]">Track your assigned tasks, sales, inventory alerts, and daily work progress.</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => fetchDashboard(true)} disabled={refreshing} className="flex h-9 items-center gap-2 rounded-md border border-[#D8DDE7] bg-white px-3 text-[10px] font-medium text-[#343A47] transition hover:bg-[#F8F9FC] disabled:opacity-60">
                                        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                                    </button>
                                    <button type="button" onClick={handleExport} className="flex h-9 items-center gap-2 rounded-md bg-[#0052CC] px-5 text-[10px] font-medium text-white shadow-sm transition hover:bg-[#0045AD]">
                                        <Download size={13} /> Export
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800">
                                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_218px]">
                                <div className="min-w-0">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {stats.map((stat) => {
                                            const Icon = stat.icon
                                            return (
                                                <div key={stat.title} className="rounded-lg border border-[#E6E8ED] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-[9px] font-medium text-[#59606E]">{stat.title}</p>
                                                            <p className="mt-1 text-xl font-bold text-[#171B25]">{stat.value}</p>
                                                        </div>
                                                        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.iconClass}`}><Icon size={16} /></div>
                                                    </div>
                                                    {stat.progress !== undefined ? (
                                                        <div className="mt-3 h-1 rounded-full bg-[#E7EBF4]"><div className="h-full rounded-full bg-[#0757C9]" style={{ width: `${Math.min(100, Math.max(0, stat.progress))}%` }} /></div>
                                                    ) : (
                                                        <p className={`mt-2 text-[8px] font-semibold ${stat.noteClass}`}>{stat.note}</p>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <section className="mt-5 overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                        <div className="flex items-center justify-between px-4 py-4">
                                            <h2 className="text-sm font-semibold text-[#242936]">Today's Tasks</h2>
                                            <button type="button" onClick={() => navigate('/staff/tasks')} className="text-[9px] font-semibold text-[#0052CC]">View All</button>
                                        </div>
                                        <div className="hidden grid-cols-[80px_minmax(150px,1fr)_100px_120px_110px_70px] bg-[#F4F5FC] px-4 py-3 md:grid">
                                            {['ID', 'Name', 'Priority', 'Status', 'Progress', 'Action'].map((label) => <span key={label} className="text-[8px] font-semibold uppercase text-[#59606E]">{label}</span>)}
                                        </div>
                                        {todayTasks.length ? todayTasks.map((task) => (
                                            <div key={task._id || task.taskId} className="grid grid-cols-1 gap-3 border-t border-[#ECEEF2] px-4 py-4 md:grid-cols-[80px_minmax(150px,1fr)_100px_120px_110px_70px] md:items-center md:gap-0">
                                                <span className="text-[9px] text-[#59606E]">{task.taskId || `#${String(task._id || '').slice(-6)}`}</span>
                                                <span className="text-[9px] font-medium text-[#343A47]">{task.title || 'Untitled task'}</span>
                                                <span className={`w-fit rounded-full px-2 py-1 text-[7px] font-semibold ${priorityClass(task.priority)}`}>{(task.priority || 'Medium').toUpperCase()}</span>
                                                <span className={`w-fit rounded-full px-2 py-1 text-[7px] font-semibold ${statusClass(task.status)}`}>{(task.status || 'Pending').toUpperCase()}</span>
                                                <div className="w-16"><div className="h-1 rounded-full bg-[#E8ECF5]"><div className="h-full rounded-full bg-[#0757C9]" style={{ width: `${Math.min(100, Math.max(0, Number(task.progress) || (task.status === 'Completed' ? 100 : 0)))}%` }} /></div></div>
                                                <button type="button" aria-label={`View ${task.title}`} onClick={() => navigate('/staff/tasks')} className="text-[#0052CC] transition hover:text-[#003F9E]"><Edit3 size={13} /></button>
                                            </div>
                                        )) : <div className="border-t border-[#ECEEF2] px-4 py-8 text-center text-[10px] text-[#8B919D]">No tasks are due today.</div>}
                                    </section>

                                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="px-4 py-4"><h2 className="text-sm font-semibold text-[#242936]">Recent Sales</h2></div>
                                            <div>
                                                {recentSales.length ? recentSales.map((sale) => (
                                                    <div key={sale._id || sale.invoiceId} className="flex items-center justify-between border-t border-[#ECEEF2] px-4 py-4">
                                                        <div className="min-w-0 pr-3">
                                                            <p className="text-[9px] font-semibold text-[#343A47]">{sale.invoiceId || 'Sale record'}</p>
                                                            <p className="mt-0.5 truncate text-[8px] text-[#69707D]">{(typeof sale.customer === 'string' ? sale.customer : sale.customer?.name) || 'Unknown customer'}</p>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <p className="text-[10px] font-bold text-[#0052CC]">{formatCurrency(sale.grandTotal)}</p>
                                                            <p className="mt-0.5 text-[7px] font-semibold text-[#69707D]">{sale.paymentStatus || sale.saleStatus || '—'}</p>
                                                        </div>
                                                    </div>
                                                )) : <div className="border-t border-[#ECEEF2] px-4 py-8 text-center text-[10px] text-[#8B919D]">No sales records found.</div>}
                                            </div>
                                        </section>

                                        <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="px-4 py-4"><h2 className="text-sm font-semibold text-[#242936]">Inventory Alerts</h2></div>
                                            <div>
                                                {stockAlerts.length ? stockAlerts.slice(0, 4).map((alert, index) => (
                                                    <div key={alert._id || alert.productId || index} className="flex items-center gap-3 border-t border-[#ECEEF2] px-4 py-3.5">
                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600"><Package size={13} /></span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-[9px] font-semibold text-[#343A47]">{alert.productName || alert.name || 'Inventory item'}</p>
                                                            <p className="mt-0.5 text-[8px] text-[#69707D]">{alert.message || `Current stock: ${alert.quantity ?? alert.currentStock ?? '—'}`}</p>
                                                        </div>
                                                        <span className="text-[7px] font-semibold text-orange-600">{alert.stockStatus || alert.status || 'ALERT'}</span>
                                                    </div>
                                                )) : <div className="border-t border-[#ECEEF2] px-4 py-8 text-center text-[10px] text-[#8B919D]">No active stock alerts.</div>}
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => navigate('/staff/tasks')} className="flex min-h-15.5 flex-col items-center justify-center gap-1.5 rounded-lg bg-[#0052CC] text-white shadow-sm transition hover:bg-[#0045AD]"><Edit3 size={14} /><span className="text-[7px] font-semibold uppercase">My Tasks</span></button>
                                        <button type="button" onClick={() => navigate('/staff/sales/add')} className="flex min-h-15.5 flex-col items-center justify-center gap-1.5 rounded-lg border border-[#E3E6EC] bg-white text-[#0052CC] transition hover:bg-[#F8F9FC]"><FileText size={14} /><span className="text-[7px] font-semibold uppercase">Record Sale</span></button>
                                        <button type="button" onClick={() => navigate('/staff/inventory')} className="flex min-h-15.5 flex-col items-center justify-center gap-1.5 rounded-lg border border-[#E3E6EC] bg-white text-[#0052CC] transition hover:bg-[#F8F9FC]"><Package size={14} /><span className="text-[7px] font-semibold uppercase">Inventory</span></button>
                                        <button type="button" onClick={() => navigate('/staff/notifications')} className="flex min-h-15.5 flex-col items-center justify-center gap-1.5 rounded-lg border border-[#E3E6EC] bg-white text-[#0052CC] transition hover:bg-[#F8F9FC]"><BellRing size={14} /><span className="text-[7px] font-semibold uppercase">Alerts</span></button>
                                    </div>

                                    <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                        <div className="flex items-center justify-between px-4 py-4"><h2 className="text-sm font-medium text-[#242936]">Work Calendar</h2><span className="text-[8px] font-semibold text-[#59606E]">{calendar.label}</span></div>
                                        <div className="px-3 pb-3">
                                            <div className="grid grid-cols-7 text-center">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`} className="py-1 text-[7px] font-semibold text-[#59606E]">{day}</span>)}
                                                {calendar.weeks.flatMap((week, weekIndex) => week.map((day, dayIndex) => {
                                                    const isToday = day === calendar.today
                                                    const isDeadline = day && calendar.deadlineDays.has(day)
                                                    return <div key={`${weekIndex}-${dayIndex}`} className="flex h-7 items-center justify-center">{day && <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] ${isToday ? 'bg-[#0052CC] font-semibold text-white' : isDeadline ? 'border border-red-400 text-red-500' : 'text-[#59606E]'}`}>{day}</span>}</div>
                                                }))}
                                            </div>
                                            <div className="mt-2 border-t border-[#ECEEF2] pt-3">
                                                {upcomingDeadlines.length ? upcomingDeadlines.map((task) => <div key={task._id || task.taskId} className="mt-2 flex items-start gap-2 first:mt-0"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" /><span className="text-[8px] text-[#59606E]">{task.title || 'Task deadline'} · Due {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}</span></div>) : <p className="text-[8px] text-[#8B919D]">No upcoming task deadlines.</p>}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                        <h2 className="text-sm font-medium text-[#242936]">Recent Activity</h2>
                                        <div className="mt-4">
                                            {recentActivities.length ? recentActivities.map((activity, index) => {
                                                const Icon = activity.icon
                                                return <div key={activity.id} className="relative flex gap-3 pb-4 last:pb-0">
                                                    {index < recentActivities.length - 1 && <span className="absolute left-3.5 top-7 h-full w-px bg-[#E2E6EE]" />}
                                                    <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${activity.iconClass}`}><Icon size={12} /></span>
                                                    <div className="min-w-0"><p className="text-[8px] font-semibold text-[#343A47]">{activity.title}</p><p className="mt-0.5 text-[7px] leading-3 text-[#69707D]">{activity.description}</p><p className="mt-0.5 text-[7px] text-[#9AA0AA]">{activity.time}</p></div>
                                                </div>
                                            }) : <p className="py-4 text-[9px] text-[#8B919D]">No recent activity available.</p>}
                                        </div>
                                    </section>
                                </div>
                            </div>

                            <footer className="mt-6 border-t border-[#E1E4EA] py-5">
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

export default StaffDashboard
