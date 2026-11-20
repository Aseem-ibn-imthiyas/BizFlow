import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    AlertTriangle,
    BellRing,
    Boxes,
    ChevronLeft,
    ChevronRight,
    Edit3,
    PackageCheck,
    RefreshCw,
    Search,
    TriangleAlert,
} from 'lucide-react'

import StaffSidebar from '../../components/sidebar/StaffSidebar'
import StaffHeader from '../../components/header/StaffHeader'
import api from '../../services/api'

const PAGE_SIZE = 10

function getStockStatus(product) {
    const quantity = Number(product.quantity || 0)
    const minimum = Number(product.minimumStockLevel || 0)

    if (quantity === 0) {
        return {
            label: 'OUT OF STOCK',
            className: 'bg-red-50 text-red-600',
        }
    }

    if (quantity <= minimum) {
        return {
            label: 'LOW STOCK',
            className: 'bg-amber-50 text-amber-600',
        }
    }

    return {
        label: 'IN STOCK',
        className: 'bg-emerald-50 text-emerald-600',
    }
}

function StaffInventoryManagement() {
    const navigate = useNavigate()
    const location = useLocation()

    const [products, setProducts] = useState([])
    const [stats, setStats] = useState({
        totalProducts: 0,
        availableProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalStockUnits: 0,
    })
    const [stockAlerts, setStockAlerts] = useState([])

    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [sortBy, setSortBy] = useState('productName')
    const [sortOrder, setSortOrder] = useState('asc')

    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: PAGE_SIZE,
        totalItems: 0,
        totalPages: 0,
    })

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState(
        location.state?.successMessage || ''
    )

    const fetchInventory = useCallback(async () => {
        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(PAGE_SIZE),
            sortBy,
            sortOrder,
        })

        if (search) params.set('search', search)

        if (selectedCategory !== 'all') {
            params.set('category', selectedCategory)
        }

        if (selectedStatus !== 'all') {
            params.set('status', selectedStatus)
        }

        const response = await api.get(`/inventory?${params.toString()}`)

        setProducts(Array.isArray(response?.data) ? response.data : [])

        setPagination(response?.pagination || {
            currentPage,
            pageSize: PAGE_SIZE,
            totalItems: 0,
            totalPages: 0,
        })
    }, [
        currentPage,
        search,
        selectedCategory,
        selectedStatus,
        sortBy,
        sortOrder,
    ])

    const fetchStats = useCallback(async () => {
        const response = await api.get('/inventory/stats')

        if (response?.data) {
            setStats((previous) => ({
                ...previous,
                ...response.data,
            }))
        }
    }, [])

    const fetchAlerts = useCallback(async () => {
        const response = await api.get('/inventory/alerts')

        setStockAlerts(
            Array.isArray(response?.data) ? response.data : []
        )
    }, [])

    const loadDashboard = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true)

            setError('')

            await Promise.all([
                fetchInventory(),
                fetchStats(),
                fetchAlerts(),
            ])
        } catch (err) {
            console.error('Staff inventory loading error:', err)
            setError(
                err.message || 'Unable to load inventory information.'
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [fetchInventory, fetchStats, fetchAlerts])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadDashboard()
    }, [loadDashboard])

    useEffect(() => {
        if (!location.state?.successMessage) return

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSuccessMessage(location.state.successMessage)

        // Remove the navigation message so it does not reappear
        // when the user returns to this page.
        navigate(location.pathname, {
            replace: true,
            state: {},
        })
    }, [location.state, location.pathname, navigate])

    const categories = useMemo(() => {
        const breakdown = stats.categoryBreakdown || []

        return breakdown
            .map((item) => (
                typeof item === 'string' ? item : item.category
            ))
            .filter(Boolean)
    }, [stats.categoryBreakdown])

    const handleSearch = (event) => {
        event.preventDefault()
        setCurrentPage(1)
        setSearch(searchInput.trim())
    }

    const handleResetFilters = () => {
        setSearchInput('')
        setSearch('')
        setSelectedCategory('all')
        setSelectedStatus('all')
        setSortBy('productName')
        setSortOrder('asc')
        setCurrentPage(1)
    }

    const handleEditProduct = (productId) => {
        navigate(`/staff/inventory/edit/${productId}`)
    }

    const handleRefresh = () => {
        loadDashboard(true)
    }

    const handleExport = () => {
        if (!products.length) {
            window.alert('There are no inventory products to export.')
            return
        }

        const headers = [
            'Product ID',
            'Product Name',
            'Category',
            'Quantity',
            'Minimum Stock Level',
            'Stock Status',
        ]

        const rows = products.map((product) => [
            product.productId || '',
            product.productName || '',
            product.category || '',
            product.quantity ?? 0,
            product.minimumStockLevel ?? 0,
            getStockStatus(product).label,
        ])

        const escapeCSV = (value) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`

        const csvContent = [
            headers,
            ...rows,
        ]
            .map((row) => row.map(escapeCSV).join(','))
            .join('\n')

        const blob = new Blob(
            ['\uFEFF' + csvContent],
            { type: 'text/csv;charset=utf-8;' }
        )

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = 'bizflow-staff-inventory.csv'
        link.click()

        URL.revokeObjectURL(url)
    }

    const firstItem = pagination.totalItems
        ? (currentPage - 1) * PAGE_SIZE + 1
        : 0

    const lastItem = Math.min(
        currentPage * PAGE_SIZE,
        pagination.totalItems
    )

    const statCards = [
        {
            label: 'Total Products',
            value: stats.totalProducts,
            icon: PackageCheck,
            iconClass: 'bg-[#EAF0FF] text-[#0757C9]',
        },
        {
            label: 'Low Stock Items',
            value: stats.lowStockProducts,
            icon: AlertTriangle,
            iconClass: 'bg-amber-50 text-amber-600',
        },
        {
            label: 'Out of Stock',
            value: stats.outOfStockProducts,
            icon: TriangleAlert,
            iconClass: 'bg-red-50 text-red-600',
        },
        {
            label: 'Total Stock Units',
            value: stats.totalStockUnits,
            icon: Boxes,
            iconClass: 'bg-emerald-50 text-emerald-600',
        },
    ]

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">
                <aside className="h-screen w-56 shrink-0 overflow-hidden lg:w-64">
                    <StaffSidebar />
                </aside>

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <div className="shrink-0">
                        <StaffHeader />
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="px-5 py-7 sm:px-6 lg:px-8">
                            {/* PAGE HEADER */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] text-[#69707D]">
                                        <span>Home</span>
                                        <span>›</span>
                                        <span className="font-medium text-[#171B25]">
                                            Inventory
                                        </span>
                                    </div>

                                    <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                        Inventory Management
                                    </h1>

                                    <p className="mt-1 text-xs text-[#69707D]">
                                        View products and maintain stock quantities
                                        and minimum stock levels.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#DDE1E8] bg-white px-3 text-[10px] font-medium text-[#59606E] hover:bg-[#F8F9FC] disabled:opacity-60"
                                >
                                    <RefreshCw
                                        size={13}
                                        className={refreshing ? 'animate-spin' : ''}
                                    />
                                    Refresh
                                </button>
                            </div>

                            {/* MESSAGES */}
                            {error && (
                                <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                    {error}
                                    <button
                                        type="button"
                                        onClick={handleRefresh}
                                        className="ml-2 font-semibold underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}

                            {successMessage && (
                                <div className="mt-5 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                                    <span>{successMessage}</span>
                                    <button
                                        type="button"
                                        onClick={() => setSuccessMessage('')}
                                        aria-label="Dismiss success message"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {/* STATISTICS */}
                            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {statCards.map((card) => {
                                    const Icon = card.icon

                                    return (
                                        <div
                                            key={card.label}
                                            className="rounded-lg border border-[#DDE1E8] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
                                        >
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${card.iconClass}`}>
                                                <Icon size={18} />
                                            </div>

                                            <p className="mt-3 text-[10px] text-[#59606E]">
                                                {card.label}
                                            </p>

                                            <p className="mt-1 text-xl font-bold">
                                                {Number(card.value || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* INVENTORY CONTENT */}
                            <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
                                <div className="min-w-0">
                                    {/* FILTERS */}
                                    <section className="rounded-lg border border-[#DDE1E8] bg-white p-4">
                                        <form
                                            onSubmit={handleSearch}
                                            className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_160px_145px_130px_auto]"
                                        >
                                            <div className="relative">
                                                <Search
                                                    size={14}
                                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                                                />
                                                <input
                                                    value={searchInput}
                                                    onChange={(event) =>
                                                        setSearchInput(event.target.value)
                                                    }
                                                    placeholder="Search products..."
                                                    className="h-9 w-full rounded-md border border-[#DDE1E8] bg-white pl-9 pr-3 text-[10px] outline-none focus:border-[#9DB8E8]"
                                                />
                                            </div>

                                            <select
                                                value={selectedCategory}
                                                onChange={(event) => {
                                                    setSelectedCategory(event.target.value)
                                                    setCurrentPage(1)
                                                }}
                                                className="h-9 rounded-md border border-[#DDE1E8] bg-white px-3 text-[10px] text-[#59606E] outline-none"
                                            >
                                                <option value="all">All Categories</option>
                                                {categories.map((item) => (
                                                    <option key={item} value={item}>
                                                        {item}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={selectedStatus}
                                                onChange={(event) => {
                                                    setSelectedStatus(event.target.value)
                                                    setCurrentPage(1)
                                                }}
                                                className="h-9 rounded-md border border-[#DDE1E8] bg-white px-3 text-[10px] text-[#59606E] outline-none"
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="available">In Stock</option>
                                                <option value="low-stock">Low Stock</option>
                                                <option value="out-of-stock">Out of Stock</option>
                                            </select>

                                            <select
                                                value={`${sortBy}:${sortOrder}`}
                                                onChange={(event) => {
                                                    const [field, order] = event.target.value.split(':')
                                                    setSortBy(field)
                                                    setSortOrder(order)
                                                    setCurrentPage(1)
                                                }}
                                                className="h-9 rounded-md border border-[#DDE1E8] bg-white px-3 text-[10px] text-[#59606E] outline-none"
                                            >
                                                <option value="productName:asc">Name A–Z</option>
                                                <option value="productName:desc">Name Z–A</option>
                                                <option value="quantity:asc">Stock: Low–High</option>
                                                <option value="quantity:desc">Stock: High–Low</option>
                                            </select>

                                            <button
                                                type="submit"
                                                className="h-9 rounded-md bg-[#0757C9] px-4 text-[10px] font-medium text-white hover:bg-[#0649A8]"
                                            >
                                                Search
                                            </button>
                                        </form>

                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                            <p className="text-[9px] text-[#69707D]">
                                                Staff can update stock quantities and minimum stock levels only.
                                            </p>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="text-[10px] font-medium text-[#59606E] hover:text-[#0757C9]"
                                                >
                                                    Clear filters
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleExport}
                                                    className="flex h-8 items-center gap-2 rounded-md border border-[#DDE1E8] px-3 text-[10px] font-medium text-[#59606E] hover:bg-[#F8F9FC]"
                                                >
                                                    Export current page
                                                </button>
                                            </div>
                                        </div>
                                    </section>

                                    {/* PRODUCT TABLE */}
                                    <section className="mt-4 overflow-hidden rounded-lg border border-[#DDE1E8] bg-white">
                                        <div className="hidden grid-cols-[minmax(180px,1.5fr)_120px_110px_110px_115px_85px] items-center gap-3 bg-[#F4F4FC] px-4 py-3 md:grid">
                                            {[
                                                'PRODUCT',
                                                'CATEGORY',
                                                'CURRENT STOCK',
                                                'MINIMUM',
                                                'STATUS',
                                                'ACTION',
                                            ].map((heading) => (
                                                <span
                                                    key={heading}
                                                    className="text-[8px] font-semibold uppercase tracking-wide text-[#59606E]"
                                                >
                                                    {heading}
                                                </span>
                                            ))}
                                        </div>

                                        {loading ? (
                                            <div className="flex min-h-48 items-center justify-center text-xs text-[#69707D]">
                                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                                Loading inventory...
                                            </div>
                                        ) : products.length === 0 ? (
                                            <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
                                                <Search size={25} className="text-[#A0A6B0]" />
                                                <p className="mt-3 text-xs font-semibold text-[#59606E]">
                                                    No inventory items found
                                                </p>
                                                <p className="mt-1 text-[10px] text-[#858B97]">
                                                    Try changing your search or filters.
                                                </p>
                                            </div>
                                        ) : (
                                            products.map((product) => {
                                                const stockStatus = getStockStatus(product)

                                                return (
                                                    <div
                                                        key={product._id}
                                                        className="border-t border-[#E1E4EA] px-4 py-4"
                                                    >
                                                        <div className="hidden grid-cols-[minmax(180px,1.5fr)_120px_110px_110px_115px_85px] items-center gap-3 md:grid">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F1F3FA]">
                                                                    {product.imageUrl ? (
                                                                        <img
                                                                            src={product.imageUrl}
                                                                            alt={product.productName}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <PackageCheck
                                                                            size={17}
                                                                            className="text-[#59606E]"
                                                                        />
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <p className="truncate text-[10px] font-semibold text-[#343A47]">
                                                                        {product.productName}
                                                                    </p>
                                                                    <p className="text-[8px] text-[#858B97]">
                                                                        {product.productId || 'No product code'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <span className="truncate text-[9px] text-[#343A47]">
                                                                {product.category || '—'}
                                                            </span>

                                                            <span className="text-[10px] font-semibold text-[#343A47]">
                                                                {Number(product.quantity || 0).toLocaleString()} units
                                                            </span>

                                                            <span className="text-[10px] text-[#59606E]">
                                                                {Number(product.minimumStockLevel || 0).toLocaleString()} units
                                                            </span>

                                                            <span className={`w-fit rounded-full px-2 py-1 text-[7px] font-semibold ${stockStatus.className}`}>
                                                                {stockStatus.label}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditProduct(product._id)}
                                                                className="flex h-8 items-center justify-center gap-1 rounded-md border border-[#DDE1E8] text-[9px] font-medium text-[#0757C9] transition hover:bg-[#EEF3FF]"
                                                                aria-label={`Update stock for ${product.productName}`}
                                                            >
                                                                <Edit3 size={12} />
                                                                Edit
                                                            </button>
                                                        </div>

                                                        {/* MOBILE PRODUCT CARD */}
                                                        <div className="md:hidden">
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F1F3FA]">
                                                                    {product.imageUrl ? (
                                                                        <img
                                                                            src={product.imageUrl}
                                                                            alt={product.productName}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <PackageCheck size={18} className="text-[#59606E]" />
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-[10px] font-semibold text-[#343A47]">
                                                                                {product.productName}
                                                                            </p>
                                                                            <p className="text-[8px] text-[#858B97]">
                                                                                {product.productId || 'No product code'}
                                                                            </p>
                                                                        </div>

                                                                        <span className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-semibold ${stockStatus.className}`}>
                                                                            {stockStatus.label}
                                                                        </span>
                                                                    </div>

                                                                    <p className="mt-2 text-[9px] text-[#59606E]">
                                                                        {product.category || 'Uncategorised'}
                                                                    </p>

                                                                    <div className="mt-3 flex items-center justify-between">
                                                                        <div>
                                                                            <p className="text-[8px] text-[#858B97]">
                                                                                Current / Minimum
                                                                            </p>
                                                                            <p className="text-[10px] font-semibold text-[#343A47]">
                                                                                {product.quantity ?? 0} / {product.minimumStockLevel ?? 0} units
                                                                            </p>
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleEditProduct(product._id)}
                                                                            className="flex h-8 items-center gap-2 rounded-md border border-[#DDE1E8] px-3 text-[9px] font-medium text-[#0757C9]"
                                                                        >
                                                                            <Edit3 size={12} />
                                                                            Update Stock
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}

                                        {/* PAGINATION */}
                                        <div className="flex flex-col gap-3 border-t border-[#E1E4EA] bg-[#F4F4FC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-[9px] text-[#59606E]">
                                                Showing {firstItem}–{lastItem} of {pagination.totalItems} products
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={currentPage <= 1 || loading}
                                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                                    className="flex h-7 w-7 items-center justify-center rounded border border-[#DDE1E8] bg-white text-[#59606E] disabled:opacity-40"
                                                    aria-label="Previous page"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>

                                                <span className="text-[9px] text-[#59606E]">
                                                    Page {currentPage} of {Math.max(pagination.totalPages || 1, 1)}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        currentPage >= pagination.totalPages ||
                                                        loading
                                                    }
                                                    onClick={() => setCurrentPage((page) => page + 1)}
                                                    className="flex h-7 w-7 items-center justify-center rounded border border-[#DDE1E8] bg-white text-[#59606E] disabled:opacity-40"
                                                    aria-label="Next page"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* RIGHT SIDEBAR */}
                                <div className="space-y-4">
                                    <section className="rounded-lg border border-[#DDE1E8] bg-white p-4">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <BellRing size={14} />
                                            <h3 className="text-[9px] font-semibold uppercase tracking-wide">
                                                Low Stock Alerts
                                            </h3>
                                        </div>

                                        {stockAlerts.length === 0 ? (
                                            <p className="mt-4 text-[9px] text-[#858B97]">
                                                No stock alerts at the moment.
                                            </p>
                                        ) : (
                                            <div className="mt-4 space-y-3">
                                                {stockAlerts.slice(0, 5).map((item) => (
                                                    <div
                                                        key={item._id || item.productId || item.productName}
                                                        className="flex gap-2"
                                                    >
                                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-[9px] font-semibold text-[#343A47]">
                                                                {item.productName || item.name || 'Inventory item'}
                                                            </p>
                                                            <p className="text-[8px] text-[#858B97]">
                                                                {Number(item.quantity || 0)} left · Minimum {Number(item.minimumStockLevel || 0)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    <section className="rounded-lg border border-[#DDE1E8] bg-white p-4">
                                        <h3 className="text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                            Staff Permissions
                                        </h3>

                                        <div className="mt-4 space-y-3 text-[9px]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#59606E]">View products</span>
                                                <span className="font-semibold text-emerald-600">Allowed</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#59606E]">Update stock</span>
                                                <span className="font-semibold text-emerald-600">Allowed</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#59606E]">Create products</span>
                                                <span className="font-semibold text-red-500">Restricted</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#59606E]">Delete products</span>
                                                <span className="font-semibold text-red-500">Restricted</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <p className="text-[9px] text-[#59606E]">
                                    © 2026 BizFlow | Cloud-Based SaaS Business Process Automation
                                </p>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default StaffInventoryManagement