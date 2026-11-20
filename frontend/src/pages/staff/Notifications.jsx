import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Bell,
    Mail,
    ClipboardList,
    Megaphone,
    Search,
    RefreshCw,
    CheckCheck,
    Trash2,
    ChevronDown,
    SlidersHorizontal,
    MessageSquare,
    Package,
    ShoppingCart,
    Clock3,
    AlertTriangle,
} from 'lucide-react'

import StaffSidebar from '../../components/sidebar/StaffSidebar'
import StaffHeader from '../../components/header/StaffHeader'
import api from '../../services/api'

const Toggle = ({ enabled, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label="Toggle preference"
        aria-pressed={enabled}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${enabled ? 'bg-[#0757C9]' : 'bg-[#D9DDE7]'}`}
    >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? 'left-4.5' : 'left-0.5'}`} />
    </button>
)

const unwrapData = (response) => response?.data?.data ?? response?.data ?? response ?? {}

const formatRelativeTime = (dateValue) => {
    if (!dateValue) return 'Recently'
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return 'Recently'

    const diff = Math.max(0, Date.now() - date.getTime())
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
}

const getNotificationIcon = (type) => {
    switch (type) {
        case 'Task': return ClipboardList
        case 'Inventory': return Package
        case 'Sales': return ShoppingCart
        case 'Report': return MessageSquare
        case 'System': return Megaphone
        default: return Bell
    }
}

const getNotificationIconStyle = (type) => {
    switch (type) {
        case 'Task': return 'bg-blue-50 text-blue-600'
        case 'Inventory': return 'bg-red-50 text-red-500'
        case 'Sales': return 'bg-orange-50 text-orange-600'
        case 'Report': return 'bg-indigo-50 text-indigo-600'
        case 'System': return 'bg-orange-50 text-orange-600'
        default: return 'bg-slate-50 text-slate-600'
    }
}

const getPriorityStyle = (priority) => {
    switch (priority) {
        case 'High': return 'bg-red-50 text-red-500'
        case 'Medium': return 'bg-slate-100 text-slate-600'
        case 'Low': return 'bg-slate-100 text-slate-500'
        default: return 'bg-slate-100 text-slate-500'
    }
}

