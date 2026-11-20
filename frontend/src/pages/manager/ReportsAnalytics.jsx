import ManagerSidebar from '../../components/sidebar/ManagerSidebar'
import { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Bell,
    //ChevronDown,
    CircleHelp,
    Download,
    FileBarChart,
    FileSpreadsheet,
    //Filter,
    Package,
    Printer,
    Search,
    Settings,
    Share2,
    ShoppingCart,
    Target,
    TrendingUp,
    Warehouse,
    Zap,
} from 'lucide-react'

function ReportsAnalytics() {

    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await api.get('/analytics');

                setAnalytics(response?.data ?? null);
            } catch (err) {
                setError(err.message || 'Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2,
        }).format(value || 0);

    const formatNumber = (value) =>
        new Intl.NumberFormat('en-US').format(value || 0);

    const formatPercentage = (value) =>
        `${Number(value || 0) > 0 ? '+' : ''}${Number(value || 0).toFixed(1)}%`;

    
    const summary = analytics?.summary;

    const stats = [
        {
            title: 'TOTAL REVENUE',
            value: formatCurrency(summary?.totalRevenue),
            icon: FileBarChart,
            iconClass: 'bg-blue-50 text-blue-600',
            borderClass: 'border-blue-600',
            trend: formatPercentage(summary?.revenueGrowth),
            trendClass:
                (summary?.revenueGrowth || 0) >= 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600',
        },
        {
            title: 'TOTAL SALES',
            value: formatNumber(summary?.totalSales),
            icon: ShoppingCart,
            iconClass: 'bg-slate-50 text-slate-600',
            borderClass: 'border-slate-400',
            trend: formatPercentage(summary?.salesGrowth),
            trendClass:
                (summary?.salesGrowth || 0) >= 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600',
        },
        {
            title: 'INVENTORY VALUE',
            value: formatCurrency(summary?.inventoryValue),
            icon: Warehouse,
            iconClass: 'bg-orange-50 text-orange-600',
            borderClass: 'border-orange-700',
            badge: 'Current',
            badgeClass: 'bg-slate-100 text-slate-600',
        },
        {
            title: 'COMPLETED TASKS',
            value: formatNumber(summary?.completedTasks),
            icon: Target,
            iconClass: 'bg-blue-50 text-blue-600',
            borderClass: 'border-indigo-200',
            badge: `${formatNumber(summary?.totalTasks)} Total`,
            badgeClass: 'bg-slate-100 text-slate-600',
        },
        {
            title: 'LOW STOCK ITEMS',
            value: formatNumber(summary?.lowStockItems),
            icon: Package,
            iconClass: 'bg-red-50 text-red-600',
            borderClass: 'border-red-600',
            badge: 'Attention',
            badgeClass: 'bg-red-50 text-red-600',
        },
        {
            title: 'BUSINESS GROWTH',
            value: formatPercentage(summary?.revenueGrowth),
            icon: TrendingUp,
            iconClass: 'bg-indigo-50 text-indigo-600',
            borderClass: 'border-indigo-200',
            trend: formatPercentage(summary?.salesGrowth),
            trendClass: 'bg-emerald-50 text-emerald-600',
        },
    ];

    // const revenueBars = [31, 43, 38, 53, 60, 55, 69, 78, 72, 88]

    
    
    const categoryColors = [
        'bg-[#0757C9]',
        'bg-[#51699D]',
        'bg-[#A94B18]',
        'bg-[#18A957]',
        'bg-[#7C3AED]',
    ];

    const revenueCategories = (analytics?.revenueByCategory || []).map(
        (item, index, items) => {
            const maximumRevenue = Math.max(
                ...items.map((category) => category.revenue || 0),
                1
            );

            return {
                name: item._id || 'Uncategorized',
                value: formatCurrency(item.revenue),
                percentage: `${Math.max(
                    0,
                    Math.min(100, (item.revenue / maximumRevenue) * 100)
                )}%`,
                barClass: categoryColors[index % categoryColors.length],
            };
        }
    );


    const products = (analytics?.topProducts || []).map((product) => ({
        name: product.productName || 'Unknown Product',
        category: 'Product',
        units: formatNumber(product.unitsSold),
        revenue: formatCurrency(product.revenue),
        margin: 'N/A',
    }));


    const monthlyRevenue = analytics?.monthlyRevenue || [];

    const chartPoints = monthlyRevenue.map((item, index) => ({
        x: monthlyRevenue.length > 1
            ? 20 + (index * 670) / (monthlyRevenue.length - 1)
            : 400,
        y: 215 - (
            (item.revenue /
                Math.max(...monthlyRevenue.map((month) => month.revenue), 1)
            ) * 190
        ),
    }));

    const revenueChartPath = chartPoints.reduce((path, point, index) => {
        if (index === 0) {
            return `M ${point.x} ${point.y}`;
        }

        const previous = chartPoints[index - 1];
        const middleX = (previous.x + point.x) / 2;

        return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    const inventoryDistribution = analytics?.inventoryDistribution || [];

    const totalInventoryProducts = inventoryDistribution.reduce(
        (total, item) => total + item.count,
        0
    );

    const getInventoryCount = (status) =>
        inventoryDistribution.find((item) => item.status === status)?.count || 0;

    const availableCount = getInventoryCount('Available');
    const lowStockCount = getInventoryCount('Low Stock');
    const outOfStockCount = getInventoryCount('Out of Stock');

    const availablePercentage = totalInventoryProducts
        ? (availableCount / totalInventoryProducts) * 100
        : 0;

    const lowStockPercentage = totalInventoryProducts
        ? (lowStockCount / totalInventoryProducts) * 100
        : 0;

    const availableDegrees = availablePercentage * 3.6;
    const lowStockDegrees = lowStockPercentage * 3.6;


    const taskCompletionRate =
        analytics?.taskSummary?.totalTasks > 0
            ? analytics.summary.taskCompletionRate
            : 0;

    const taskCompletionDegrees = taskCompletionRate * 3.6;

    const taskTarget = 85;

    const taskGap = taskCompletionRate - taskTarget;


    const reports = [
        {
            name: 'Q3_Financial_Summary.pdf',
            generatedBy: 'System Admin',
            date: '24 Oct, 09:45 AM',
            status: 'COMPLETED',
            type: 'pdf',
        },
        {
            name: 'Inventory_Log_Weekly.xlsx',
            generatedBy: 'L. Roberts',
            date: '23 Oct, 04:20 PM',
            status: 'PENDING',
            type: 'excel',
        },
        {
            name: 'Perf_Audit_Internal.pdf',
            generatedBy: 'J. Chen',
            date: '22 Oct, 11:30 AM',
            status: 'COMPLETED',
            type: 'pdf',
        },
    ]

    const handleGenerateReport = () => {
        if (!analytics) return;

        const escapeCsv = (value) => {
            const text = String(value ?? '');
            return `"${text.replace(/"/g, '""')}"`;
        };

        const rows = [
            ['BIZFLOW - BUSINESS ANALYTICS REPORT'],
            ['Generated At', new Date().toLocaleString()],
            [],

            ['BUSINESS SUMMARY'],
            ['Metric', 'Value'],
            ['Total Revenue', summary?.totalRevenue ?? 0],
            ['Total Sales', summary?.totalSales ?? 0],
            ['Inventory Value', summary?.inventoryValue ?? 0],
            ['Total Products', summary?.totalProducts ?? 0],
            ['Total Stock Units', summary?.totalStockUnits ?? 0],
            ['Low Stock Items', summary?.lowStockItems ?? 0],
            ['Out of Stock Items', summary?.outOfStockItems ?? 0],
            ['Completed Tasks', summary?.completedTasks ?? 0],
            ['Total Tasks', summary?.totalTasks ?? 0],
            ['Task Completion Rate (%)', summary?.taskCompletionRate ?? 0],
            ['Revenue Growth (%)', summary?.revenueGrowth ?? 0],
            ['Sales Growth (%)', summary?.salesGrowth ?? 0],
            [],

            ['MONTHLY REVENUE'],
            ['Month', 'Year', 'Revenue', 'Sales'],
            ...(analytics.monthlyRevenue || []).map((item) => [
                item.label,
                item.year,
                item.revenue,
                item.sales,
            ]),
            [],

            ['INVENTORY DISTRIBUTION'],
            ['Status', 'Products', 'Stock Units'],
            ...(analytics.inventoryDistribution || []).map((item) => [
                item.status,
                item.count,
                item.units,
            ]),
            [],

            ['REVENUE BY CATEGORY'],
            ['Category', 'Revenue', 'Units Sold'],
            ...(analytics.revenueByCategory || []).map((item) => [
                item._id || 'Uncategorized',
                item.revenue,
                item.unitsSold,
            ]),
            [],

            ['TOP-SELLING PRODUCTS'],
            ['Product', 'Units Sold', 'Revenue'],
            ...(analytics.topProducts || []).map((item) => [
                item.productName,
                item.unitsSold,
                item.revenue,
            ]),
            [],

            ['RECENT SYSTEM ACTIVITY'],
            ['Action', 'Description', 'Module', 'User', 'Date'],
            ...(analytics.recentActivity || []).map((item) => [
                item.action,
                item.description,
                item.module,
                item.userName,
                item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : '',
            ]),
        ];

        const csvContent = [
            '\uFEFF',
            rows.map((row) => row.map(escapeCsv).join(',')).join('\n'),
        ].join('');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-');

        link.href = url;
        link.download = `BizFlow_Analytics_Report_${timestamp}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const activityItems = (analytics?.recentActivity || []).map(
        (activity, index) => ({
            title: activity.action || 'System Activity',
            description:
                activity.description ||
                `${activity.module || 'System'} activity recorded by ${activity.userName || 'Unknown User'
                }.`,
            time: activity.createdAt
                ? new Date(activity.createdAt).toLocaleString()
                : 'Recently',
            icon: FileBarChart,
            iconClass:
                index === 0
                    ? 'bg-blue-50 text-blue-600'
                    : index === 1
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-slate-100 text-slate-600',
        })
    );

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

                    {/* HEADER */}

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

                        {/* Header right */}

                        <div className="flex items-center gap-5">
                            <button
                                type="button"
                                aria-label="Messages"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <FileBarChart
                                    size={18}
                                    strokeWidth={1.7}
                                />
                            </button>

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
                                aria-label="Settings"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Settings
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
                                AM
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

                            {loading && (
                                <div className="mb-4 rounded-md border border-[#D9DDE6] bg-white p-4 text-xs text-[#59606E]">
                                    Loading business analytics...
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* PAGE HEADER */}

                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            /
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            Reports & Analytics
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
                                        Reports & Analytics
                                    </h2>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Analyze business performance using real-time reports and interactive dashboards.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleGenerateReport}
                                        disabled={loading || !analytics}
                                        className="
                                        flex
                                        h-10
                                        items-center
                                        gap-2
                                        rounded-md
                                        bg-[#0757C9]
                                        px-4
                                        text-xs
                                        font-medium
                                        text-white
                                        shadow-sm
                                        transition
                                        hover:bg-[#0045AD]
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                    >
                                        <FileBarChart
                                            size={15}
                                            strokeWidth={1.8}
                                        />

                                        {loading ? 'Loading Report...' : 'Generate Report'}
                                    </button>
                                </div>
                            </div>

                            {/* STATISTICS */}

                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
                                {stats.map((stat) => {
                                    const Icon = stat.icon

                                    return (
                                        <div
                                            key={stat.title}
                                            className={`
                                                relative
                                                min-h-28
                                                rounded-lg
                                                border
                                                border-[#E2E5EB]
                                                border-l-[3px]
                                                ${stat.borderClass}
                                                bg-white
                                                p-4
                                                shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                            `}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className={`
                                                        flex
                                                        h-9
                                                        w-9
                                                        items-center
                                                        justify-center
                                                        rounded-md
                                                        ${stat.iconClass}
                                                    `}
                                                >
                                                    <Icon
                                                        size={17}
                                                        strokeWidth={1.8}
                                                    />
                                                </div>

                                                {stat.trend && (
                                                    <span
                                                        className={`
                                                            rounded
                                                            px-2
                                                            py-1
                                                            text-[9px]
                                                            font-semibold
                                                            ${stat.trendClass}
                                                        `}
                                                    >
                                                        ↗ {stat.trend}
                                                    </span>
                                                )}

                                                {stat.badge && (
                                                    <span
                                                        className={`
                                                            rounded
                                                            px-2
                                                            py-1
                                                            text-[9px]
                                                            font-semibold
                                                            ${stat.badgeClass}
                                                        `}
                                                    >
                                                        {stat.badge}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-4 text-[9px] font-semibold text-[#68707D]">
                                                {stat.title}
                                            </p>

                                            <p className="mt-1 text-xl font-bold text-[#171B25]">
                                                {stat.value}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* =================================================
                                MAIN ANALYTICS GRID
                            ================================================== */}

                            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">

                                {/* SALES CHART */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Monthly Sales Revenue
                                            </h3>

                                            <p className="mt-1 text-[10px] text-[#737A87]">
                                                Comparative performance analysis across previous 6 months
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="rounded-md bg-[#0757C9] px-3 py-1.5 text-[9px] font-semibold text-white"
                                            >
                                                Line
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded-md px-3 py-1.5 text-[9px] font-medium text-[#59606E]"
                                            >
                                                Area
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        className="
                                            relative
                                            mt-4
                                            h-52
                                            overflow-hidden
                                            rounded-md
                                            border
                                            border-dashed
                                            border-[#CBD2DE]
                                            bg-white
                                        "
                                    >
                                        {/* Grid lines */}

                                        <div className="absolute inset-0 flex flex-col justify-between px-3 py-5">
                                            <span className="border-t border-[#F0F1F5]" />
                                            <span className="border-t border-[#F0F1F5]" />
                                            <span className="border-t border-[#F0F1F5]" />
                                            <span className="border-t border-[#F0F1F5]" />
                                        </div>

                                        {/* SVG Line Chart */}

                                        <svg
                                            viewBox="0 0 800 260"
                                            className="absolute inset-0 h-full w-full"
                                            preserveAspectRatio="none"
                                        >
                                            <path
                                                d={revenueChartPath}
                                                fill="none"
                                                stroke="#2864E8"
                                                strokeWidth="3"
                                            />

                                            {chartPoints.map((point, index) => (
                                                <circle
                                                    key={index}
                                                    cx={point.x}
                                                    cy={point.y}
                                                    r="4"
                                                    fill="#2864E8"
                                                />
                                            ))}
                                        </svg>
                                    </div>
                                </section>

                                {/* INVENTORY DISTRIBUTION */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-[#FAFBFF]
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    "
                                >
                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Inventory Distribution
                                    </h3>

                                    <div className="mt-5 flex items-center gap-4">
                                        <div
                                            className="
                                                flex
                                                h-20
                                                w-20
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                            "
                                            style={{
                                                background: `conic-gradient(
                                                #315FEA 0deg ${availableDegrees}deg,
                                                #C9D3F4 ${availableDegrees}deg ${availableDegrees + lowStockDegrees}deg,
                                                #D32929 ${availableDegrees + lowStockDegrees}deg 360deg
                                            )`,
                                            }}
                                        >
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAFBFF]">
                                                <span className="text-lg font-bold text-[#343A47]">
                                                    {Math.round(availablePercentage)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="flex items-center gap-2 text-[10px] font-medium text-[#343A47]">
                                                <span className="h-2 w-2 rounded-full bg-[#0757C9]" />
                                                Available ({availableCount})
                                            </p>

                                            <p className="flex items-center gap-2 text-[10px] font-medium text-[#343A47]">
                                                <span className="h-2 w-2 rounded-full bg-[#C9D3F4]" />
                                                Low Stock ({lowStockCount})
                                            </p>

                                            <p className="flex items-center gap-2 text-[10px] font-medium text-[#343A47]">
                                                <span className="h-2 w-2 rounded-full bg-[#D32929]" />
                                                Out of Stock ({outOfStockCount})
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <p className="text-[9px] font-semibold text-[#59606E]">
                                            STOCK AVAILABILITY
                                        </p>

                                        <div className="mt-3">
                                            <div className="flex justify-between text-[9px]">
                                                <span className="text-[#59606E]">
                                                    Cloud Server Nodes
                                                </span>

                                                <span className="font-semibold text-[#343A47]">
                                                    92%
                                                </span>
                                            </div>

                                            <div className="mt-1 h-1 rounded-full bg-[#E7EAF0]">
                                                <div className="h-full w-[92%] rounded-full bg-[#22B96C]" />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between text-[9px]">
                                                <span className="text-[#59606E]">
                                                    User Licenses
                                                </span>

                                                <span className="font-semibold text-[#343A47]">
                                                    45%
                                                </span>
                                            </div>

                                            <div className="mt-1 h-1 rounded-full bg-[#E7EAF0]">
                                                <div className="h-full w-[45%] rounded-full bg-[#F0B400]" />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* =================================================
                                REVENUE + TASK + INSIGHTS
                            ================================================== */}

                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_.75fr_1fr]">

                                {/* REVENUE BY CATEGORY */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                        p-5
                                    "
                                >
                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Revenue by Category
                                    </h3>

                                    <div className="mt-5 space-y-5">
                                        {revenueCategories.map((item) => (
                                            <div key={item.name}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-medium text-[#4C5360]">
                                                        {item.name}
                                                    </span>

                                                    <span className="text-[10px] font-semibold text-[#0757C9]">
                                                        {item.value}
                                                    </span>
                                                </div>

                                                <div className="mt-2 h-1.5 rounded-full bg-[#E6E9F0]">
                                                    <div
                                                        className={`h-full rounded-full ${item.barClass}`}
                                                        style={{
                                                            width: item.percentage,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* TASK COMPLETION */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                        p-5
                                    "
                                >
                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Task Completion Rate
                                    </h3>

                                    <div className="mt-5 flex justify-center">
                                        <div
                                            className="
                                                flex
                                                h-24
                                                w-24
                                                items-center
                                                justify-center
                                                rounded-full
                                            
                                            "
                                            style={{
                                                background: `conic-gradient(
                                                #2864E8 0deg ${taskCompletionDegrees}deg,
                                                #E2E7F2 ${taskCompletionDegrees}deg 360deg
                                            )`,
                                            }}
                                        >
                                            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white">
                                                <span className="text-lg font-bold text-[#343A47]">
                                                    {taskCompletionRate.toFixed(1)}%
                                                </span>

                                                <span className="text-[7px] uppercase text-[#737A87]">
                                                    Efficiency
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex justify-between text-center">
                                        <div>
                                            <p className="text-[8px] uppercase text-[#858B97]">
                                                Target
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                {taskTarget}%
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[8px] uppercase text-[#858B97]">
                                                Actual
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-[#0757C9]">
                                                {taskCompletionRate.toFixed(1)}%
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[8px] uppercase text-[#858B97]">
                                                Gap
                                            </p>
                                            <p className={`mt-1 text-xs font-semibold ${taskGap >= 0 ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                {taskGap > 0 ? '+' : ''}{taskGap.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* STRATEGIC INSIGHTS */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                        p-5
                                    "
                                >
                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Strategic Insights
                                    </h3>

                                    <div className="mt-4 space-y-3">
                                        <div className="rounded-md border border-[#DCE6FA] bg-[#F2F6FF] p-3">
                                            <div className="flex gap-3">
                                                <Zap
                                                    size={15}
                                                    className="shrink-0 text-[#0757C9]"
                                                />

                                                <div>
                                                    <p className="text-[10px] font-semibold text-[#343A47]">
                                                        Top Performer Identified
                                                    </p>

                                                    <p className="mt-1 text-[9px] leading-4 text-[#69707D]">
                                                        SaaS Automate Enterprise has increased revenue by 24% this quarter.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-md border border-[#F1E0D7] bg-[#FFF9F5] p-3">
                                            <div className="flex gap-3">
                                                <TrendingUp
                                                    size={15}
                                                    className="shrink-0 text-[#A94B18]"
                                                />

                                                <div>
                                                    <p className="text-[10px] font-semibold text-[#343A47]">
                                                        Optimization Needed
                                                    </p>

                                                    <p className="mt-1 text-[9px] leading-4 text-[#69707D]">
                                                        Inventory turnover for "Legacy Modules" has dropped below threshold.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-md border border-[#D6F0E0] bg-[#F2FFF7] p-3">
                                            <div className="flex gap-3">
                                                <TrendingUp
                                                    size={15}
                                                    className="shrink-0 text-[#18A957]"
                                                />

                                                <div>
                                                    <p className="text-[10px] font-semibold text-[#343A47]">
                                                        Expansion Opportunity
                                                    </p>

                                                    <p className="mt-1 text-[9px] leading-4 text-[#69707D]">
                                                        The Southeast region shows a 40% growth in task completions.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* =================================================
                                TABLES
                            ================================================== */}

                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">

                                {/* TOP PRODUCTS */}

                                <section
                                    className="
                                        overflow-hidden
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                    "
                                >
                                    <div className="flex items-center justify-between border-b border-[#E6E8ED] px-5 py-4">
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Top Performing Products
                                        </h3>

                                        <button
                                            type="button"
                                            className="text-[10px] font-medium text-[#0757C9]"
                                        >
                                            View All
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-150">
                                            <thead className="bg-[#F9FAFD]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        PRODUCT
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        UNITS SOLD
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        REVENUE
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        MARGIN
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        STATUS
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {products.map((product, index) => (
                                                    <tr
                                                        key={`${product.name}-${index}`}
                                                        className="border-t border-[#ECEEF2]"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#EEF3FF] text-[#0757C9]">
                                                                    <Package
                                                                        size={12}
                                                                    />
                                                                </span>

                                                                <div>
                                                                    <p className="text-[9px] font-semibold text-[#343A47]">
                                                                        {product.name}
                                                                    </p>

                                                                    <p className="text-[8px] text-[#858B97]">
                                                                        {product.category}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3 text-[9px] font-medium text-[#343A47]">
                                                            {product.units}
                                                        </td>

                                                        <td className="px-4 py-3 text-[9px] font-semibold text-[#343A47]">
                                                            {product.revenue}
                                                        </td>

                                                        <td className="px-4 py-3 text-[9px] font-semibold text-[#18A957]">
                                                            {product.margin}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <span className="rounded bg-[#DDF8E8] px-2 py-1 text-[8px] font-semibold text-[#15924B]">
                                                                ACTIVE
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* RECENT REPORTS */}

                                <section
                                    className="
                                        overflow-hidden
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                    "
                                >
                                    <div className="flex items-center justify-between border-b border-[#E6E8ED] px-5 py-4">
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Recent Reports
                                        </h3>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                className="text-[#59606E]"
                                            >
                                                <Download size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                className="text-[#59606E]"
                                            >
                                                •••
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-150">
                                            <thead className="bg-[#F9FAFD]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        REPORT NAME
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        GENERATED BY
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        DATE
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        STATUS
                                                    </th>

                                                    <th className="px-4 py-3 text-left text-[9px] font-semibold text-[#59606E]">
                                                        ACTIONS
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {reports.map((report) => (
                                                    <tr
                                                        key={report.name}
                                                        className="border-t border-[#ECEEF2]"
                                                    >
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {report.type === 'pdf' ? (
                                                                    <FileBarChart
                                                                        size={14}
                                                                        className="text-red-500"
                                                                    />
                                                                ) : (
                                                                    <FileSpreadsheet
                                                                        size={14}
                                                                        className="text-green-600"
                                                                    />
                                                                )}

                                                                <span className="text-[9px] font-medium text-[#343A47]">
                                                                    {report.name}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-4 text-[9px] text-[#59606E]">
                                                            {report.generatedBy}
                                                        </td>

                                                        <td className="px-4 py-4 text-[9px] text-[#59606E]">
                                                            {report.date}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span
                                                                className={`
                                                                    rounded
                                                                    px-2
                                                                    py-1
                                                                    text-[8px]
                                                                    font-semibold
                                                                    ${report.status === 'COMPLETED'
                                                                        ? 'bg-[#DDF8E8] text-[#15924B]'
                                                                        : 'bg-[#E8F0FF] text-[#0757C9]'
                                                                    }
                                                                `}
                                                            >
                                                                {report.status}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3 text-[#59606E]">
                                                                <button type="button">
                                                                    <Search size={13} />
                                                                </button>

                                                                <button type="button">
                                                                    <Download size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>

                            {/* =================================================
                                EXPORT ACTIONS
                            ================================================== */}

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <button
                                    type="button"
                                    className="
                                        flex
                                        min-h-20
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                        transition
                                        hover:border-[#C8D5F2]
                                        hover:shadow-sm
                                    "
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
                                        <FileBarChart size={16} />
                                    </span>

                                    <span className="mt-2 text-[10px] font-semibold text-[#343A47]">
                                        Export PDF
                                    </span>

                                    <span className="text-[8px] text-[#858B97]">
                                        Ready for print
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="
                                        flex
                                        min-h-20
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                        transition
                                        hover:border-[#C8D5F2]
                                        hover:shadow-sm
                                    "
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">
                                        <FileSpreadsheet size={16} />
                                    </span>

                                    <span className="mt-2 text-[10px] font-semibold text-[#343A47]">
                                        Export Excel
                                    </span>

                                    <span className="text-[8px] text-[#858B97]">
                                        Raw data sheets
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="
                                        flex
                                        min-h-20
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                        transition
                                        hover:border-[#C8D5F2]
                                        hover:shadow-sm
                                    "
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                        <Share2 size={16} />
                                    </span>

                                    <span className="mt-2 text-[10px] font-semibold text-[#343A47]">
                                        Share Dashboard
                                    </span>

                                    <span className="text-[8px] text-[#858B97]">
                                        Collaborate link
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="
                                        flex
                                        min-h-20
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-[#E2E5EB]
                                        bg-white
                                        transition
                                        hover:border-[#C8D5F2]
                                        hover:shadow-sm
                                    "
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                        <Printer size={16} />
                                    </span>

                                    <span className="mt-2 text-[10px] font-semibold text-[#343A47]">
                                        Print View
                                    </span>

                                    <span className="text-[8px] text-[#858B97]">
                                        Paper-friendly
                                    </span>
                                </button>
                            </div>

                            {/* =================================================
                                RECENT REPORT ACTIVITY
                            ================================================== */}

                            <section
                                className="
                                    mt-4
                                    rounded-lg
                                    border
                                    border-[#E2E5EB]
                                    bg-white
                                    p-5
                                "
                            >
                                <h3 className="text-sm font-semibold text-[#242936]">
                                    Recent Report Activity
                                </h3>

                                <div className="mt-5 space-y-5">
                                    {activityItems.map((activity, index) => {
                                        const Icon = activity.icon

                                        return (
                                            <div
                                                key={activity.title}
                                                className="relative flex gap-4"
                                            >
                                                {index < activityItems.length - 1 && (
                                                    <span className="absolute left-4 top-8 h-7 w-px bg-[#DCE1EA]" />
                                                )}

                                                <div
                                                    className={`
                                                        relative
                                                        z-10
                                                        flex
                                                        h-8
                                                        w-8
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        ${activity.iconClass}
                                                    `}
                                                >
                                                    <Icon size={14} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-semibold text-[#343A47]">
                                                        {activity.title}
                                                    </p>

                                                    <p className="mt-1 text-[9px] leading-4 text-[#69707D]">
                                                        {activity.description}
                                                    </p>

                                                    <p className="mt-1 text-[8px] font-semibold text-[#858B97]">
                                                        {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* FOOTER */}

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

export default ReportsAnalytics