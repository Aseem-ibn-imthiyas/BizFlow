import ManagerSidebar from '../../components/sidebar/ManagerSidebar'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'
import { Plus } from 'lucide-react'
import {
    Bell,
    CircleHelp,
    Search,
    Settings,
    CreditCard,
    FileText,
    Users,
    Download,
    ChevronDown,
    Receipt,
    RefreshCw,
} from 'lucide-react'

function SalesManagement() {
    const navigate = useNavigate()

    const [sales, setSales] = useState([])
    const [statistics, setStatistics] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [paymentFilter, setPaymentFilter] = useState('')
    const [dateFilter, setDateFilter] = useState('')
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
        paymentStatus: '',
        date: '',
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(Number(value) || 0)

    const fetchSalesData = useCallback(async () => {
        try {
            const params = new URLSearchParams()
            if (appliedFilters.search) params.set('search', appliedFilters.search)
            if (appliedFilters.paymentStatus) params.set('paymentStatus', appliedFilters.paymentStatus)
            if (appliedFilters.date) {
                params.set('startDate', appliedFilters.date)
                params.set('endDate', appliedFilters.date)
            }

            const query = params.toString()
            const [salesResponse, statsResponse] = await Promise.all([
                api.get(`/sales${query ? `?${query}` : ''}`),
                api.get('/sales/stats'),
            ])

            setError('')
            setSales(Array.isArray(salesResponse?.data) ? salesResponse.data : [])
            setStatistics(statsResponse?.data || null)
        } catch (err) {
            setError(err.message || 'Unable to load sales information.')
        } finally {
            setLoading(false)
        }
    }, [appliedFilters])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSalesData()
    }, [fetchSalesData])

    const stats = [
        {
            title: "TODAY'S SALES",
            value: formatCurrency(statistics?.today?.revenue),
        },
        {
            title: 'MONTHLY REVENUE',
            value: formatCurrency(statistics?.month?.revenue),
        },
        {
            title: 'TOTAL ORDERS',
            value: Number(statistics?.totalOrders || 0).toLocaleString(),
        },
        {
            title: 'COMPLETED',
            value: Number(statistics?.statusCounts?.Completed || 0).toLocaleString(),
        },
        {
            title: 'DRAFT',
            value: Number(statistics?.statusCounts?.Draft || 0).toLocaleString(),
        },
        {
            title: 'CANCELLED',
            value: Number(statistics?.statusCounts?.Cancelled || 0).toLocaleString(),
        },
    ]

    const transactions = sales.map((sale) => ({
        id: sale._id,
        invoice: sale.invoiceId,
        customer: sale.customer?.name || 'Unknown customer',
        amount: formatCurrency(sale.grandTotal),
        method: sale.paymentMethod || '—',
        payment: sale.paymentStatus || '—',
        status: sale.saleStatus || '—',
        createdAt: sale.saleDate,
    }))

    const products = (statistics?.topProducts || []).map((product) => ({
        id: product._id || product.productId || product.productName,
        name: product.productName || 'Unknown product',
        category: product.productId || '—',
        units: Number(product.quantitySold || 0).toLocaleString(),
        revenue: formatCurrency(product.revenue),
        stock: '—',
    }))

    const paymentMethods = statistics?.paymentBreakdown || []
    const totalPaymentOrders = paymentMethods.reduce(
        (total, method) => total + Number(method.totalOrders || 0),
        0
    )
    const paymentColors = ['#0757C9', '#F6A51A', '#18A957', '#9CA3AF', '#8B5CF6']

    const activities = (statistics?.recentSales || []).slice(0, 3).map((sale, index) => ({
        icon: index === 0 ? Receipt : index === 1 ? FileText : CreditCard,
        iconClass: index === 0
            ? 'bg-blue-50 text-blue-600'
            : index === 1
                ? 'bg-orange-50 text-orange-600'
                : 'bg-emerald-50 text-emerald-600',
        text: (
            <>
                {sale.saleStatus === 'Draft' ? 'Draft sale saved' : 'Sale recorded'}{' '}
                <span className="font-semibold text-[#0757C9]">{sale.invoiceId}</span>
            </>
        ),
        sub: `${(typeof sale.customer === 'string' ? sale.customer : sale.customer?.name) || 'Unknown customer'} • ${sale.paymentStatus || 'Payment pending'}`,
    }))

    const quickActions = [
        { title: 'Record Sale', icon: CreditCard, action: () => navigate('/manager/sales/add') },
        { title: 'Gen. Invoice', icon: FileText, disabled: true },
        { title: 'Customers', icon: Users, disabled: true },
        { title: 'Reports', icon: Download, disabled: true },
    ]

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
                                aria-label="Messages"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <span className="text-[17px]">✉</span>
                            </button>

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Bell
                                    size={17}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <button
                                type="button"
                                aria-label="Settings"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Settings
                                    size={17}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <button
                                type="button"
                                aria-label="Help"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <CircleHelp
                                    size={17}
                                    strokeWidth={1.7}
                                />
                            </button>


                            <div className="h-7 w-px bg-[#E1E4EA]" />


                            <div
                                className="
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-[#DDE5F5]
                                    text-[10px]
                                    font-semibold
                                    text-[#315A9E]
                                "
                            >
                                BM
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
                                PAGE HEADING
                            ================================================== */}

                            <div className="flex items-start justify-between gap-6">

                                <div>

                                    <div className="flex items-center gap-2 text-[10px]">

                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            /
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            Sales Management
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
                                        Sales Management
                                    </h2>


                                    <p className="mt-1 text-xs text-[#69707D]">
                                        Monitor sales transactions, customer orders, and business revenue.
                                    </p>

                                </div>

                                {/* Right - Add Sales Record */}
                                <button
                                    type="button"
                                    onClick={() => navigate('/manager/sales/add')}
                                    className="
                                        mt-1
                                        flex
                                        h-10
                                        shrink-0
                                        items-center
                                        gap-2
                                        rounded-md
                                        bg-[#0052CC]
                                        px-4
                                        text-sm
                                        font-medium
                                        text-white
                                        shadow-sm
                                        transition
                                        hover:bg-[#0045AD]
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-[#0052CC]/20
                                    "
                                >
                                    <Plus
                                        size={17}
                                        strokeWidth={2}
                                    />

                                    Add Sales Record
                                </button>

                            </div>


                            {/* =================================================
                                STATISTICS
                            ================================================== */}

                            <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-6">

                                {stats.map((stat) => (

                                    <div
                                        key={stat.title}
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E5E7EC]
                                            bg-white
                                            px-4
                                            py-4
                                            shadow-[0_2px_8px_rgba(15,23,42,0.035)]
                                        "
                                    >

                                        <p className="text-[9px] font-medium text-[#59606E]">
                                            {stat.title}
                                        </p>

                                        <div className="mt-3 flex items-end justify-between gap-2">

                                            <p className="text-sm font-bold text-[#171B25]">
                                                {stat.value}
                                            </p>

                                            {stat.growth && (
                                                <span
                                                    className="
                                                        rounded-full
                                                        bg-[#E8F8EF]
                                                        px-1.5
                                                        py-0.5
                                                        text-[8px]
                                                        font-semibold
                                                        text-[#18A957]
                                                    "
                                                >
                                                    ↗ {stat.growth}
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                ))}

                            </div>


                            {/* =================================================
                                FILTER BAR
                            ================================================== */}

                            <section
                                className="
                                    mt-5
                                    rounded-lg
                                    border
                                    border-[#E5E7EC]
                                    bg-white
                                    p-3
                                    shadow-[0_2px_8px_rgba(15,23,42,0.035)]
                                "
                            >

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_130px_105px_auto]">

                                    <div className="relative">

                                        <Search
                                            size={13}
                                            className="
                                                absolute
                                                left-3
                                                top-1/2
                                                -translate-y-1/2
                                                text-[#7D8491]
                                            "
                                        />

                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    setLoading(true)
                                                    setAppliedFilters((current) => ({ ...current, search: searchTerm.trim() }))
                                                }
                                            }}
                                            placeholder="Customer or Invoice #"
                                            className="
                                                h-9
                                                w-full
                                                rounded-md
                                                border
                                                border-[#D9DDE6]
                                                bg-[#FAFBFD]
                                                pl-9
                                                pr-3
                                                text-[10px]
                                                outline-none
                                                focus:border-[#9DB7EA]
                                            "
                                        />

                                    </div>


                                    <div className="relative">

                                        <select
                                            value={paymentFilter}
                                            onChange={(event) => setPaymentFilter(event.target.value)}
                                            className="
                                                h-9
                                                w-full
                                                appearance-none
                                                rounded-md
                                                border
                                                border-[#D9DDE6]
                                                bg-[#FAFBFD]
                                                px-3
                                                pr-8
                                                text-[10px]
                                                text-[#59606E]
                                                outline-none
                                            "
                                        >
                                            <option value="">All Payment Statuses</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Partially Paid">Partially Paid</option>
                                            <option value="Refunded">Refunded</option>
                                        </select>

                                        <ChevronDown
                                            size={13}
                                            className="
                                                pointer-events-none
                                                absolute
                                                right-2.5
                                                top-1/2
                                                -translate-y-1/2
                                                text-[#7D8491]
                                            "
                                        />

                                    </div>


                                    <input
                                        type="date"
                                        value={dateFilter}
                                        onChange={(event) => setDateFilter(event.target.value)}
                                        className="
                                            h-9
                                            rounded-md
                                            border
                                            border-[#D9DDE6]
                                            bg-[#FAFBFD]
                                            px-3
                                            text-[10px]
                                            outline-none
                                            focus:border-[#9DB7EA]
                                        "
                                    />


                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLoading(true)
                                            setAppliedFilters({
                                                search: searchTerm.trim(),
                                                paymentStatus: paymentFilter,
                                                date: dateFilter,
                                            })
                                        }}
                                        className="
                                            h-9
                                            rounded-md
                                            bg-[#0757C9]
                                            px-5
                                            text-[10px]
                                            font-semibold
                                            text-white
                                            transition
                                            hover:bg-[#004BAE]
                                        "
                                    >
                                        Apply Filters
                                    </button>

                                </div>

                            </section>


                            {/* =================================================
                                SALES + ANALYTICS
                            ================================================== */}

                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">


                                {/* Sales Transactions */}

                                <section
                                    className="
                                        overflow-hidden
                                        rounded-lg
                                        border
                                        border-[#E5E7EC]
                                        bg-white
                                        shadow-[0_2px_8px_rgba(15,23,42,0.035)]
                                    "
                                >

                                    <div className="flex items-center justify-between border-b border-[#E6E8ED] px-4 py-3">

                                        <h3 className="text-xs font-semibold text-[#242936]">
                                            Sales Transactions
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={() => { setLoading(true); fetchSalesData() }}
                                            className="flex items-center gap-1 text-[10px] font-semibold text-[#0757C9]"
                                        >
                                            Refresh History
                                            <RefreshCw size={12} />
                                        </button>

                                    </div>


                                    {/* Table Header */}

                                    <div
                                        className="
                                            hidden
                                            grid-cols-[1.1fr_1.1fr_0.9fr_0.9fr_0.8fr_0.8fr]
                                            bg-[#F8F9FC]
                                            px-4
                                            py-3
                                            md:grid
                                        "
                                    >

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            INVOICE ID
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            CUSTOMER
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            AMOUNT
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            METHOD
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            PAYMENT
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            STATUS
                                        </span>

                                    </div>


                                    {error && (
                                        <div className="border-t border-[#ECEEF2] px-4 py-4 text-xs text-red-600">
                                            {error}
                                            <button type="button" onClick={() => { setLoading(true); fetchSalesData() }} className="ml-2 font-semibold underline">
                                                Retry
                                            </button>
                                        </div>
                                    )}

                                    {loading && (
                                        <div className="border-t border-[#ECEEF2] px-4 py-6 text-center text-xs text-[#69707D]">
                                            Loading sales transactions...
                                        </div>
                                    )}

                                    {!loading && !error && transactions.length === 0 && (
                                        <div className="border-t border-[#ECEEF2] px-4 py-8 text-center text-xs text-[#69707D]">
                                            No sales records found.
                                        </div>
                                    )}

                                    {!loading && transactions.map((transaction, index) => (

                                        <div
                                            key={transaction.id || `${transaction.invoice}-${index}`}
                                            className="
                                                grid
                                                grid-cols-2
                                                gap-3
                                                border-t
                                                border-[#ECEEF2]
                                                px-4
                                                py-3
                                                md:grid-cols-[1.1fr_1.1fr_0.9fr_0.9fr_0.8fr_0.8fr]
                                                md:items-center
                                                md:gap-0
                                            "
                                        >

                                            <div className="flex items-center gap-2">

                                                <span className="text-[10px] font-semibold text-[#0757C9]">
                                                    #{transaction.invoice}
                                                </span>

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
                                                        bg-[#DDE5F5]
                                                        text-[8px]
                                                        font-semibold
                                                        text-[#315A9E]
                                                    "
                                                >
                                                    {(transaction.customer || 'C').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                                                </span>

                                                <span className="text-[10px] text-[#343A47]">
                                                    {transaction.customer}
                                                </span>

                                            </div>


                                            <span className="text-[10px] font-semibold text-[#242936]">
                                                {transaction.amount}
                                            </span>


                                            <span className="text-[10px] text-[#59606E]">
                                                {transaction.method}
                                            </span>


                                            <span
                                                className="
                                                    w-fit
                                                    rounded-full
                                                    bg-[#DDF7E8]
                                                    px-2
                                                    py-1
                                                    text-[8px]
                                                    font-semibold
                                                    text-[#159447]
                                                "
                                            >
                                                {transaction.payment}
                                            </span>


                                            <span
                                                className="
                                                    w-fit
                                                    rounded-full
                                                    bg-[#E4EEFF]
                                                    px-2
                                                    py-1
                                                    text-[8px]
                                                    font-semibold
                                                    text-[#2465C5]
                                                "
                                            >
                                                {transaction.status}
                                            </span>

                                        </div>

                                    ))}

                                </section>


                                {/* =================================================
                                    SALES ANALYTICS
                                ================================================== */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E5E7EC]
                                        bg-white
                                        p-4
                                        shadow-[0_2px_8px_rgba(15,23,42,0.035)]
                                    "
                                >

                                    <h3 className="text-xs font-semibold text-[#242936]">
                                        Sales Analytics
                                    </h3>


                                    {/* Revenue Trend */}

                                    <div className="mt-5">

                                        <div className="flex items-center justify-between">

                                            <p className="text-[9px] font-semibold text-[#59606E]">
                                                REVENUE TREND
                                            </p>

                                            <span className="text-[8px] text-[#7A808C]">
                                                Based on available sales data
                                            </span>

                                        </div>


                                        <div
                                            className="
                                                mt-3
                                                flex
                                                h-20
                                                items-end
                                                gap-2
                                                rounded-md
                                                bg-[#F5F8FE]
                                                px-2
                                                pb-2
                                                pt-3
                                            "
                                        >

                                            <div className="flex h-full w-full items-center justify-center text-[9px] text-[#7A808C]">
                                                Daily revenue trend is not yet available.
                                            </div>

                                        </div>

                                    </div>


                                    {/* Payment Methods */}

                                    <div className="mt-5 border-t border-[#E6E8ED] pt-4">

                                        <p className="text-[9px] font-semibold text-[#59606E]">
                                            PAYMENT METHODS
                                        </p>


                                        <div className="mt-3 space-y-3">
                                            {paymentMethods.length === 0 ? (
                                                <p className="text-[9px] text-[#7A808C]">No payment data available yet.</p>
                                            ) : paymentMethods.map((method, index) => {
                                                const percentage = totalPaymentOrders
                                                    ? Math.round((Number(method.totalOrders || 0) / totalPaymentOrders) * 100)
                                                    : 0
                                                return (
                                                    <div key={method._id || index}>
                                                        <div className="flex justify-between text-[9px]">
                                                            <span className="text-[#343A47]">{method._id || 'Other'}</span>
                                                            <span className="font-semibold text-[#343A47]">{percentage}%</span>
                                                        </div>
                                                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E7EAF0]">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${percentage}%`,
                                                                    backgroundColor: paymentColors[index % paymentColors.length],
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="mt-1 text-[8px] text-[#7A808C]">
                                                            {Number(method.totalOrders || 0)} orders · {formatCurrency(method.totalRevenue)}
                                                        </p>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                    </div>

                                </section>

                            </div>


                            {/* =================================================
                                LOWER SECTION
                            ================================================== */}

                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">


                                {/* Top Selling Products */}

                                <section
                                    className="
                                        overflow-hidden
                                        rounded-lg
                                        border
                                        border-[#E5E7EC]
                                        bg-white
                                        shadow-[0_2px_8px_rgba(15,23,42,0.035)]
                                    "
                                >

                                    <div className="flex items-center justify-between border-b border-[#E6E8ED] px-4 py-3">

                                        <h3 className="text-xs font-semibold text-[#242936]">
                                            Top Selling Products
                                        </h3>

                                        <span className="text-[9px] text-[#59606E]">
                                            Last 30 Days
                                        </span>

                                    </div>


                                    <div
                                        className="
                                            grid
                                            grid-cols-[1.5fr_1fr_0.7fr_1fr_0.8fr]
                                            bg-[#F8F9FC]
                                            px-4
                                            py-3
                                        "
                                    >

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            PRODUCT
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            PRODUCT ID
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            UNITS
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            REVENUE
                                        </span>

                                        <span className="text-[9px] font-semibold text-[#59606E]">
                                            STOCK
                                        </span>

                                    </div>


                                    {!loading && products.length === 0 && (
                                        <div className="border-t border-[#ECEEF2] px-4 py-8 text-center text-xs text-[#69707D]">
                                            No product sales data available yet.
                                        </div>
                                    )}

                                    {products.map((product, index) => (

                                        <div
                                            key={index}
                                            className="
                                                grid
                                                grid-cols-[1.5fr_1fr_0.7fr_1fr_0.8fr]
                                                items-center
                                                border-t
                                                border-[#ECEEF2]
                                                px-4
                                                py-3.5
                                            "
                                        >

                                            <span className="text-[10px] font-semibold text-[#343A47]">
                                                {product.name}
                                            </span>

                                            <span className="text-[10px] text-[#59606E]">
                                                {product.category}
                                            </span>

                                            <span className="text-[10px] text-[#343A47]">
                                                {product.units}
                                            </span>

                                            <span className="text-[10px] font-semibold text-[#242936]">
                                                {product.revenue}
                                            </span>

                                            <span className="text-[9px] text-[#7A808C]">
                                                {product.stock}
                                            </span>

                                        </div>

                                    ))}

                                </section>


                                {/* Right Column */}

                                <div className="space-y-4">


                                    {/* Recent Activity */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E5E7EC]
                                            bg-white
                                            p-4
                                            shadow-[0_2px_8px_rgba(15,23,42,0.035)]
                                        "
                                    >

                                        <h3 className="text-xs font-semibold text-[#242936]">
                                            Recent Activity
                                        </h3>


                                        <div className="mt-4 space-y-4">

                                            {activities.length === 0 && (
                                                <p className="text-[9px] text-[#7A808C]">No recent sales activity available.</p>
                                            )}

                                            {activities.map((activity, index) => {

                                                const Icon = activity.icon

                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex gap-3"
                                                    >

                                                        <div
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

                                                            <Icon
                                                                size={13}
                                                                strokeWidth={1.8}
                                                            />

                                                        </div>


                                                        <div className="min-w-0">

                                                            <p className="text-[9px] leading-4 text-[#343A47]">
                                                                {activity.text}
                                                            </p>

                                                            <p className="mt-0.5 text-[8px] text-[#7A808C]">
                                                                {activity.sub}
                                                            </p>

                                                        </div>

                                                    </div>
                                                )
                                            })}

                                        </div>

                                    </section>


                                    {/* Quick Actions */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#DCE5FA]
                                            bg-[#F4F7FF]
                                            p-4
                                        "
                                    >

                                        <h3 className="text-xs font-semibold text-[#0757C9]">
                                            Quick Actions
                                        </h3>


                                        <div className="mt-3 grid grid-cols-2 gap-2">

                                            {quickActions.map((action) => {

                                                const Icon = action.icon

                                                return (
                                                    <button
                                                        key={action.title}
                                                        type="button"
                                                        onClick={action.action}
                                                        disabled={action.disabled}
                                                        className="
                                                            flex
                                                            min-h-14
                                                            flex-col
                                                            items-center
                                                            justify-center
                                                            gap-1.5
                                                            rounded-md
                                                            border
                                                            border-[#D9DFEF]
                                                            bg-white
                                                            text-[8px]
                                                            font-medium
                                                            text-[#343A47]
                                                            transition
                                                            hover:border-[#AFC3E8]
                                                            hover:text-[#0757C9]
                                                            disabled:cursor-not-allowed
                                                            disabled:opacity-50
                                                        "
                                                    >

                                                        <Icon
                                                            size={15}
                                                            strokeWidth={1.8}
                                                            className="text-[#0757C9]"
                                                        />

                                                        {action.title}

                                                    </button>
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

export default SalesManagement