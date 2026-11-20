import { useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'
import {
    BarChart3,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    Download,
    Eye,
    //FileDown,
    MoreVertical,
    Plus,
    Printer,
    Receipt,
    RefreshCw,
    Search,
    TrendingUp,
    XCircle,
} from 'lucide-react'

import StaffSidebar from '../../components/sidebar/StaffSidebar'
import StaffHeader from '../../components/header/StaffHeader'

function StaffSalesManagement() {
    const navigate = useNavigate()
    const location = useLocation()

    const [sales, setSales] = useState([])
    const [statistics, setStatistics] = useState(null)
    const [pendingPayments, setPendingPayments] = useState(0)
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [paymentStatus, setPaymentStatus] = useState('')
    const [dateRange, setDateRange] = useState('week')
    const [page, setPage] = useState(1)

    const formatCurrency = (value) => {
        const amount = Number(value || 0)
        return `$${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
    }

    const formatDate = (value) => {
        if (!value) return '—'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const fetchSalesData = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const params = new URLSearchParams()
            if (search.trim()) params.set('search', search.trim())
            if (paymentStatus) params.set('paymentStatus', paymentStatus)

            const today = new Date()
            const startDate = new Date(today)
            if (dateRange === 'week') {
                startDate.setDate(today.getDate() - 6)
            } else if (dateRange === 'month') {
                startDate.setDate(1)
            }

            if (dateRange) {
                const toLocalDate = (date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    return `${year}-${month}-${day}`
                }
                params.set('startDate', toLocalDate(startDate))
                params.set('endDate', toLocalDate(today))
            }

            params.set('sortBy', 'createdAt')
            params.set('sortOrder', 'desc')
            params.set('page', String(page))
            params.set('limit', '10')

            const [salesResponse, statsResponse, pendingResponse] = await Promise.all([
                api.get(`/sales?${params.toString()}`),
                api.get('/sales/stats'),
                api.get('/sales?paymentStatus=Pending&page=1&limit=1'),
            ])

            // The shared API helper may return either the response body or an Axios response.
            const salesBody = salesResponse?.data ?? salesResponse
            const statsBody = statsResponse?.data ?? statsResponse
            const pendingBody = pendingResponse?.data ?? pendingResponse

            const salesList = Array.isArray(salesBody?.data)
                ? salesBody.data
                : Array.isArray(salesBody)
                    ? salesBody
                    : []

            const statsData = statsBody?.data ?? statsBody
            const pendingCount =
                pendingBody?.pagination?.totalItems ??
                pendingBody?.data?.pagination?.totalItems ??
                (Array.isArray(pendingBody?.data) ? pendingBody.data.length :
                    Array.isArray(pendingBody) ? pendingBody.length : 0)

            setSales(salesList)
            setStatistics(statsData || null)
            setPendingPayments(Number(pendingCount) || 0)
            setPagination(salesBody?.pagination ?? {
                currentPage: page,
                pageSize: 10,
                totalItems: salesList.length,
                totalPages: salesList.length ? 1 : 0,
            })
        } catch (err) {
            console.error('Failed to load staff sales:', err)
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to load sales information.'
            )
            setSales([])
        } finally {
            setLoading(false)
        }
    }, [search, paymentStatus, dateRange, page])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSalesData()
    }, [fetchSalesData, location.key])

    const transactions = sales.map((sale) => {
        const customerName = sale.customer?.name || 'Unknown Customer'
        const initials = customerName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join('')

        const payment = sale.paymentStatus || 'Pending'
        const normalizedPayment = payment.toLowerCase()
        const statusClass = normalizedPayment === 'paid'
            ? 'bg-emerald-50 text-emerald-600'
            : normalizedPayment === 'cancelled'
                ? 'bg-red-50 text-red-600'
                : 'bg-amber-50 text-amber-600'

        return {
            id: sale._id,
            invoice: sale.invoiceId || '—',
            initials: initials || 'C',
            customer: customerName,
            date: formatDate(sale.saleDate || sale.createdAt),
            items: `${sale.items?.length || 0} ${sale.items?.length === 1 ? 'Item' : 'Items'}`,
            amount: formatCurrency(sale.grandTotal),
            status: payment,
            statusClass,
            avatarClass: 'bg-blue-50 text-blue-600',
            saleStatus: sale.saleStatus,
        }
    })

    const activities = sales.slice(0, 4).map((sale) => ({
        icon: sale.saleStatus === 'Cancelled' ? XCircle : CheckCircle2,
        iconClass: sale.saleStatus === 'Cancelled'
            ? 'bg-red-50 text-red-600'
            : 'bg-emerald-50 text-emerald-600',
        title: sale.saleStatus === 'Cancelled' ? 'Sale Cancelled' : 'Sale Recorded',
        description: `${sale.invoiceId || 'Sale'} · ${sale.customer?.name || 'Customer'} · ${formatCurrency(sale.grandTotal)}`,
        time: sale.createdAt ? new Date(sale.createdAt).toLocaleString() : formatDate(sale.saleDate),
    }))

    const todayStats = statistics?.today || {}
    const monthStats = statistics?.month || {}
    const totalItems = Number(pagination.totalItems || 0)
    const pageSize = Number(pagination.pageSize || 10)
    const totalPages = Number(pagination.totalPages || 0)
    const currentPage = Number(pagination.currentPage || page)
    const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const lastItem = Math.min(currentPage * pageSize, totalItems)

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">

            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    FIXED SIDEBAR
                ====================================================== */}

                <aside className="h-screen w-60 shrink-0 overflow-hidden lg:w-64">
                    <StaffSidebar />
                </aside>

                {/* =====================================================
                    MAIN APPLICATION AREA
                ====================================================== */}

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <div className="shrink-0">
                        <StaffHeader />
                    </div>

                    {/* =================================================
                        SCROLLABLE MAIN CONTENT
                    ================================================== */}

                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                        "
                    >

                        <div className="px-5 py-6 sm:px-6 lg:px-8">

                            {/* =================================================
                                PAGE HEADER
                            ================================================== */}

                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                                <div>

                                    <div className="flex items-center gap-2 text-[10px]">

                                        <span className="text-[#59606E]">
                                            Home
                                        </span>

                                        <span className="text-[#A4A9B3]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#171B25]">
                                            Sales
                                        </span>

                                    </div>

                                    <h1
                                        className="
                                            mt-2
                                            text-2xl
                                            font-bold
                                            tracking-tight
                                            text-[#171B25]
                                            sm:text-[25px]
                                        "
                                    >
                                        Sales Management
                                    </h1>

                                    <p className="mt-1 text-xs text-[#69707D]">
                                        Record sales transactions and manage your sales records.
                                    </p>

                                </div>

                                <div className="flex flex-wrap items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={fetchSalesData}
                                        disabled={loading}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#D9DEE8]
                                            bg-white
                                            px-3
                                            text-[10px]
                                            font-medium
                                            text-[#343A47]
                                            transition
                                            hover:bg-[#F7F8FB]
                                        "
                                    >
                                        <RefreshCw size={13} />
                                        Refresh
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#D9DEE8]
                                            bg-white
                                            px-3
                                            text-[10px]
                                            font-medium
                                            text-[#343A47]
                                            transition
                                            hover:bg-[#F7F8FB]
                                        "
                                    >
                                        <Printer size={13} />
                                        Print Receipt
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/staff/sales/add')}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0052CC]
                                            px-4
                                            text-[10px]
                                            font-semibold
                                            text-white
                                            shadow-sm
                                            transition
                                            hover:bg-[#0045AD]
                                        "
                                    >
                                        <Plus size={13} />
                                        Record New Sale
                                    </button>

                                </div>

                            </div>

                            {/* =================================================
                                SALES STATISTICS
                            ================================================== */}

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                                {/* Today's Sales */}

                                <div
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E3E6ED]
                                        bg-white
                                        p-4
                                        shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                    "
                                >

                                    <div className="flex items-start justify-between">

                                        <div
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-blue-50
                                                text-blue-600
                                            "
                                        >
                                            <CircleDollarSign
                                                size={16}
                                                strokeWidth={1.8}
                                            />
                                        </div>

                                        <span
                                            className="
                                                rounded
                                                bg-emerald-50
                                                px-1.5
                                                py-1
                                                text-[8px]
                                                font-semibold
                                                text-emerald-600
                                            "
                                        >
                                            Live
                                        </span>

                                    </div>

                                    <p className="mt-3 text-[9px] font-medium uppercase tracking-wide text-[#69707D]">
                                        Today's Sales
                                    </p>

                                    <p className="mt-1 text-lg font-bold text-[#171B25]">
                                        {formatCurrency(todayStats.revenue)}
                                    </p>

                                </div>

                                {/* Transactions */}

                                <div
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E3E6ED]
                                        bg-white
                                        p-4
                                        shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                    "
                                >

                                    <div className="flex items-start justify-between">

                                        <div
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-indigo-50
                                                text-indigo-600
                                            "
                                        >
                                            <Receipt
                                                size={16}
                                                strokeWidth={1.8}
                                            />
                                        </div>

                                        <span
                                            className="
                                                rounded
                                                bg-emerald-50
                                                px-1.5
                                                py-1
                                                text-[8px]
                                                font-semibold
                                                text-emerald-600
                                            "
                                        >
                                            Today
                                        </span>

                                    </div>

                                    <p className="mt-3 text-[9px] font-medium uppercase tracking-wide text-[#69707D]">
                                        Transactions Today
                                    </p>

                                    <p className="mt-1 text-lg font-bold text-[#171B25]">
                                        {todayStats.orders ?? 0}
                                    </p>

                                </div>

                                {/* Monthly Sales */}

                                <div
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E3E6ED]
                                        bg-white
                                        p-4
                                        shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                    "
                                >

                                    <div className="flex items-start justify-between">

                                        <div
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-orange-50
                                                text-orange-600
                                            "
                                        >
                                            <TrendingUp
                                                size={16}
                                                strokeWidth={1.8}
                                            />
                                        </div>

                                        <span
                                            className="
                                                rounded
                                                bg-blue-50
                                                px-1.5
                                                py-1
                                                text-[8px]
                                                font-semibold
                                                text-blue-600
                                            "
                                        >
                                            This month
                                        </span>

                                    </div>

                                    <p className="mt-3 text-[9px] font-medium uppercase tracking-wide text-[#69707D]">
                                        Monthly Sales
                                    </p>

                                    <p className="mt-1 text-lg font-bold text-[#171B25]">
                                        {formatCurrency(monthStats.revenue)}
                                    </p>

                                </div>

                                {/* Pending Payments */}

                                <div
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E3E6ED]
                                        bg-white
                                        p-4
                                        shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                    "
                                >

                                    <div className="flex items-start justify-between">

                                        <div
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-red-50
                                                text-red-600
                                            "
                                        >
                                            <CreditCard
                                                size={16}
                                                strokeWidth={1.8}
                                            />
                                        </div>

                                        <span
                                            className="
                                                rounded
                                                bg-red-50
                                                px-1.5
                                                py-1
                                                text-[8px]
                                                font-semibold
                                                text-red-600
                                            "
                                        >
                                            Outstanding
                                        </span>

                                    </div>

                                    <p className="mt-3 text-[9px] font-medium uppercase tracking-wide text-[#69707D]">
                                        Pending Payments
                                    </p>

                                    <p className="mt-1 text-lg font-bold text-[#171B25]">
                                        {pendingPayments}
                                    </p>

                                </div>

                            </div>

                            {/* =================================================
                                SALES AREA
                            ================================================== */}

                            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_160px]">

                                {/* =================================================
                                    LEFT SALES CONTENT
                                ================================================== */}

                                <div className="min-w-0">

                                    {/* Search / Filters */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6ED]
                                            bg-white
                                            p-2
                                        "
                                    >

                                        <div className="flex flex-col gap-2 md:flex-row">

                                            <div className="relative min-w-0 flex-1">

                                                <Search
                                                    size={14}
                                                    className="
                                                        pointer-events-none
                                                        absolute
                                                        left-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#89909D]
                                                    "
                                                />

                                                <input
                                                    type="text"
                                                    value={search}
                                                    onChange={(event) => {
                                                        setSearch(event.target.value)
                                                        setPage(1)
                                                    }}
                                                    placeholder="Search by customer or invoice #"
                                                    className="
                                                        h-9
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-transparent
                                                        bg-[#F1F3FA]
                                                        pl-9
                                                        pr-3
                                                        text-[10px]
                                                        text-[#343A47]
                                                        outline-none
                                                        placeholder:text-[#89909D]
                                                        focus:border-[#C8D5F2]
                                                        focus:bg-white
                                                    "
                                                />

                                            </div>

                                            <select
                                                value={paymentStatus}
                                                onChange={(event) => {
                                                    setPaymentStatus(event.target.value)
                                                    setPage(1)
                                                }}
                                                className="
                                                    h-9
                                                    rounded-md
                                                    border
                                                    border-transparent
                                                    bg-[#F1F3FA]
                                                    px-3
                                                    text-[10px]
                                                    text-[#59606E]
                                                    outline-none
                                                    md:w-28
                                                "
                                            >
                                                <option value="">All Payments</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Pending">Pending</option>
                                            </select>

                                            <select
                                                value={dateRange}
                                                onChange={(event) => {
                                                    setDateRange(event.target.value)
                                                    setPage(1)
                                                }}
                                                className="
                                                    h-9
                                                    rounded-md
                                                    border
                                                    border-transparent
                                                    bg-[#F1F3FA]
                                                    px-3
                                                    text-[10px]
                                                    text-[#59606E]
                                                    outline-none
                                                    md:w-28
                                                "
                                            >
                                                <option value="today">
                                                    Today
                                                </option>
                                                <option value="week">
                                                    This Week
                                                </option>
                                                <option value="month">
                                                    This Month
                                                </option>
                                            </select>



                                        </div>

                                    </section>

                                    {/* =================================================
                                        SALES TABLE
                                    ================================================== */}

                                    <section
                                        className="
                                            mt-3
                                            overflow-hidden
                                            rounded-lg
                                            border
                                            border-[#E3E6ED]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                        "
                                    >

                                        {/* Desktop table */}

                                        <div className="hidden overflow-x-auto md:block">

                                            <table className="w-full min-w-175 border-collapse">

                                                <thead>

                                                    <tr className="bg-[#F3F3FC]">

                                                        <th className="px-4 py-3 text-left text-[8px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                            Invoice ID
                                                        </th>

                                                        <th className="px-3 py-3 text-left text-[8px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                            Customer
                                                        </th>

                                                        <th className="px-3 py-3 text-left text-[8px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                            Date
                                                        </th>

                                                        <th className="px-3 py-3 text-left text-[8px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                            Items
                                                        </th>

                                                        <th className="px-3 py-3 text-left text-[8px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                            Total Amount
                                                        </th>

                                                        <th className="px-3 py-3 text-left text-[8px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                            Status
                                                        </th>

                                                        <th className="px-3 py-3 text-center text-[8px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                            Actions
                                                        </th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {loading && (
                                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#69707D]">Loading sales records...</td></tr>
                                                    )}
                                                    {!loading && error && (
                                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-red-600">{error}</td></tr>
                                                    )}
                                                    {!loading && !error && transactions.length === 0 && (
                                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#69707D]">No sales records found.</td></tr>
                                                    )}

                                                    {transactions.map((sale, index) => (

                                                        <tr
                                                            key={sale.id || `${sale.invoice}-${index}`}
                                                            className="
                                                                border-t
                                                                border-[#ECEEF3]
                                                                transition
                                                                hover:bg-[#FBFCFF]
                                                            "
                                                        >

                                                            <td className="px-4 py-4">

                                                                <button
                                                                    type="button"
                                                                    className="text-[9px] font-semibold text-[#0757C9] hover:underline"
                                                                >
                                                                    {sale.invoice}
                                                                </button>

                                                            </td>

                                                            <td className="px-3 py-4">

                                                                <div className="flex items-center gap-2">

                                                                    <span
                                                                        className={`
                                                                            flex
                                                                            h-6
                                                                            w-6
                                                                            shrink-0
                                                                            items-center
                                                                            justify-center
                                                                            rounded-full
                                                                            text-[7px]
                                                                            font-semibold
                                                                            ${sale.avatarClass}
                                                                        `}
                                                                    >
                                                                        {sale.initials}
                                                                    </span>

                                                                    <span className="text-[9px] font-medium text-[#343A47]">
                                                                        {sale.customer}
                                                                    </span>

                                                                </div>

                                                            </td>

                                                            <td className="px-3 py-4">

                                                                <span className="whitespace-pre-line text-[8px] leading-3 text-[#59606E]">
                                                                    {sale.date.replace(', ', ',\n')}
                                                                </span>

                                                            </td>

                                                            <td className="px-3 py-4">

                                                                <span className="text-[8px] text-[#343A47]">
                                                                    {sale.items}
                                                                </span>

                                                            </td>

                                                            <td className="px-3 py-4">

                                                                <span className="text-[9px] font-bold text-[#171B25]">
                                                                    {sale.amount}
                                                                </span>

                                                            </td>

                                                            <td className="px-3 py-4">

                                                                <span
                                                                    className={`
                                                                        inline-flex
                                                                        rounded-full
                                                                        px-2
                                                                        py-1
                                                                        text-[7px]
                                                                        font-semibold
                                                                        ${sale.statusClass}
                                                                    `}
                                                                >
                                                                    <span className="mr-1">
                                                                        •
                                                                    </span>
                                                                    {sale.status}
                                                                </span>

                                                            </td>

                                                            <td className="px-3 py-4">

                                                                <div className="flex items-center justify-center gap-3">

                                                                    <button
                                                                        type="button"
                                                                        aria-label="View sale"
                                                                        title="View sale"
                                                                        onClick={() => navigate(`/staff/sales/${sale.id}`)}
                                                                        className="text-[#59606E] transition hover:text-[#0757C9]"
                                                                    >
                                                                        <Eye size={13} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        aria-label="Print invoice"
                                                                        title="Print invoice"
                                                                        onClick={() => window.print()}
                                                                        className="text-[#59606E] transition hover:text-[#0757C9]"
                                                                    >
                                                                        <Printer size={13} />
                                                                    </button>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    ))}

                                                </tbody>

                                            </table>

                                        </div>

                                        {/* Mobile cards */}

                                        <div className="md:hidden">

                                            {loading && (
                                                <p className="p-5 text-center text-xs text-[#69707D]">Loading sales records...</p>
                                            )}
                                            {!loading && error && (
                                                <p className="p-5 text-center text-xs text-red-600">{error}</p>
                                            )}
                                            {!loading && !error && transactions.length === 0 && (
                                                <p className="p-5 text-center text-xs text-[#69707D]">No sales records found.</p>
                                            )}

                                            {transactions.map((sale, index) => (

                                                <div
                                                    key={sale.id || `${sale.invoice}-mobile-${index}`}
                                                    className="
                                                        border-t
                                                        border-[#ECEEF3]
                                                        p-4
                                                        first:border-t-0
                                                    "
                                                >

                                                    <div className="flex items-start justify-between">

                                                        <div className="flex items-center gap-2">

                                                            <span
                                                                className={`
                                                                    flex
                                                                    h-7
                                                                    w-7
                                                                    items-center
                                                                    justify-center
                                                                    rounded-full
                                                                    text-[8px]
                                                                    font-semibold
                                                                    ${sale.avatarClass}
                                                                `}
                                                            >
                                                                {sale.initials}
                                                            </span>

                                                            <div>

                                                                <p className="text-[10px] font-semibold text-[#343A47]">
                                                                    {sale.customer}
                                                                </p>

                                                                <p className="mt-0.5 text-[8px] text-[#0757C9]">
                                                                    {sale.invoice}
                                                                </p>

                                                            </div>

                                                        </div>

                                                        <span
                                                            className={`
                                                                rounded-full
                                                                px-2
                                                                py-1
                                                                text-[7px]
                                                                font-semibold
                                                                ${sale.statusClass}
                                                            `}
                                                        >
                                                            {sale.status}
                                                        </span>

                                                    </div>

                                                    <div className="mt-3 grid grid-cols-3 gap-3">

                                                        <div>
                                                            <p className="text-[7px] uppercase text-[#89909D]">
                                                                Date
                                                            </p>
                                                            <p className="mt-1 text-[9px] text-[#343A47]">
                                                                {sale.date}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[7px] uppercase text-[#89909D]">
                                                                Items
                                                            </p>
                                                            <p className="mt-1 text-[9px] text-[#343A47]">
                                                                {sale.items}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[7px] uppercase text-[#89909D]">
                                                                Amount
                                                            </p>
                                                            <p className="mt-1 text-[9px] font-bold text-[#171B25]">
                                                                {sale.amount}
                                                            </p>
                                                        </div>

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                        {/* Pagination */}

                                        <div
                                            className="
                                                flex
                                                flex-col
                                                gap-3
                                                border-t
                                                border-[#E3E6ED]
                                                bg-[#F7F7FD]
                                                px-4
                                                py-2.5
                                                sm:flex-row
                                                sm:items-center
                                                sm:justify-between
                                            "
                                        >

                                            <span className="text-[8px] text-[#69707D]">
                                                Showing {firstItem}–{lastItem} of {totalItems} sales
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={currentPage <= 1 || loading}
                                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                                    className="rounded border border-[#DDE1E8] bg-white px-2 py-1.5 text-[8px] text-[#343A47] disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-[8px] text-[#59606E]">
                                                    Page {currentPage} of {Math.max(totalPages, 1)}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={currentPage >= totalPages || loading || totalPages === 0}
                                                    onClick={() => setPage((current) => current + 1)}
                                                    className="rounded border border-[#DDE1E8] bg-white px-2 py-1.5 text-[8px] text-[#343A47] disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Next
                                                </button>
                                            </div>

                                        </div>

                                    </section>

                                    {/* =================================================
                                        CHARTS
                                    ================================================== */}

                                    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">

                                        {/* Daily Sales Performance */}

                                        <section
                                            className="
                                                rounded-lg
                                                border
                                                border-[#E3E6ED]
                                                bg-white
                                                p-4
                                                shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                            "
                                        >

                                            <div className="flex items-center justify-between">

                                                <h3 className="text-[11px] font-semibold text-[#242936]">
                                                    Daily Sales Performance
                                                </h3>

                                                <button
                                                    type="button"
                                                    aria-label="Chart options"
                                                    className="text-[#59606E]"
                                                >
                                                    <MoreVertical size={14} />
                                                </button>

                                            </div>

                                            <div className="mt-5 h-32">

                                                <svg
                                                    viewBox="0 0 400 150"
                                                    className="h-full w-full"
                                                    preserveAspectRatio="none"
                                                    aria-label="Daily sales performance chart"
                                                >

                                                    <defs>

                                                        <linearGradient
                                                            id="salesGradient"
                                                            x1="0"
                                                            x2="0"
                                                            y1="0"
                                                            y2="1"
                                                        >
                                                            <stop
                                                                offset="0%"
                                                                stopColor="#2F6BFF"
                                                                stopOpacity="0.16"
                                                            />
                                                            <stop
                                                                offset="100%"
                                                                stopColor="#2F6BFF"
                                                                stopOpacity="0"
                                                            />
                                                        </linearGradient>

                                                    </defs>

                                                    <path
                                                        d="M0 112 C45 82, 72 92, 105 97 C145 104, 172 82, 203 89 C238 96, 270 78, 295 53 C320 28, 340 24, 365 8 L400 4 L400 150 L0 150 Z"
                                                        fill="url(#salesGradient)"
                                                    />

                                                    <path
                                                        d="M0 112 C45 82, 72 92, 105 97 C145 104, 172 82, 203 89 C238 96, 270 78, 295 53 C320 28, 340 24, 365 8"
                                                        fill="none"
                                                        stroke="#2F6BFF"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                    />

                                                </svg>

                                            </div>

                                            <div className="mt-1 grid grid-cols-5 text-center">

                                                {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((day) => (
                                                    <span
                                                        key={day}
                                                        className="text-[7px] font-medium text-[#89909D]"
                                                    >
                                                        {day}
                                                    </span>
                                                ))}

                                            </div>

                                        </section>

                                        {/* Weekly Target */}

                                        <section
                                            className="
                                                rounded-lg
                                                border
                                                border-[#E3E6ED]
                                                bg-white
                                                p-4
                                                shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                            "
                                        >

                                            <h3 className="text-[11px] font-semibold text-[#242936]">
                                                Weekly Target
                                            </h3>

                                            <p className="mt-1 text-[8px] text-[#69707D]">
                                                You've reached 75% of your $25k goal.
                                            </p>

                                            <div className="mt-4 flex items-center justify-center">

                                                <div className="relative flex h-28 w-28 items-center justify-center">

                                                    <svg
                                                        viewBox="0 0 120 120"
                                                        className="absolute inset-0 h-full w-full -rotate-90"
                                                    >

                                                        <circle
                                                            cx="60"
                                                            cy="60"
                                                            r="42"
                                                            fill="none"
                                                            stroke="#E9EDF5"
                                                            strokeWidth="7"
                                                        />

                                                        <circle
                                                            cx="60"
                                                            cy="60"
                                                            r="42"
                                                            fill="none"
                                                            stroke="#2F6BFF"
                                                            strokeWidth="7"
                                                            strokeLinecap="round"
                                                            strokeDasharray="263.9"
                                                            strokeDashoffset="65.9"
                                                        />

                                                    </svg>

                                                    <div className="text-center">

                                                        <p className="text-lg font-bold text-[#171B25]">
                                                            75%
                                                        </p>

                                                        <p className="text-[7px] font-medium text-[#69707D]">
                                                            PROGRESS
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>

                                        </section>

                                    </div>

                                </div>

                                {/* =================================================
                                    RIGHT SIDE - QUICK SALE
                                ================================================== */}

                                <div className="space-y-3">

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#DDE4F0]
                                            bg-white
                                            p-3
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >

                                        <div className="flex items-center gap-2">

                                            <CircleDollarSign
                                                size={14}
                                                className="text-[#0052CC]"
                                            />

                                            <h3 className="text-[10px] font-semibold text-[#242936]">
                                                New Sale Quick Entry
                                            </h3>

                                        </div>

                                        {/* Customer */}

                                        <div className="mt-4">

                                            <label className="text-[7px] font-semibold uppercase text-[#59606E]">
                                                Customer
                                            </label>

                                            <select
                                                defaultValue=""
                                                className="
                                                    mt-1
                                                    h-8
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-transparent
                                                    bg-[#F1F3FA]
                                                    px-2
                                                    text-[8px]
                                                    text-[#69707D]
                                                    outline-none
                                                "
                                            >
                                                <option value="" disabled>
                                                    Select customer...
                                                </option>
                                                <option value="jordan">
                                                    Jordan Smith
                                                </option>
                                                <option value="amanda">
                                                    Amanda Lee
                                                </option>
                                                <option value="robert">
                                                    Robert Miller
                                                </option>
                                            </select>

                                        </div>

                                        {/* Product */}

                                        <div className="mt-3">

                                            <label className="text-[7px] font-semibold uppercase text-[#59606E]">
                                                Product
                                            </label>

                                            <select
                                                defaultValue=""
                                                className="
                                                    mt-1
                                                    h-8
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-transparent
                                                    bg-[#F1F3FA]
                                                    px-2
                                                    text-[8px]
                                                    text-[#69707D]
                                                    outline-none
                                                "
                                            >
                                                <option value="" disabled>
                                                    Select product...
                                                </option>
                                                <option value="tablet">
                                                    Industrial Tablet X1
                                                </option>
                                                <option value="helmet">
                                                    Smart Safety Helmet
                                                </option>
                                                <option value="scanner">
                                                    Biometric Scanner V2
                                                </option>
                                            </select>

                                        </div>

                                        {/* Quantity / Price */}

                                        <div className="mt-3 grid grid-cols-2 gap-2">

                                            <div>

                                                <label className="text-[7px] font-semibold uppercase text-[#59606E]">
                                                    Qty
                                                </label>

                                                <input
                                                    type="number"
                                                    defaultValue="1"
                                                    min="1"
                                                    className="
                                                        mt-1
                                                        h-8
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-transparent
                                                        bg-[#F1F3FA]
                                                        px-2
                                                        text-[8px]
                                                        outline-none
                                                    "
                                                />

                                            </div>

                                            <div>

                                                <label className="text-[7px] font-semibold uppercase text-[#59606E]">
                                                    Price
                                                </label>

                                                <input
                                                    type="text"
                                                    defaultValue="$0.00"
                                                    className="
                                                        mt-1
                                                        h-8
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-transparent
                                                        bg-[#F1F3FA]
                                                        px-2
                                                        text-[8px]
                                                        outline-none
                                                    "
                                                />

                                            </div>

                                        </div>

                                        {/* Total */}

                                        <div className="mt-4 flex items-center justify-between border-t border-[#E8EBF1] pt-3">

                                            <span className="text-[8px] font-semibold text-[#59606E]">
                                                Total Amount:
                                            </span>

                                            <span className="text-[12px] font-bold text-[#0052CC]">
                                                $0.00
                                            </span>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => navigate('/staff/sales/add')}
                                            className="
                                                mt-3
                                                flex
                                                h-9
                                                w-full
                                                items-center
                                                justify-center
                                                gap-2
                                                rounded-md
                                                bg-[#0052CC]
                                                text-[9px]
                                                font-semibold
                                                text-white
                                                shadow-sm
                                                transition
                                                hover:bg-[#0045AD]
                                            "
                                        >
                                            <CheckCircle2 size={13} />
                                            Complete Transaction
                                        </button>

                                    </section>

                                    {/* Quick Actions */}

                                    <div className="grid grid-cols-2 gap-2">

                                        <button
                                            type="button"
                                            onClick={() => navigate('/staff/sales/add')}
                                            className="
                                                flex
                                                min-h-16
                                                flex-col
                                                items-center
                                                justify-center
                                                gap-1
                                                rounded-lg
                                                border
                                                border-[#E3E6ED]
                                                bg-white
                                                text-[#343A47]
                                                transition
                                                hover:border-[#C5D3F2]
                                            "
                                        >
                                            <Receipt
                                                size={14}
                                                className="text-[#0757C9]"
                                            />
                                            <span className="text-[7px] font-semibold">
                                                Record Sale
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={fetchSalesData}
                                            className="
                                                flex
                                                min-h-16
                                                flex-col
                                                items-center
                                                justify-center
                                                gap-1
                                                rounded-lg
                                                border
                                                border-[#E3E6ED]
                                                bg-white
                                                text-[#343A47]
                                                transition
                                                hover:border-[#C5D3F2]
                                            "
                                        >
                                            <BarChart3
                                                size={14}
                                                className="text-[#0757C9]"
                                            />
                                            <span className="text-[7px] font-semibold">
                                                View My Sales
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            className="
                                                flex
                                                min-h-16
                                                flex-col
                                                items-center
                                                justify-center
                                                gap-1
                                                rounded-lg
                                                border
                                                border-[#E3E6ED]
                                                bg-white
                                                text-[#343A47]
                                                transition
                                                hover:border-[#C5D3F2]
                                            "
                                        >
                                            <Printer
                                                size={14}
                                                className="text-[#0757C9]"
                                            />
                                            <span className="text-[7px] font-semibold">
                                                Print Invoice
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            className="
                                                flex
                                                min-h-16
                                                flex-col
                                                items-center
                                                justify-center
                                                gap-1
                                                rounded-lg
                                                border
                                                border-[#E3E6ED]
                                                bg-white
                                                text-[#343A47]
                                                transition
                                                hover:border-[#C5D3F2]
                                            "
                                        >
                                            <Download
                                                size={14}
                                                className="text-[#0757C9]"
                                            />
                                            <span className="text-[7px] font-semibold">
                                                Get Receipt
                                            </span>
                                        </button>

                                    </div>

                                    {/* Recent Activity */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6ED]
                                            bg-white
                                            p-4
                                            shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                        "
                                    >

                                        <h3 className="text-[11px] font-semibold text-[#242936]">
                                            Recent Sales Activity
                                        </h3>

                                        <div className="mt-4">

                                            {activities.map((activity, index) => {

                                                const Icon = activity.icon

                                                return (
                                                    <div
                                                        key={activity.title}
                                                        className="relative flex gap-2.5 pb-4 last:pb-0"
                                                    >

                                                        {index !== activities.length - 1 && (
                                                            <span
                                                                className="
                                                                    absolute
                                                                    left-2.5
                                                                    top-6
                                                                    h-[calc(100%-14px)]
                                                                    w-px
                                                                    bg-[#E2E6EF]
                                                                "
                                                            />
                                                        )}

                                                        <span
                                                            className={`
                                                                relative
                                                                z-10
                                                                flex
                                                                h-5
                                                                w-5
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                ${activity.iconClass}
                                                            `}
                                                        >
                                                            <Icon size={10} />
                                                        </span>

                                                        <div className="min-w-0">

                                                            <p className="text-[8px] font-semibold text-[#343A47]">
                                                                {activity.title}
                                                            </p>

                                                            <p className="mt-0.5 text-[7px] leading-3 text-[#69707D]">
                                                                {activity.description}
                                                            </p>

                                                            <p className="mt-1 text-[6px] font-medium text-[#9AA0AA]">
                                                                {activity.time}
                                                            </p>

                                                        </div>

                                                    </div>
                                                )

                                            })}

                                        </div>

                                    </section>

                                </div>

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
                                        text-[9px]
                                        text-[#59606E]
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >

                                    <p>
                                        © 2026 Business Process Automation System | Cloud-Based SaaS Platform
                                    </p>

                                    <div className="flex flex-wrap gap-5 text-[#343A47]">

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

export default StaffSalesManagement