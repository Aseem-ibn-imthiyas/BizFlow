
import ManagerSidebar from '../../components/sidebar/ManagerSidebar';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Bell,
    Barcode,
    CircleHelp,
    Clock3,
    DollarSign,
    Edit3,
    ImagePlus,
    Package,
    Printer,
    Search,
    Settings,
    ShieldCheck,
    Truck,
    ArrowLeft,
    LoaderCircle,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

/* =========================================================
   MANAGER HEADER
========================================================= */

function ManagerHeader() {
    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-5 lg:px-7">
            <div className="relative w-64">
                <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                />
                <input
                    type="text"
                    placeholder="Search users, reports, settings..."
                    className="h-8 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-9 pr-3 text-[10px] outline-none placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                />
            </div>

            <div className="flex items-center gap-4">
                <button type="button" aria-label="Messages" className="text-[#59606E] hover:text-[#0757C9]">
                    <span className="text-xs">✉</span>
                </button>
                <button type="button" aria-label="Notifications" className="text-[#59606E] hover:text-[#0757C9]">
                    <Bell size={16} />
                </button>
                <button type="button" aria-label="Settings" className="text-[#59606E] hover:text-[#0757C9]">
                    <Settings size={16} />
                </button>
                <button type="button" aria-label="Help" className="text-[#59606E] hover:text-[#0757C9]">
                    <CircleHelp size={16} />
                </button>
                <div className="h-6 w-px bg-[#E1E4EA]" />
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DDE5F5] text-[9px] font-semibold text-[#315A9E]">
                    EM
                </div>
            </div>
        </header>
    );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({ icon: Icon, title, children, rightContent }) {
    return (
        <section className="overflow-hidden rounded-lg border border-[#E3E6EC] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-[#ECEEF2] px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#EEF3FF] text-[#0757C9]">
                        <Icon size={14} />
                    </div>
                    <h3 className="text-xs font-semibold text-[#242936]">
                        {title}
                    </h3>
                </div>
                {rightContent}
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
}

/* =========================================================
   DETAIL FIELD
========================================================= */

function DetailField({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-wide text-[#858B97]">
                {label}
            </p>
            <p className="mt-1 wrap-break-word text-[10px] font-medium text-[#343A47]">
                {value !== undefined && value !== null && value !== ''
                    ? value
                    : 'Not provided'}
            </p>
        </div>
    );
}

/* =========================================================
   FORMATTERS
========================================================= */

const formatPrice = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return '$0.00';

    return `$${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDate = (value) => {
    if (!value) return 'Not available';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Not available';

    return date.toLocaleString();
};

const getStockStatus = (product) => {
    const quantity = Number(product.quantity || 0);
    const minimum = Number(product.minimumStockLevel || 0);

    if (quantity === 0) return 'Out of Stock';
    if (quantity <= minimum) return 'Low Stock';

    return 'In Stock';
};

const getStatusClass = (status) => {
    if (status === 'In Stock') {
        return 'bg-green-50 text-green-700';
    }

    if (status === 'Low Stock') {
        return 'bg-amber-50 text-amber-700';
    }

    return 'bg-red-50 text-red-700';
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

function ViewInventoryItem() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    /* -----------------------------------------------------
       LOAD PRODUCT
    ----------------------------------------------------- */

    useEffect(() => {
        let cancelled = false;

        if (!id) {
            Promise.resolve().then(() => {
                if (!cancelled) {
                    setError('Invalid inventory item ID.');
                    setLoading(false);
                }
            });

            return () => {
                cancelled = true;
            };
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError('');

        api.get(`/inventory/${id}`)
            .then((response) => {
                const item = response?.data?.data || response?.data;

                if (!item || !item._id) {
                    throw new Error(
                        'The requested inventory item could not be found.'
                    );
                }

                if (!cancelled) {
                    setProduct(item);
                }
            })
            .catch((err) => {
                console.error('Failed to load product details:', err);

                if (!cancelled) {
                    setError(
                        err.message || 'Unable to load product information.'
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id, retryCount]);

    /* -----------------------------------------------------
       LOADING
    ----------------------------------------------------- */

    if (loading) {
        return (
            <main className="flex h-screen w-full items-center justify-center bg-[#FBFCFE]">
                <div className="flex flex-col items-center gap-3">
                    <LoaderCircle
                        size={32}
                        className="animate-spin text-[#0757C9]"
                    />
                    <p className="text-xs font-medium text-[#69707D]">
                        Loading product details...
                    </p>
                </div>
            </main>
        );
    }

    /* -----------------------------------------------------
       ERROR / NOT FOUND
    ----------------------------------------------------- */

    if (!product) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#FBFCFE] p-6">
                <div className="w-full max-w-md rounded-xl border border-[#E3E6EC] bg-white p-7 text-center shadow-sm">
                    <AlertCircle
                        size={34}
                        className="mx-auto text-red-500"
                    />

                    <h2 className="mt-4 text-lg font-bold text-[#242936]">
                        Unable to Load Product
                    </h2>

                    <p className="mt-2 text-xs text-[#69707D]">
                        {error || 'The requested inventory item could not be found.'}
                    </p>

                    <div className="mt-5 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setRetryCount((count) => count + 1)}
                            className="flex items-center gap-2 rounded-md bg-[#0757C9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0045AD]"
                        >
                            <RefreshCw size={12} />
                            Try Again
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/manager/inventory')}
                            className="rounded-md border border-[#D9DDE7] px-4 py-2 text-xs font-medium text-[#343A47] hover:bg-[#F7F8FB]"
                        >
                            Back to Inventory
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    /* -----------------------------------------------------
       PRODUCT CALCULATIONS
    ----------------------------------------------------- */

    const status = product.stockStatus || getStockStatus(product);

    const cost = Number(product.costPrice || 0);
    const price = Number(product.price || 0);
    const discount = Number(product.discount || 0);
    const taxRate = Number(product.taxRate || 0);

    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    const discountedPrice = price * (1 - discount / 100);
    const finalPrice = discountedPrice * (1 + taxRate / 100);

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                <ManagerSidebar />

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    <ManagerHeader />

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-5 py-6 lg:px-7">

                            {/* BREADCRUMB */}

                            <div className="flex flex-wrap items-center gap-2 text-[9px]">
                                <span className="text-[#343A47]">Home</span>
                                <span className="text-[#A1A6B0]">›</span>
                                <button
                                    type="button"
                                    onClick={() => navigate('/manager/inventory')}
                                    className="text-[#343A47] hover:text-[#0757C9]"
                                >
                                    Inventory Management
                                </button>
                                <span className="text-[#A1A6B0]">›</span>
                                <span className="font-semibold text-[#0757C9]">
                                    Product Details
                                </span>
                            </div>

                            {/* PAGE HEADING */}

                            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-[#171B25]">
                                        Product Details
                                    </h2>
                                    <p className="mt-1 text-[10px] text-[#69707D]">
                                        View inventory information, stock levels,
                                        pricing and supplier details.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/manager/inventory')}
                                        className="flex h-9 items-center gap-2 rounded-md border border-[#D9DDE7] bg-white px-3 text-[9px] font-medium text-[#343A47] hover:bg-[#F7F8FB]"
                                    >
                                        <ArrowLeft size={13} />
                                        Back
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate(`/manager/inventory/edit/${product._id}`)}
                                        className="flex h-9 items-center gap-2 rounded-md bg-[#0757C9] px-4 text-[9px] font-semibold text-white hover:bg-[#0045AD]"
                                    >
                                        <Edit3 size={13} />
                                        Edit Product
                                    </button>
                                </div>
                            </div>

                            {/* MAIN GRID */}

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">

                                {/* LEFT COLUMN */}

                                <div className="space-y-4">

                                    {/* PRODUCT INFORMATION */}

                                    <SectionCard
                                        icon={Package}
                                        title="Product Information"
                                        rightContent={
                                            <span className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${getStatusClass(status)}`}>
                                                {status}
                                            </span>
                                        }
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row">

                                            <div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E3E6EC] bg-[#F6F7FA] sm:w-40">
                                                {product.imageUrl ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.productName}
                                                        className="h-full w-full object-contain"
                                                        onError={(event) => {
                                                            event.currentTarget.style.display = 'none';
                                                            event.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}

                                                <ImagePlus
                                                    size={32}
                                                    className={`${product.imageUrl ? 'hidden' : ''} text-[#A0A6B2]`}
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-bold text-[#242936]">
                                                    {product.productName}
                                                </h3>

                                                <p className="mt-1 text-[9px] text-[#7A808C]">
                                                    Product ID: {product.productId}
                                                </p>

                                                <p className="mt-3 text-[10px] leading-5 text-[#59606E]">
                                                    {product.description || 'No product description provided.'}
                                                </p>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <span className="rounded-md bg-[#EEF3FF] px-2.5 py-1.5 text-[8px] font-semibold text-[#0757C9]">
                                                        {product.category}
                                                    </span>

                                                    <span className={`rounded-md px-2.5 py-1.5 text-[8px] font-semibold ${getStatusClass(status)}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[#ECEEF2] pt-4 sm:grid-cols-2">
                                            <DetailField
                                                label="Product Name"
                                                value={product.productName}
                                            />
                                            <DetailField
                                                label="Product Code / SKU"
                                                value={product.productId}
                                            />
                                            <DetailField
                                                label="Barcode"
                                                value={product.barcode}
                                            />
                                            <DetailField
                                                label="Category"
                                                value={product.category}
                                            />
                                        </div>
                                    </SectionCard>

                                    {/* STOCK DETAILS */}

                                    <SectionCard
                                        icon={Package}
                                        title="Stock Details"
                                    >
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <DetailField
                                                label="Current Stock"
                                                value={Number(product.quantity || 0).toLocaleString()}
                                            />
                                            <DetailField
                                                label="Minimum Stock Level"
                                                value={Number(product.minimumStockLevel || 0).toLocaleString()}
                                            />
                                            <DetailField
                                                label="Stock Status"
                                                value={status}
                                            />
                                        </div>

                                        <div className="mt-4 border-t border-[#ECEEF2] pt-4">
                                            <DetailField
                                                label="Storage Location"
                                                value={product.storageLocation}
                                            />
                                        </div>
                                    </SectionCard>

                                    {/* PRICING */}

                                    <SectionCard
                                        icon={DollarSign}
                                        title="Pricing Information"
                                    >
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            <DetailField
                                                label="Cost Price"
                                                value={formatPrice(cost)}
                                            />
                                            <DetailField
                                                label="Selling Price"
                                                value={formatPrice(price)}
                                            />
                                            <DetailField
                                                label="Discount"
                                                value={`${discount}%`}
                                            />
                                            <DetailField
                                                label="Tax Rate"
                                                value={`${taxRate}%`}
                                            />
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-[#F2F3FC] p-3 sm:grid-cols-3">
                                            <div>
                                                <p className="text-[8px] text-[#59606E]">
                                                    Profit per Unit
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-[#0757C9]">
                                                    {formatPrice(profit)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[8px] text-[#59606E]">
                                                    Profit Margin
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-[#0757C9]">
                                                    {margin.toFixed(1)}%
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[8px] text-[#59606E]">
                                                    Final Price (Inc. Tax)
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-[#242936]">
                                                    {formatPrice(finalPrice)}
                                                </p>
                                            </div>
                                        </div>
                                    </SectionCard>

                                    {/* SUPPLIER */}

                                    <SectionCard
                                        icon={Truck}
                                        title="Supplier Information"
                                    >
                                        <DetailField
                                            label="Supplier Name"
                                            value={product.supplier}
                                        />

                                        <p className="mt-3 text-[8px] text-[#7A808C]">
                                            Supplier contact details are not currently stored in the inventory model.
                                        </p>
                                    </SectionCard>

                                </div>

                                {/* RIGHT COLUMN */}

                                <div className="space-y-4">

                                    {/* PRODUCT SUMMARY */}

                                    <section className="overflow-hidden rounded-lg border border-[#E3E6EC] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                        <div className="flex h-36 items-center justify-center overflow-hidden bg-[#EDEFF4]">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.productName}
                                                    className="h-full w-full object-contain"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display = 'none';
                                                        event.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}

                                            <ImagePlus
                                                size={34}
                                                className={`${product.imageUrl ? 'hidden' : ''} text-[#A0A6B2]`}
                                            />
                                        </div>

                                        <div className="p-4">
                                            <h3 className="text-sm font-bold text-[#242936]">
                                                {product.productName}
                                            </h3>

                                            <p className="mt-1 text-[8px] text-[#7A808C]">
                                                SKU: {product.productId}
                                            </p>

                                            <div className="my-4 h-px bg-[#ECEEF2]" />

                                            <div className="grid grid-cols-2">
                                                <div className="text-center">
                                                    <p className="text-[7px] text-[#59606E]">
                                                        Current Stock
                                                    </p>
                                                    <p className="mt-1 text-lg font-bold text-[#0757C9]">
                                                        {Number(product.quantity || 0).toLocaleString()}
                                                    </p>
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-[7px] text-[#59606E]">
                                                        Selling Price
                                                    </p>
                                                    <p className="mt-1 text-lg font-bold text-[#242936]">
                                                        {formatPrice(price)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-md bg-[#F5F7FB] p-3">
                                                <p className="text-[8px] text-[#59606E]">
                                                    Inventory Status
                                                </p>
                                                <p className={`mt-1 text-[10px] font-bold ${status === 'In Stock' ? 'text-green-700' : status === 'Low Stock' ? 'text-amber-700' : 'text-red-600'}`}>
                                                    {status}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* QUICK INFORMATION */}

                                    <section className="overflow-hidden rounded-lg border border-[#E3E6EC] bg-white">
                                        <div className="border-b border-[#ECEEF2] px-4 py-3">
                                            <p className="text-[8px] font-bold uppercase tracking-wide text-[#59606E]">
                                                Product Information
                                            </p>
                                        </div>

                                        <div className="space-y-4 p-4">
                                            <div className="flex items-center gap-3">
                                                <Barcode size={15} className="text-[#0757C9]" />
                                                <div>
                                                    <p className="text-[8px] text-[#858B97]">
                                                        Barcode
                                                    </p>
                                                    <p className="text-[9px] font-medium text-[#343A47]">
                                                        {product.barcode || 'Not provided'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Truck size={15} className="text-[#0757C9]" />
                                                <div>
                                                    <p className="text-[8px] text-[#858B97]">
                                                        Supplier
                                                    </p>
                                                    <p className="text-[9px] font-medium text-[#343A47]">
                                                        {product.supplier || 'Not provided'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <ShieldCheck size={15} className="text-[#0757C9]" />
                                                <div>
                                                    <p className="text-[8px] text-[#858B97]">
                                                        Minimum Stock
                                                    </p>
                                                    <p className="text-[9px] font-medium text-[#343A47]">
                                                        {Number(product.minimumStockLevel || 0).toLocaleString()} units
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* RECORD INFORMATION */}

                                    <section className="rounded-lg border border-[#E3E6EC] bg-white p-4">
                                        <div className="flex items-center gap-2">
                                            <Clock3 size={14} className="text-[#0757C9]" />
                                            <h3 className="text-xs font-semibold text-[#242936]">
                                                Record Information
                                            </h3>
                                        </div>

                                        <div className="mt-4 space-y-4">
                                            <DetailField
                                                label="Created At"
                                                value={formatDate(product.createdAt)}
                                            />
                                            <DetailField
                                                label="Last Updated"
                                                value={formatDate(product.updatedAt)}
                                            />
                                        </div>
                                    </section>

                                    {/* QUICK ACTIONS */}

                                    <section className="overflow-hidden rounded-lg border border-[#E3E6EC] bg-white">
                                        <div className="border-b border-[#ECEEF2] px-4 py-3">
                                            <p className="text-[8px] font-bold uppercase tracking-wide text-[#59606E]">
                                                Quick Actions
                                            </p>
                                        </div>

                                        <div className="divide-y divide-[#ECEEF2]">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/manager/inventory/edit/${product._id}`)}
                                                className="flex h-10 w-full items-center justify-between px-4 text-left text-[9px] hover:bg-[#F8F9FC]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Edit3 size={13} className="text-[#0757C9]" />
                                                    Edit Product
                                                </span>
                                                <span>›</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => window.print()}
                                                className="flex h-10 w-full items-center justify-between px-4 text-left text-[9px] hover:bg-[#F8F9FC]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Printer size={13} className="text-[#0757C9]" />
                                                    Print Product Details
                                                </span>
                                                <span>›</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => navigate('/manager/inventory')}
                                                className="flex h-10 w-full items-center justify-between px-4 text-left text-[9px] hover:bg-[#F8F9FC]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <ArrowLeft size={13} className="text-[#0757C9]" />
                                                    Back to Inventory
                                                </span>
                                                <span>›</span>
                                            </button>
                                        </div>
                                    </section>

                                </div>
                            </div>

                            {/* FOOTER */}

                            <footer className="mt-7 border-t border-[#E1E4EA] py-4">
                                <div className="flex flex-col gap-2 text-[8px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">
                                    <p>
                                        © 2026 BizFlow | Cloud-Based SaaS Platform
                                    </p>

                                    <div className="flex gap-4">
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

export default ViewInventoryItem;
