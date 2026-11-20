
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerSidebar from '../../components/sidebar/ManagerSidebar';
import api from '../../services/api';

import {
    Bell,
    Search,
    CircleHelp,
    Package,
    BarChart3,
    Plus,
    RefreshCw,
    Download,
    ChevronDown,
    AlertTriangle,
    CircleAlert,
    Boxes,
    Truck,
    FileText,
    RotateCcw,
    CheckCircle2,
    Database,
    ChevronLeft,
    ChevronRight,
    //X,
    Pencil,
    Eye,
} from 'lucide-react';

function InventoryManagement() {
    const navigate = useNavigate();

    // =========================================================
    // STATE
    // =========================================================

    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        availableProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalCategories: 0,
        totalSuppliers: 0,
        totalStockUnits: 0,
        categoryNames: [],
        categoryBreakdown: [],
    });

    const [stockAlerts, setStockAlerts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortBy, setSortBy] = useState('productName');
    const [sortOrder, setSortOrder] = useState('asc');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    });



    // =========================================================
    // FETCH INVENTORY
    // =========================================================

    const fetchInventory = useCallback(async () => {
        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(pageSize),
            sortBy,
            sortOrder,
        });

        if (search) params.set('search', search);
        if (selectedCategory !== 'all') {
            params.set('category', selectedCategory);
        }
        if (selectedStatus !== 'all') {
            params.set('status', selectedStatus);
        }

        const result = await api.get(`/inventory?${params.toString()}`);

        setProducts(result.data || []);
        setPagination(
            result.pagination || {
                currentPage: 1,
                pageSize,
                totalItems: 0,
                totalPages: 0,
            }
        );
    }, [
        currentPage,
        pageSize,
        search,
        selectedCategory,
        selectedStatus,
        sortBy,
        sortOrder,
    ]);

    // =========================================================
    // FETCH DASHBOARD STATISTICS
    // =========================================================

    const fetchStats = useCallback(async () => {
        const result = await api.get('/inventory/stats');

        if (result.data) {
            setStats((previous) => ({
                ...previous,
                ...result.data,
            }));
        }
    }, []);

    // =========================================================
    // FETCH STOCK ALERTS
    // =========================================================

    const fetchAlerts = useCallback(async () => {
        const result = await api.get('/inventory/alerts');
        setStockAlerts(result.data || []);
    }, []);

    // =========================================================
    // LOAD ALL DASHBOARD DATA
    // =========================================================

    const loadDashboard = useCallback(async (showLoader = false) => {
        try {
            if (showLoader) {
                setRefreshing(true);
            }

            await Promise.resolve();

            setError('');

            await Promise.all([
                fetchInventory(),
                fetchStats(),
                fetchAlerts(),
            ]);
        } catch (err) {
            console.error('Inventory dashboard error:', err);
            setError(
                err.message || 'Unable to load inventory information.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchInventory, fetchStats, fetchAlerts]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadDashboard();
    }, [loadDashboard]);

    // =========================================================
    // APPLY FILTERS
    // =========================================================

    const handleApplyFilters = () => {
        setCurrentPage(1);
        setSearch(searchInput.trim());
    };

    const handleResetFilters = () => {
        setSearchInput('');
        setSearch('');
        setSelectedCategory('all');
        setSelectedStatus('all');
        setSortBy('productName');
        setSortOrder('asc');
        setCurrentPage(1);
    };

    const handleSortChange = (value) => {
        setSortBy(value);
        setCurrentPage(1);
    };

    // =========================================================
    // NAVIGATION
    // =========================================================

    const handleAddProduct = () => {
        navigate('/manager/inventory/add');
    };

    const handleEditProduct = (productId) => {
        navigate(`/manager/inventory/edit/${productId}`);
    };

    const handleViewProduct = (productId) => {
        navigate(`/manager/inventory/details/${productId}`);
    };

    // =========================================================
    // CSV EXPORT
    // =========================================================

    const handleExport = () => {
        if (products.length === 0) {
            window.alert('There are no inventory products to export.');
            return;
        }

        const headers = [
            'Product ID',
            'Product Name',
            'Category',
            'Price',
            'Quantity',
            'Minimum Stock Level',
            'Supplier',
            'Stock Status',
        ];

        const rows = products.map((product) => [
            product.productId,
            product.productName,
            product.category,
            product.price,
            product.quantity,
            product.minimumStockLevel,
            product.supplier || '',
            product.stockStatus || 'Unknown',
        ]);

        const escapeCSV = (value) => {
            const text = String(value ?? '');
            return `"${text.replace(/"/g, '""')}"`;
        };

        const csvContent = [
            headers,
            ...rows,
        ]
            .map((row) => row.map(escapeCSV).join(','))
            .join('\n');

        const blob = new Blob(
            ['\uFEFF' + csvContent],
            { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `bizflow-inventory-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    // =========================================================
    // FORMATTING
    // =========================================================

    const formatNumber = (value) =>
        Number(value || 0).toLocaleString();

    const formatPrice = (value) =>
        Number(value || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const getStockStatus = (product) => {
        if (product.quantity === 0) return 'Out of Stock';

        if (product.quantity <= product.minimumStockLevel) {
            return 'Low Stock';
        }

        return 'In Stock';
    };

    const getStatusClass = (status) => {
        if (status === 'Out of Stock') {
            return 'bg-red-50 text-red-600';
        }

        if (status === 'Low Stock') {
            return 'bg-orange-50 text-orange-600';
        }

        return 'bg-emerald-50 text-emerald-600';
    };

    // =========================================================
    // STATISTICS CARDS
    // =========================================================

    const statCards = [
        {
            title: 'TOTAL PRODUCTS',
            value: formatNumber(stats.totalProducts),
            icon: Package,
            iconClass: 'bg-blue-50 text-blue-600',
        },
        {
            title: 'AVAILABLE STOCK',
            value: formatNumber(stats.availableProducts),
            icon: CheckCircle2,
            iconClass: 'bg-emerald-50 text-emerald-600',
        },
        {
            title: 'LOW STOCK',
            value: formatNumber(stats.lowStockProducts),
            icon: AlertTriangle,
            iconClass: 'bg-orange-50 text-orange-600',
        },
        {
            title: 'OUT OF STOCK',
            value: formatNumber(stats.outOfStockProducts),
            icon: CircleAlert,
            iconClass: 'bg-red-50 text-red-600',
        },
        {
            title: 'CATEGORIES',
            value: formatNumber(stats.totalCategories),
            icon: Boxes,
            iconClass: 'bg-purple-50 text-purple-600',
        },
        {
            title: 'SUPPLIERS',
            value: formatNumber(stats.totalSuppliers),
            icon: Truck,
            iconClass: 'bg-blue-50 text-blue-600',
        },
    ];

    // =========================================================
    // CHART DATA
    // =========================================================

    const categoryBreakdown = stats.categoryBreakdown || [];

    const maxCategoryUnits = Math.max(
        ...categoryBreakdown.map((item) => item.totalUnits || 0),
        1
    );

    const totalProductsForDistribution =
        stats.totalProducts || 0;

    const healthyPercentage = totalProductsForDistribution > 0
        ? (stats.availableProducts / totalProductsForDistribution) * 100
        : 0;

    const lowPercentage = totalProductsForDistribution > 0
        ? (stats.lowStockProducts / totalProductsForDistribution) * 100
        : 0;

    const outPercentage = totalProductsForDistribution > 0
        ? (stats.outOfStockProducts / totalProductsForDistribution) * 100
        : 0;

    const healthyDegrees = (healthyPercentage / 100) * 360;
    const lowDegrees = (lowPercentage / 100) * 360;
    const outDegrees = (outPercentage / 100) * 360;

    const distributionStyle = {
        background: `conic-gradient(
            #20C76A 0deg ${healthyDegrees}deg,
            #F27A35 ${healthyDegrees}deg ${healthyDegrees + lowDegrees}deg,
            #E04B4B ${healthyDegrees + lowDegrees}deg ${healthyDegrees + lowDegrees + outDegrees}deg
        )`,
    };

    const categoryOptions = useMemo(
        () => stats.categoryNames || [],
        [stats.categoryNames]
    );

    // =========================================================
    // PAGINATION
    // =========================================================

    const totalItems = pagination.totalItems || 0;
    const totalPages = pagination.totalPages || 0;

    const firstItem = totalItems === 0
        ? 0
        : (currentPage - 1) * pageSize + 1;

    const lastItem = Math.min(currentPage * pageSize, totalItems);

    const pageNumbers = Array.from(
        { length: totalPages },
        (_, index) => index + 1
    ).filter((page) => (
        page === 1 ||
        page === totalPages ||
        Math.abs(page - currentPage) <= 1
    ));

    // =========================================================
    // RETURN
    // =========================================================

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">

            <div className="flex h-screen w-full overflow-hidden">

                <ManagerSidebar />

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* HEADER */}

                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-5 lg:px-7">

                        <div className="relative w-64">
                            <Search
                                size={15}
                                strokeWidth={1.8}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                            />

                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        handleApplyFilters();
                                    }
                                }}
                                className="h-9 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-9 pr-4 text-[10px] text-[#343A47] outline-none transition placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-5">

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Bell size={17} strokeWidth={1.7} />
                            </button>

                            <button
                                type="button"
                                aria-label="Help"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <CircleHelp size={17} strokeWidth={1.7} />
                            </button>

                            <div className="h-7 w-px bg-[#E1E4EA]" />

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[10px] font-semibold text-[#242936]">
                                        Manager User
                                    </p>

                                    <p className="text-[8px] font-medium tracking-wide text-[#737A87]">
                                        ENTERPRISE MANAGER
                                    </p>
                                </div>

                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDE5F5] text-[10px] font-semibold text-[#315A9E]">
                                    MU
                                </div>
                            </div>

                        </div>
                    </header>

                    {/* SCROLLABLE CONTENT */}

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">

                        <div className="px-5 py-6 lg:px-7">

                            {/* PAGE HEADER */}

                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                                <div>
                                    <div className="flex items-center gap-2 text-[9px]">
                                        <span className="text-[#343A47]">Home</span>
                                        <span className="text-[#A1A6B0]">›</span>
                                        <span className="font-medium text-[#343A47]">
                                            Inventory Management
                                        </span>
                                    </div>

                                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#171B25]">
                                        Inventory Management
                                    </h2>

                                    <p className="mt-0.5 text-[10px] text-[#69707D]">
                                        Monitor, organize, and maintain inventory records.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={() => loadDashboard(true)}
                                        disabled={refreshing}
                                        title="Refresh inventory"
                                        className="flex h-8 items-center gap-1.5 rounded-md border border-[#D8DCE5] bg-white px-3 text-[10px] font-medium text-[#454B58] transition hover:bg-[#F8F9FC] disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            size={13}
                                            className={refreshing ? 'animate-spin' : ''}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleExport}
                                        className="flex h-8 items-center gap-1.5 rounded-md border border-[#D8DCE5] bg-white px-3 text-[10px] font-medium text-[#454B58] transition hover:bg-[#F8F9FC]"
                                    >
                                        <Download size={13} />
                                        Export
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleAddProduct}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-[#0052CC] px-3 text-[10px] font-medium text-white shadow-sm transition hover:bg-[#0045AD]"
                                    >
                                        <Plus size={13} />
                                        Add Inventory Item
                                    </button>

                                </div>
                            </div>

                            {/* ERROR MESSAGE */}

                            {error && (
                                <div className="mt-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                                    <div className="flex items-start gap-2">
                                        <CircleAlert size={15} className="mt-0.5 shrink-0 text-red-600" />
                                        <p className="text-[10px] text-red-700">{error}</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => loadDashboard(true)}
                                        className="text-[9px] font-semibold text-red-700 underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {/* STATISTICS */}

                            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">

                                {statCards.map((stat) => {
                                    const Icon = stat.icon;

                                    return (
                                        <div
                                            key={stat.title}
                                            className="rounded-lg border border-[#E1E4EA] bg-white p-4 shadow-[0_2px_7px_rgba(15,23,42,0.035)]"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.iconClass}`}>
                                                    <Icon size={15} strokeWidth={1.8} />
                                                </div>
                                            </div>

                                            <p className="mt-4 text-[8px] font-semibold tracking-wide text-[#777E8B]">
                                                {stat.title}
                                            </p>

                                            <p className="mt-1 text-lg font-bold leading-none text-[#171B25]">
                                                {stat.value}
                                            </p>
                                        </div>
                                    );
                                })}

                            </div>

                            {/* FILTER BAR */}

                            <section className="mt-5 rounded-lg border border-[#E1E4EA] bg-white p-4">

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto_auto] xl:items-end">

                                    {/* SEARCH */}

                                    <div>
                                        <label className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                            Search Items
                                        </label>

                                        <div className="relative">
                                            <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A909C]" />

                                            <input
                                                type="text"
                                                placeholder="Product ID or Name..."
                                                value={searchInput}
                                                onChange={(event) => setSearchInput(event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        handleApplyFilters();
                                                    }
                                                }}
                                                className="h-8 w-full rounded-md border border-[#D7DBE5] bg-white pl-8 pr-3 text-[9px] outline-none focus:border-[#7FA4E8]"
                                            />
                                        </div>
                                    </div>

                                    {/* CATEGORY */}

                                    <div>
                                        <label className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                            Category
                                        </label>

                                        <div className="relative">
                                            <select
                                                value={selectedCategory}
                                                onChange={(event) => {
                                                    setSelectedCategory(event.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="h-8 w-full appearance-none rounded-md border border-[#D7DBE5] bg-white px-3 pr-8 text-[9px] text-[#343A47] outline-none focus:border-[#7FA4E8]"
                                            >
                                                <option value="all">All Categories</option>

                                                {categoryOptions.map((category) => (
                                                    <option key={category} value={category}>
                                                        {category}
                                                    </option>
                                                ))}
                                            </select>

                                            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737A87]" />
                                        </div>
                                    </div>

                                    {/* STOCK STATUS */}

                                    <div>
                                        <label className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                            Stock Status
                                        </label>

                                        <div className="relative">
                                            <select
                                                value={selectedStatus}
                                                onChange={(event) => {
                                                    setSelectedStatus(event.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="h-8 w-full appearance-none rounded-md border border-[#D7DBE5] bg-white px-3 pr-8 text-[9px] text-[#343A47] outline-none focus:border-[#7FA4E8]"
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="In Stock">In Stock</option>
                                                <option value="Low Stock">Low Stock</option>
                                                <option value="Out of Stock">Out of Stock</option>
                                            </select>

                                            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737A87]" />
                                        </div>
                                    </div>

                                    {/* SORT */}

                                    <div>
                                        <label className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-[#69707D]">
                                            Sort By
                                        </label>

                                        <div className="relative">
                                            <select
                                                value={sortBy}
                                                onChange={(event) => handleSortChange(event.target.value)}
                                                className="h-8 w-full appearance-none rounded-md border border-[#D7DBE5] bg-white px-3 pr-8 text-[9px] text-[#343A47] outline-none focus:border-[#7FA4E8]"
                                            >
                                                <option value="productName">Product Name</option>
                                                <option value="productId">Product ID</option>
                                                <option value="price">Price</option>
                                                <option value="quantity">Stock</option>
                                                <option value="category">Category</option>
                                                <option value="createdAt">Date Added</option>
                                            </select>

                                            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737A87]" />
                                        </div>
                                    </div>

                                    {/* APPLY */}

                                    <button
                                        type="button"
                                        onClick={handleApplyFilters}
                                        className="h-8 rounded-md bg-[#0052CC] px-5 text-[9px] font-semibold text-white transition hover:bg-[#0045AD]"
                                    >
                                        Apply
                                    </button>

                                    {/* RESET */}

                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        title="Reset filters"
                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D7DBE5] bg-white text-[#59606E] transition hover:bg-[#F5F6F9]"
                                    >
                                        <RotateCcw size={12} />
                                    </button>

                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-[8px] text-[#858B97]">
                                        Sort direction: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSortOrder((previous) => previous === 'asc' ? 'desc' : 'asc');
                                            setCurrentPage(1);
                                        }}
                                        className="text-[8px] font-semibold text-[#0757C9] hover:underline"
                                    >
                                        Change direction
                                    </button>
                                </div>

                            </section>

                            {/* MAIN INVENTORY GRID */}

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_210px]">

                                {/* PRODUCT TABLE */}

                                <section className="overflow-hidden rounded-lg border border-[#E1E4EA] bg-white">

                                    <div className="overflow-x-auto">

                                        <div className="min-w-262.5">

                                            {/* TABLE HEADER */}

                                            <div className="grid grid-cols-[1.5fr_100px_110px_100px_70px_90px_100px] items-center bg-[#F7F8FC] px-5 py-4">
                                                {[
                                                    'Product',
                                                    'ID',
                                                    'Category',
                                                    'Price',
                                                    'Stock',
                                                    'Status',
                                                    'Actions',
                                                ].map((heading, index) => (
                                                    <span
                                                        key={`${heading}-${index}`}
                                                        className="text-[9px] font-semibold uppercase tracking-wide text-[#68707D]"
                                                    >
                                                        {heading}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* LOADING */}

                                            {loading && (
                                                <div className="flex min-h-48 items-center justify-center gap-2 text-[10px] text-[#737A87]">
                                                    <RefreshCw size={14} className="animate-spin" />
                                                    Loading inventory...
                                                </div>
                                            )}

                                            {/* EMPTY STATE */}

                                            {!loading && products.length === 0 && (
                                                <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">

                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F4FA]">
                                                        <Package size={22} className="text-[#8A94A6]" />
                                                    </div>

                                                    <h3 className="mt-3 text-[11px] font-semibold text-[#343A47]">
                                                        {search || selectedCategory !== 'all' || selectedStatus !== 'all'
                                                            ? 'No matching products found'
                                                            : 'No inventory products yet'}
                                                    </h3>

                                                    <p className="mt-1 max-w-xs text-[9px] text-[#858B97]">
                                                        {search || selectedCategory !== 'all' || selectedStatus !== 'all'
                                                            ? 'Try changing your search or filters.'
                                                            : 'Start building your inventory by adding your first product.'}
                                                    </p>

                                                    {search || selectedCategory !== 'all' || selectedStatus !== 'all' ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleResetFilters}
                                                            className="mt-3 text-[9px] font-semibold text-[#0757C9]"
                                                        >
                                                            Clear filters
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={handleAddProduct}
                                                            className="mt-3 flex h-8 items-center gap-1.5 rounded-md bg-[#0052CC] px-3 text-[9px] font-semibold text-white hover:bg-[#0045AD]"
                                                        >
                                                            <Plus size={12} />
                                                            Add First Product
                                                        </button>
                                                    )}

                                                </div>
                                            )}

                                            {/* PRODUCT ROWS */}


                                            {/* PRODUCT ROWS */}

                                            {!loading && products.map((product) => {
                                                const status = product.stockStatus || getStockStatus(product);

                                                return (
                                                    <div
                                                        key={product._id}
                                                        className="grid grid-cols-[1.5fr_100px_110px_100px_70px_90px_100px] items-center border-t border-[#ECEEF2] px-5 py-4 transition hover:bg-[#FBFCFE]"
                                                    >
                                                        {/* PRODUCT IMAGE AND NAME */}
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E8EBF1] bg-[#F5F7FA]">
                                                                {product.imageUrl ? (
                                                                    <>
                                                                        <img
                                                                            src={product.imageUrl}
                                                                            alt={product.productName}
                                                                            className="h-full w-full object-cover"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                                            }}
                                                                        />

                                                                        <Package
                                                                            size={20}
                                                                            className="hidden text-[#8A94A6]"
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <Package
                                                                        size={20}
                                                                        className="text-[#8A94A6]"
                                                                    />
                                                                )}
                                                            </div>

                                                            <span className="truncate text-[10px] font-semibold text-[#343A47]">
                                                                {product.productName}
                                                            </span>
                                                        </div>

                                                        {/* PRODUCT ID */}
                                                        <span className="text-[9px] text-[#7A808C]">
                                                            #{product.productId}
                                                        </span>

                                                        {/* CATEGORY */}
                                                        <span className="truncate pr-2 text-[9px] text-[#59606E]">
                                                            {product.category}
                                                        </span>

                                                        {/* PRICE */}
                                                        <span className="text-[10px] font-semibold text-[#242936]">
                                                            {formatPrice(product.price)}
                                                        </span>

                                                        {/* STOCK */}
                                                        <span className="text-[9px] font-medium text-[#343A47]">
                                                            {formatNumber(product.quantity)}
                                                        </span>

                                                        {/* STATUS */}
                                                        <span
                                                            className={`w-fit rounded-full px-2.5 py-1.5 text-[8px] font-semibold ${getStatusClass(status)}`}
                                                        >
                                                            {status.toUpperCase()}
                                                        </span>

                                                        {/* ACTION BUTTONS */}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                aria-label={`View ${product.productName}`}
                                                                title="View Product"
                                                                onClick={() => handleViewProduct(product._id)}
                                                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DCE3EF] bg-white text-[#59606E] transition hover:border-[#0757C9] hover:bg-[#F0F5FF] hover:text-[#0757C9]"
                                                            >
                                                                <Eye size={14} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                aria-label={`Edit ${product.productName}`}
                                                                title="Edit Product"
                                                                onClick={() => handleEditProduct(product._id)}
                                                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DCE3EF] bg-white text-[#59606E] transition hover:border-[#0757C9] hover:bg-[#F0F5FF] hover:text-[#0757C9]"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}


                                            {/* PAGINATION */}

                                            {!loading && (
                                                <div className="flex flex-col gap-3 border-t border-[#E1E4EA] bg-[#FAFBFD] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                                                    <span className="text-[8px] text-[#7A808C]">
                                                        Showing {firstItem}–{lastItem} of {formatNumber(totalItems)} items
                                                    </span>

                                                    <div className="flex flex-wrap items-center gap-1">

                                                        <button
                                                            type="button"
                                                            disabled={currentPage <= 1}
                                                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                                            className="flex h-6 items-center gap-1 rounded border border-[#D7DBE5] px-2 text-[8px] text-[#737A87] disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            <ChevronLeft size={11} />
                                                            Previous
                                                        </button>

                                                        {pageNumbers.map((page, index) => (
                                                            <div key={page} className="flex items-center gap-1">

                                                                {index > 0 && page - pageNumbers[index - 1] > 1 && (
                                                                    <span className="px-1 text-[8px] text-[#858B97]">
                                                                        ...
                                                                    </span>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => setCurrentPage(page)}
                                                                    className={`flex h-6 w-6 items-center justify-center rounded text-[8px] ${currentPage === page
                                                                            ? 'bg-[#0052CC] font-semibold text-white'
                                                                            : 'border border-[#D7DBE5] text-[#59606E]'
                                                                        }`}
                                                                >
                                                                    {page}
                                                                </button>

                                                            </div>
                                                        ))}

                                                        <button
                                                            type="button"
                                                            disabled={currentPage >= totalPages || totalPages === 0}
                                                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                                            className="flex h-6 items-center gap-1 rounded border border-[#D7DBE5] px-2 text-[8px] text-[#737A87] disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            Next
                                                            <ChevronRight size={11} />
                                                        </button>

                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </section>

                                {/* RIGHT ALERT COLUMN */}

                                <div className="space-y-4">

                                    {/* LOW STOCK ALERTS */}

                                    <section className="overflow-hidden rounded-lg border border-[#E1E4EA] bg-white">

                                        <div className="flex items-center justify-between bg-[#FFF7EA] px-4 py-3">

                                            <div className="flex items-center gap-2">
                                                <AlertTriangle size={13} className="text-[#C25A00]" />

                                                <h3 className="text-[9px] font-semibold text-[#934500]">
                                                    Stock Alerts
                                                </h3>
                                            </div>

                                            <span className="rounded bg-[#FFE0B0] px-1.5 py-0.5 text-[7px] font-semibold text-[#9A5000]">
                                                {formatNumber(stockAlerts.length)} ITEMS
                                            </span>

                                        </div>

                                        <div className="p-4">

                                            {stockAlerts.length === 0 ? (
                                                <div className="py-5 text-center">
                                                    <CheckCircle2 size={22} className="mx-auto text-emerald-500" />

                                                    <p className="mt-2 text-[9px] font-medium text-[#343A47]">
                                                        No stock alerts
                                                    </p>

                                                    <p className="mt-1 text-[7px] text-[#858B97]">
                                                        All inventory items are above their minimum stock levels.
                                                    </p>
                                                </div>
                                            ) : (
                                                stockAlerts.slice(0, 5).map((alert, index) => {
                                                    const status = getStockStatus(alert);

                                                    const isOutOfStock = status === 'Out of Stock';

                                                    return (
                                                        <div
                                                            key={alert._id}
                                                            className={index > 0 ? 'mt-4 border-t border-[#ECEEF2] pt-4' : ''}
                                                        >

                                                            <div className="flex items-start justify-between gap-2">

                                                                <div className="min-w-0">
                                                                    <p className="truncate text-[9px] font-semibold text-[#343A47]">
                                                                        {alert.productName}
                                                                    </p>

                                                                    <p className="mt-1 text-[7px] text-[#858B97]">
                                                                        Category: {alert.category}
                                                                    </p>
                                                                </div>

                                                                <span className={`rounded px-1.5 py-0.5 text-[6px] font-bold ${isOutOfStock
                                                                        ? 'bg-red-50 text-red-600'
                                                                        : 'bg-orange-50 text-orange-600'
                                                                    }`}>
                                                                    {isOutOfStock ? 'OUT' : 'LOW'}
                                                                </span>

                                                            </div>

                                                            <div className="mt-2 flex items-center justify-between gap-1">

                                                                <span className="text-[7px] text-[#59606E]">
                                                                    Current: {alert.quantity}
                                                                </span>

                                                                <span className="text-[7px] text-[#59606E]">
                                                                    Min: {alert.minimumStockLevel}
                                                                </span>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditProduct(alert._id)}
                                                                    className="text-[7px] font-semibold text-[#0757C9]"
                                                                >
                                                                    Restock
                                                                </button>

                                                            </div>

                                                        </div>
                                                    );
                                                })
                                            )}

                                            {stockAlerts.length > 5 && (
                                                <p className="mt-4 text-center text-[8px] text-[#858B97]">
                                                    Showing 5 of {stockAlerts.length} alerts
                                                </p>
                                            )}

                                        </div>

                                    </section>

                                    {/* QUICK ACTIONS */}

                                    <section className="grid grid-cols-2 gap-2">

                                        <button
                                            type="button"
                                            onClick={handleAddProduct}
                                            className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-[#E1E4EA] bg-white text-[#343A47] transition hover:border-[#C8D5F2] hover:bg-[#FBFCFF]"
                                        >
                                            <Plus size={14} className="text-[#0757C9]" />
                                            <span className="text-[7px] font-medium">Add Product</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => loadDashboard(true)}
                                            className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-[#E1E4EA] bg-white text-[#343A47] transition hover:border-[#C8D5F2] hover:bg-[#FBFCFF]"
                                        >
                                            <RefreshCw size={14} className="text-[#0757C9]" />
                                            <span className="text-[7px] font-medium">Update View</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleExport}
                                            className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-[#E1E4EA] bg-white text-[#343A47] transition hover:border-[#C8D5F2] hover:bg-[#FBFCFF]"
                                        >
                                            <BarChart3 size={14} className="text-[#0757C9]" />
                                            <span className="text-[7px] font-medium">Export Data</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedStatus('Low Stock');
                                                setCurrentPage(1);
                                            }}
                                            className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-[#E1E4EA] bg-white text-[#343A47] transition hover:border-[#C8D5F2] hover:bg-[#FBFCFF]"
                                        >
                                            <CircleAlert size={14} className="text-[#0757C9]" />
                                            <span className="text-[7px] font-medium">View Low Stock</span>
                                        </button>

                                    </section>

                                </div>
                            </div>

                            {/* LOWER ANALYTICS */}

                            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr]">

                                {/* STOCK BY CATEGORY */}

                                <section className="rounded-lg border border-[#E1E4EA] bg-white p-4">

                                    <h3 className="text-[10px] font-semibold text-[#242936]">
                                        Stock by Category
                                    </h3>

                                    {categoryBreakdown.length === 0 ? (
                                        <div className="flex h-36 flex-col items-center justify-center text-center">
                                            <Boxes size={22} className="text-[#A1A6B0]" />
                                            <p className="mt-2 text-[8px] text-[#858B97]">
                                                Category data will appear here.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-5 flex h-36 items-end justify-around gap-3 px-2">

                                            {categoryBreakdown.slice(0, 6).map((category) => {
                                                const height = Math.max(
                                                    4,
                                                    (category.totalUnits / maxCategoryUnits) * 100
                                                );

                                                return (
                                                    <div
                                                        key={category._id}
                                                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                                                        title={`${category._id}: ${formatNumber(category.totalUnits)} units`}
                                                    >

                                                        <span className="mb-1 text-[7px] text-[#59606E]">
                                                            {formatNumber(category.totalUnits)}
                                                        </span>

                                                        <div
                                                            className="w-7 max-w-full rounded-t bg-[#CADAF4]"
                                                            style={{ height: `${height}%` }}
                                                        />

                                                        <span className="mt-2 w-full truncate text-center text-[7px] text-[#737A87]">
                                                            {category._id}
                                                        </span>

                                                    </div>
                                                );
                                            })}

                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center justify-between text-[7px] text-[#858B97]">
                                        <span>Units in Storage</span>
                                        <span>Total: {formatNumber(stats.totalStockUnits)}</span>
                                    </div>

                                </section>

                                {/* INVENTORY DISTRIBUTION */}

                                <section className="rounded-lg border border-[#E1E4EA] bg-white p-4">

                                    <h3 className="text-[10px] font-semibold text-[#242936]">
                                        Inventory Distribution
                                    </h3>

                                    <div className="mt-4 flex items-center justify-center">

                                        <div
                                            className="relative flex h-24 w-24 items-center justify-center rounded-full"
                                            style={distributionStyle}
                                        >

                                            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white">

                                                <span className="text-sm font-bold text-[#242936]">
                                                    {healthyPercentage.toFixed(0)}%
                                                </span>

                                                <span className="text-[6px] uppercase text-[#858B97]">
                                                    Healthy
                                                </span>

                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap justify-center gap-4">

                                        <span className="flex items-center gap-1 text-[7px] text-[#59606E]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#20C76A]" />
                                            Normal ({healthyPercentage.toFixed(1)}%)
                                        </span>

                                        <span className="flex items-center gap-1 text-[7px] text-[#59606E]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#F27A35]" />
                                            Low ({lowPercentage.toFixed(1)}%)
                                        </span>

                                        <span className="flex items-center gap-1 text-[7px] text-[#59606E]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#E04B4B]" />
                                            Out ({outPercentage.toFixed(1)}%)
                                        </span>

                                    </div>

                                    <p className="mt-3 text-center text-[7px] text-[#858B97]">
                                        Based on {formatNumber(totalProductsForDistribution)} products
                                    </p>

                                </section>

                                {/* RECENT ACTIVITY */}

                                <section className="rounded-lg border border-[#E1E4EA] bg-white p-4">

                                    <div className="flex items-center gap-2">
                                        <RotateCcw size={13} className="text-[#0757C9]" />

                                        <h3 className="text-[10px] font-semibold text-[#242936]">
                                            Recent Activity
                                        </h3>
                                    </div>

                                    <div className="mt-4 flex min-h-28 flex-col items-center justify-center text-center">

                                        <Database size={21} className="text-[#A1A6B0]" />

                                        <p className="mt-2 text-[9px] font-medium text-[#59606E]">
                                            Activity history not connected
                                        </p>

                                        <p className="mt-1 max-w-xs text-[7px] text-[#858B97]">
                                            Inventory activity will appear here when audit logging is connected to inventory operations.
                                        </p>

                                    </div>

                                </section>

                            </div>

                            {/* BOTTOM ACTIONS */}

                            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">

                                <button
                                    type="button"
                                    onClick={handleExport}
                                    className="flex h-8 items-center gap-1.5 rounded-md bg-[#356FE5] px-3 text-[8px] font-semibold text-white transition hover:bg-[#285CC7]"
                                >
                                    <FileText size={12} />
                                    Export Current Page
                                </button>

                                <button
                                    type="button"
                                    onClick={handleExport}
                                    className="flex h-8 items-center gap-1.5 rounded-md bg-[#3B82F6] px-3 text-[8px] font-semibold text-white transition hover:bg-[#2563EB]"
                                >
                                    <Download size={12} />
                                    Download CSV
                                </button>

                                <button
                                    type="button"
                                    onClick={() => loadDashboard(true)}
                                    disabled={refreshing}
                                    className="flex h-8 items-center gap-1.5 rounded-md bg-[#6ACB75] px-3 text-[8px] font-semibold text-white transition hover:bg-[#52B95F] disabled:opacity-50"
                                >
                                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                                    Refresh Data
                                </button>

                            </div>

                            {/* FOOTER */}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">

                                <div className="flex flex-col gap-3 text-[8px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">

                                    <p>
                                        © 2026 Business Process Automation System | Cloud-Based SaaS Platform
                                    </p>

                                    <div className="flex gap-5 text-[#343A47]">
                                        <button type="button">Privacy Policy</button>
                                        <button type="button">Terms of Service</button>
                                        <button type="button">Compliance</button>
                                    </div>

                                </div>

                            </footer>

                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default InventoryManagement;