function Notifications() {
    const [notifications, setNotifications] = useState([])
    const [stats, setStats] = useState({
        totalNotifications: 0,
        unreadNotifications: 0,
        highPriorityNotifications: 0,
        archivedNotifications: 0,
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')
    const [sortBy, setSortBy] = useState('newest')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState('')

    // Preferences are currently session-only: the supplied backend has no
    // notification-preferences endpoint or persistence model.
    const [preferences, setPreferences] = useState({
        taskAssignments: true,
        deadlineReminders: true,
        inventoryAlerts: true,
        directMessages: false,
    })

    const fetchNotifications = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)
            setError('')

            const [notificationsResponse, statsResponse] = await Promise.all([
                api.get('/notifications?archived=false'),
                api.get('/notifications/stats'),
            ])

            const notificationPayload = unwrapData(notificationsResponse)
            const statsPayload = unwrapData(statsResponse)
            const notificationList = Array.isArray(notificationPayload)
                ? notificationPayload
                : notificationPayload.data || notificationPayload.notifications || []

            setNotifications(notificationList)
            setStats((previous) => ({ ...previous, ...statsPayload }))
        } catch (err) {
            console.error('Notification loading error:', err)
            setError(err.message || 'Unable to load notifications.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications()
    }, [fetchNotifications])

    const filteredNotifications = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase()

        return notifications
            .filter((notification) => {
                const matchesSearch = !normalizedSearch ||
                    notification.title?.toLowerCase().includes(normalizedSearch) ||
                    notification.description?.toLowerCase().includes(normalizedSearch)
                const matchesType = typeFilter === 'All' || notification.type === typeFilter
                const matchesStatus = statusFilter === 'All' ||
                    (statusFilter === 'Unread' && !notification.isRead) ||
                    (statusFilter === 'Read' && notification.isRead)

                return matchesSearch && matchesType && matchesStatus
            })
            .sort((a, b) => {
                const first = new Date(a.createdAt || 0).getTime()
                const second = new Date(b.createdAt || 0).getTime()
                return sortBy === 'oldest' ? first - second : second - first
            })
    }, [notifications, searchTerm, typeFilter, statusFilter, sortBy])

    const taskCount = notifications.filter((item) => item.type === 'Task').length
    const systemCount = notifications.filter((item) => item.type === 'System').length

    const notificationStats = [
        { title: 'Total', value: stats.totalNotifications, icon: Bell, iconClass: 'bg-blue-50 text-blue-600' },
        { title: 'Unread', value: stats.unreadNotifications, icon: Mail, iconClass: 'bg-red-50 text-red-500' },
        { title: 'Tasks', value: taskCount, icon: ClipboardList, iconClass: 'bg-indigo-50 text-indigo-600' },
        { title: 'System', value: systemCount, icon: Megaphone, iconClass: 'bg-orange-50 text-orange-600' },
    ]

    const recentActivity = notifications.slice(0, 3).map((item) => ({
        icon: item.isRead ? CheckCheck : Clock3,
        iconClass: item.isRead ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600',
        title: item.isRead ? 'Notification Read' : 'New Notification',
        description: item.title,
        time: formatRelativeTime(item.updatedAt || item.createdAt),
    }))

    const markAsRead = async (id) => {
        setActionLoading(id)
        setError('')
        try {
            await api.patch(`/notifications/${id}/read`)
            setNotifications((current) => current.map((item) =>
                item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
            ))
            await fetchNotifications(true)
        } catch (err) {
            setError(err.message || 'Unable to mark notification as read.')
        } finally {
            setActionLoading('')
        }
    }

    const archiveNotification = async (id) => {
        setActionLoading(id)
        setError('')
        try {
            await api.patch(`/notifications/${id}/archive`)
            setNotifications((current) => current.filter((item) => item._id !== id))
            await fetchNotifications(true)
        } catch (err) {
            setError(err.message || 'Unable to archive notification.')
        } finally {
            setActionLoading('')
        }
    }

    const markAllAsRead = async () => {
        setActionLoading('all-read')
        setError('')
        try {
            await api.patch('/notifications/read-all')
            await fetchNotifications(true)
        } catch (err) {
            setError(err.message || 'Unable to mark all notifications as read.')
        } finally {
            setActionLoading('')
        }
    }

    const clearReadNotifications = async () => {
        const readIds = notifications.filter((item) => item.isRead).map((item) => item._id)
        if (!readIds.length) return

        setActionLoading('clear-read')
        setError('')
        try {
            await api.patch('/notifications/archive-selected', { ids: readIds })
            await fetchNotifications(true)
        } catch (err) {
            setError(err.message || 'Unable to clear read notifications.')
        } finally {
            setActionLoading('')
        }
    }

    const togglePreference = (key) => {
        setPreferences((current) => ({ ...current, [key]: !current[key] }))
    }

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">
                <aside className="h-screen w-60 shrink-0 overflow-hidden lg:w-64">
                    <StaffSidebar />
                </aside>

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <div className="shrink-0"><StaffHeader /></div>

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-5 py-6 sm:px-6 lg:px-8">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-[#343A47]">Home</span>
                                        <span className="text-[#A1A6B0]">›</span>
                                        <span className="font-medium text-[#0757C9]">Notifications</span>
                                    </div>
                                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#171B25]">Notifications</h1>
                                    <p className="mt-1 text-xs text-[#69707D]">
                                        Stay updated with task assignments, inventory alerts, sales updates, and company announcements.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={markAllAsRead} disabled={!!actionLoading || !stats.unreadNotifications}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-[#0052CC] px-3 text-[10px] font-medium text-white shadow-sm transition hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-50">
                                        <CheckCheck size={13} /> Mark All as Read
                                    </button>
                                    <button type="button" onClick={clearReadNotifications} disabled={!!actionLoading || !notifications.some((item) => item.isRead)}
                                        className="flex h-8 items-center gap-1.5 rounded-md border border-[#DDE1E8] bg-white px-3 text-[10px] font-medium text-[#424854] transition hover:bg-[#F8F9FC] disabled:cursor-not-allowed disabled:opacity-50">
                                        <Trash2 size={13} /> Clear Read Notifications
                                    </button>
                                    <button type="button" onClick={() => fetchNotifications(true)} disabled={refreshing}
                                        className="flex h-8 items-center gap-1.5 rounded-md border border-[#DDE1E8] bg-white px-3 text-[10px] font-medium text-[#424854] transition hover:bg-[#F8F9FC] disabled:opacity-50">
                                        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh Notifications
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
                            )}

                            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                {notificationStats.map((stat) => {
                                    const Icon = stat.icon
                                    return (
                                        <div key={stat.title} className="rounded-lg border border-[#E1E4EA] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${stat.iconClass}`}><Icon size={16} strokeWidth={1.8} /></div>
                                                <div>
                                                    <p className="text-[9px] font-medium text-[#59606E]">{stat.title}</p>
                                                    <p className="mt-0.5 text-xl font-bold leading-none text-[#171B25]">{stat.value}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                                <div className="min-w-0">
                                    <section className="rounded-lg border border-[#E1E4EA] bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_150px_150px_110px]">
                                            <div className="relative">
                                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B919D]" />
                                                <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search Notifications"
                                                    className="h-9 w-full rounded-md border border-[#DDE1E8] bg-white pl-9 pr-3 text-[10px] text-[#343A47] outline-none transition placeholder:text-[#8B919D] focus:border-[#AFC4ED]" />
                                            </div>
                                            <div className="relative">
                                                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-9 w-full appearance-none rounded-md border border-[#DDE1E8] bg-white px-3 pr-8 text-[10px] text-[#59606E] outline-none">
                                                    <option value="All">All Types</option>
                                                    <option value="Task">Tasks</option>
                                                    <option value="Inventory">Inventory</option>
                                                    <option value="Sales">Sales</option>
                                                    <option value="Report">Reports</option>
                                                    <option value="System">System</option>
                                                </select>
                                                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A808C]" />
                                            </div>
                                            <div className="relative">
                                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 w-full appearance-none rounded-md border border-[#DDE1E8] bg-white px-3 pr-8 text-[10px] text-[#59606E] outline-none">
                                                    <option value="All">All Status</option>
                                                    <option value="Unread">Unread</option>
                                                    <option value="Read">Read</option>
                                                </select>
                                                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A808C]" />
                                            </div>
                                            <div className="relative">
                                                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 w-full appearance-none rounded-md border border-[#DDE1E8] bg-white px-3 pr-8 text-[10px] text-[#59606E] outline-none">
                                                    <option value="newest">Newest</option>
                                                    <option value="oldest">Oldest</option>
                                                </select>
                                                <SlidersHorizontal size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A808C]" />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mt-3 space-y-2">
                                        {loading ? (
                                            <div className="rounded-lg border border-[#E1E4EA] bg-white p-8 text-center text-xs text-[#69707D]">Loading notifications...</div>
                                        ) : filteredNotifications.length === 0 ? (
                                            <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[#DDE1E8] bg-white text-center">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F4FA] text-[#7A808C]"><Bell size={18} /></div>
                                                <p className="mt-3 text-sm font-semibold text-[#343A47]">No notifications found</p>
                                                <p className="mt-1 text-[10px] text-[#858B97]">Try changing your search or filter options.</p>
                                            </div>
                                        ) : filteredNotifications.map((notification) => {
                                            const Icon = getNotificationIcon(notification.type)
                                            const id = notification._id
                                            return (
                                                <article key={id} className={`relative rounded-lg border bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition hover:border-[#C9D6ED] ${notification.isRead ? 'border-[#E1E4EA]' : 'border-[#D6E2F8]'}`}>
                                                    {!notification.isRead && <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-lg bg-[#0757C9]" />}
                                                    <div className="flex gap-3">
                                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getNotificationIconStyle(notification.type)}`}><Icon size={15} /></div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="text-xs font-semibold text-[#343A47]">{notification.title}</h3>
                                                                    <span className={`rounded px-1.5 py-0.5 text-[7px] font-bold ${getPriorityStyle(notification.priority)}`}>{notification.priority?.toUpperCase() || 'MEDIUM'}</span>
                                                                </div>
                                                                <span className="shrink-0 text-[8px] text-[#858B97]">{formatRelativeTime(notification.createdAt)}</span>
                                                            </div>
                                                            <p className="mt-1.5 max-w-3xl text-[10px] leading-4 text-[#69707D]">{notification.description}</p>
                                                            <div className="mt-3 flex flex-wrap items-center gap-4">
                                                                {notification.relatedEntity && <span className="text-[8px] text-[#858B97]">Related: {notification.relatedEntity}</span>}
                                                                {!notification.isRead && (
                                                                    <button type="button" disabled={!!actionLoading} onClick={() => markAsRead(id)} className="text-[8px] font-medium text-[#59606E] hover:text-[#0757C9] disabled:opacity-50">Mark as Read</button>
                                                                )}
                                                                <button type="button" disabled={!!actionLoading} onClick={() => archiveNotification(id)} className="text-[8px] font-medium text-[#59606E] hover:text-red-500 disabled:opacity-50">Archive</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            )
                                        })}
                                    </section>
                                </div>

                                <div className="space-y-4">
                                    <section className="rounded-lg border border-[#E1E4EA] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                        <h3 className="text-sm font-semibold text-[#242936]">Preferences</h3>
                                        <p className="mt-1 text-[8px] text-[#858B97]">Temporary controls — preference saving is not available in the current backend.</p>
                                        <div className="mt-4 space-y-4">
                                            <div className="flex items-center justify-between gap-3"><span className="text-[9px] text-[#59606E]">Task Assignments</span><Toggle enabled={preferences.taskAssignments} onClick={() => togglePreference('taskAssignments')} /></div>
                                            <div className="flex items-center justify-between gap-3"><span className="text-[9px] text-[#59606E]">Deadline Reminders</span><Toggle enabled={preferences.deadlineReminders} onClick={() => togglePreference('deadlineReminders')} /></div>
                                            <div className="flex items-center justify-between gap-3"><span className="text-[9px] text-[#59606E]">Inventory Alerts</span><Toggle enabled={preferences.inventoryAlerts} onClick={() => togglePreference('inventoryAlerts')} /></div>
                                            <div className="flex items-center justify-between gap-3"><span className="text-[9px] text-[#59606E]">Direct Messages</span><Toggle enabled={preferences.directMessages} onClick={() => togglePreference('directMessages')} /></div>
                                        </div>
                                    </section>

                                    <section className="rounded-lg border border-[#E1E4EA] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                                        <h3 className="text-sm font-semibold text-[#242936]">Recent Activity</h3>
                                        {recentActivity.length ? (
                                            <div className="relative mt-5">
                                                <div className="absolute left-1.75 top-2 h-[calc(100%-20px)] w-px bg-[#DDE3EE]" />
                                                <div className="space-y-5">
                                                    {recentActivity.map((activity, index) => {
                                                        const Icon = activity.icon
                                                        return (
                                                            <div key={`${activity.title}-${index}`} className="relative flex gap-3">
                                                                <div className={`relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${activity.iconClass}`}><Icon size={9} /></div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[9px] font-semibold text-[#343A47]">{activity.title}</p>
                                                                    <p className="mt-0.5 text-[8px] text-[#69707D]">{activity.description}</p>
                                                                    <p className="mt-0.5 text-[7px] text-[#9AA0AA]">{activity.time}</p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ) : <p className="mt-3 text-[9px] text-[#858B97]">No recent activity available.</p>}
                                    </section>

                                    <section className="rounded-lg border border-[#DCE7F8] bg-[#F7FAFF] p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0757C9] shadow-sm"><AlertTriangle size={14} /></div>
                                            <div>
                                                <p className="text-[10px] font-semibold text-[#0757C9]">Notification Summary</p>
                                                <p className="mt-1 text-[8px] leading-4 text-[#59606E]">You have <span className="font-semibold text-[#171B25]">{stats.unreadNotifications}</span> unread notifications requiring your attention.</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
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

export default Notifications
