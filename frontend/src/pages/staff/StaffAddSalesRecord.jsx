
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Search,
    UserRound,
    Package,
    FileText,
    Plus,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ShoppingCart,
} from 'lucide-react'

import StaffSidebar from '../../components/sidebar/StaffSidebar'
import api from '../../services/api'

function StaffAddSalesRecord() {
    const navigate = useNavigate()

    const [customer, setCustomer] = useState({
        name: '',
        id: '',
        phone: '',
        email: '',
        address: '',
    })

    const [sale, setSale] = useState({
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Pending',
    })

    const [products, setProducts] = useState([])
    const [items, setItems] = useState([])
    const [productSearch, setProductSearch] = useState('')
    const [showProducts, setShowProducts] = useState(false)

    const [shipping, setShipping] = useState('0')
    const [notes, setNotes] = useState('')

    const [loadingProducts, setLoadingProducts] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [savedInvoice, setSavedInvoice] = useState('')

    // Load products available for sales.
    useEffect(() => {
        let active = true

        const loadProducts = async () => {
            try {
                const response = await api.get('/sales/products')

                if (active) {
                    setProducts(
                        Array.isArray(response?.data)
                            ? response.data
                            : []
                    )
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.message || 'Unable to load inventory products.'
                    )
                }
            } finally {
                if (active) {
                    setLoadingProducts(false)
                }
            }
        }

        loadProducts()

        return () => {
            active = false
        }
    }, [])

    const updateCustomer = (field, value) => {
        setCustomer((previous) => ({
            ...previous,
            [field]: value,
        }))
    }

    const updateSale = (field, value) => {
        setSale((previous) => ({
            ...previous,
            [field]: value,
        }))
    }

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(Number(value) || 0)

    // Search inventory by product name, ID or barcode.
    const filteredProducts = useMemo(() => {
        const query = productSearch.trim().toLowerCase()

        return products
            .filter((product) =>
                Number(product.quantity) > 0 &&
                (
                    !query ||
                    product.productName?.toLowerCase().includes(query) ||
                    product.productId?.toLowerCase().includes(query) ||
                    product.barcode?.toLowerCase().includes(query)
                )
            )
            .slice(0, 10)
    }, [products, productSearch])

    const addProduct = (product) => {
        if (!product || Number(product.quantity) <= 0) return

        setItems((previous) => {
            const existing = previous.find(
                (item) => item._id === product._id
            )

            if (existing) {
                return previous.map((item) =>
                    item._id === product._id
                        ? {
                            ...item,
                            qty: Math.min(
                                Number(item.qty) + 1,
                                Number(product.quantity)
                            ),
                        }
                        : item
                )
            }

            return [
                ...previous,
                {
                    _id: product._id,
                    product: product.productName,
                    sku: product.productId,
                    price: Number(product.price) || 0,
                    stock: Number(product.quantity) || 0,
                    qty: 1,
                    discount: Number(product.discount) || 0,
                    taxRate: Number(product.taxRate) || 0,
                },
            ]
        })

        setProductSearch('')
        setShowProducts(false)
        setError('')
    }

    const updateQuantity = (id, value) => {
        setItems((previous) =>
            previous.map((item) =>
                item._id === id
                    ? { ...item, qty: value }
                    : item
            )
        )
    }

    const removeProduct = (id) => {
        setItems((previous) =>
            previous.filter((item) => item._id !== id)
        )
    }

    // Display-only calculations. The backend recalculates final totals.
    const subtotal = useMemo(
        () => items.reduce(
            (total, item) =>
                total + item.price * Math.max(0, Number(item.qty) || 0),
            0
        ),
        [items]
    )

    const discount = useMemo(
        () => items.reduce(
            (total, item) =>
                total +
                (
                    item.price *
                    Math.max(0, Number(item.qty) || 0) *
                    item.discount
                ) / 100,
            0
        ),
        [items]
    )

    const tax = useMemo(
        () => items.reduce((total, item) => {
            const afterDiscount =
                item.price *
                Math.max(0, Number(item.qty) || 0) *
                (1 - item.discount / 100)

            return total + afterDiscount * item.taxRate / 100
        }, 0),
        [items]
    )

    const grandTotal =
        subtotal -
        discount +
        tax +
        Math.max(0, Number(shipping) || 0)

    const outstanding =
        sale.paymentStatus === 'Paid' ? 0 : grandTotal

    const saveSale = async (saleStatus) => {
        if (saving) return

        setError('')
        setSuccess('')
        setSavedInvoice('')

        if (!customer.name.trim()) {
            setError('Customer name is required.')
            return
        }

        if (!items.length) {
            setError('Please add at least one product.')
            return
        }

        const invalidItem = items.find((item) =>
            !Number.isInteger(Number(item.qty)) ||
            Number(item.qty) < 1 ||
            Number(item.qty) > item.stock
        )

        if (invalidItem) {
            setError(
                `${invalidItem.product}: quantity must be between 1 and ${invalidItem.stock}.`
            )
            return
        }

        if (saleStatus === 'Completed' && sale.paymentStatus === 'Refunded') {
            setError('A new completed sale cannot have Refunded payment status.')
            return
        }

        const payload = {
            customer: {
                name: customer.name.trim(),
                customerId: customer.id.trim(),
                phone: customer.phone.trim(),
                email: customer.email.trim(),
                address: customer.address.trim(),
            },

            items: items.map((item) => ({
                product: item._id,
                quantity: Number(item.qty),
            })),

            saleDate: sale.date
                ? new Date(`${sale.date}T12:00:00`).toISOString()
                : new Date().toISOString(),

            paymentMethod: sale.paymentMethod,
            paymentStatus: sale.paymentStatus,
            saleStatus,

            shippingCost: Math.max(0, Number(shipping) || 0),
            notes: notes.trim(),
        }

        setSaving(true)

        try {
            const response = await api.post('/sales', payload)

            const invoiceId = response?.data?.invoiceId || ''

            setSavedInvoice(invoiceId)

            setSuccess(
                saleStatus === 'Draft'
                    ? 'Sales draft saved successfully.'
                    : 'Sales transaction completed successfully.'
            )

            // Refresh available inventory after a completed transaction.
            if (saleStatus === 'Completed') {
                try {
                    const refreshed = await api.get('/sales/products')

                    setProducts(
                        Array.isArray(refreshed?.data)
                            ? refreshed.data
                            : []
                    )
                } catch (refreshError) {
                    console.warn(
                        'Sale saved, but product refresh failed:',
                        refreshError
                    )
                }
            }
        } catch (err) {
            setError(
                err.message || 'Unable to save the sales transaction.'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                <aside className="h-screen w-56 shrink-0 overflow-hidden lg:w-64">
                    <StaffSidebar />
                </aside>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

                    {/* HEADER */}
                    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/staff/sales')}
                                className="rounded-md p-2 text-[#59606E] hover:bg-[#F1F3FA]"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            <div>
                                <p className="text-xs font-semibold text-[#343A47]">
                                    Staff Workspace
                                </p>
                                <p className="text-[10px] text-[#858B97]">
                                    Sales Management
                                </p>
                            </div>
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDE5F5] text-[10px] font-semibold text-[#315A9E]">
                            ST
                        </div>
                    </header>

                    {/* CONTENT */}
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="px-6 py-7 lg:px-8">

                            <div>
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/staff/sales')}
                                        className="text-[#69707D] hover:text-[#0757C9]"
                                    >
                                        Sales Management
                                    </button>

                                    <span className="text-[#A1A6B0]">›</span>

                                    <span className="font-medium text-[#0757C9]">
                                        Add Sales Record
                                    </span>
                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                                    Add Sales Record
                                </h1>

                                <p className="mt-1 text-sm text-[#69707D]">
                                    Record a customer transaction and generate a sales invoice.
                                </p>
                            </div>

                            {/* FEEDBACK */}
                            {error && (
                                <div
                                    role="alert"
                                    className="mt-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                                >
                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    role="status"
                                    className="mt-5 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700"
                                >
                                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />

                                    <div>
                                        <p>{success}</p>

                                        {savedInvoice && (
                                            <p className="mt-1 font-semibold">
                                                Invoice: {savedInvoice}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => navigate('/staff/sales')}
                                            className="mt-2 font-semibold underline"
                                        >
                                            Return to Sales Management
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* LEFT COLUMN */}
                                <div className="space-y-4">

                                    {/* CUSTOMER DETAILS */}
                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-2 border-b border-[#ECEEF2] pb-4">
                                            <UserRound size={17} className="text-[#0757C9]" />
                                            <h2 className="text-sm font-semibold">
                                                Customer Details
                                            </h2>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <Field
                                                label="Customer Name"
                                                required
                                                value={customer.name}
                                                placeholder="Enter customer name"
                                                onChange={(value) => updateCustomer('name', value)}
                                            />

                                            <Field
                                                label="Customer ID"
                                                value={customer.id}
                                                placeholder="Optional customer reference"
                                                onChange={(value) => updateCustomer('id', value)}
                                            />

                                            <Field
                                                label="Phone Number"
                                                value={customer.phone}
                                                placeholder="+94 77 000 0000"
                                                onChange={(value) => updateCustomer('phone', value)}
                                            />

                                            <Field
                                                label="Email Address"
                                                type="email"
                                                value={customer.email}
                                                placeholder="customer@example.com"
                                                onChange={(value) => updateCustomer('email', value)}
                                            />

                                            <div className="md:col-span-2">
                                                <Field
                                                    label="Address"
                                                    value={customer.address}
                                                    placeholder="Customer address"
                                                    onChange={(value) => updateCustomer('address', value)}
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* SALE DETAILS */}
                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-2 border-b border-[#ECEEF2] pb-4">
                                            <FileText size={17} className="text-[#0757C9]" />
                                            <h2 className="text-sm font-semibold">
                                                Transaction Details
                                            </h2>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <Field
                                                label="Sale Date"
                                                type="date"
                                                value={sale.date}
                                                onChange={(value) => updateSale('date', value)}
                                            />

                                            <SelectField
                                                label="Payment Method"
                                                value={sale.paymentMethod}
                                                options={[
                                                    'Bank Transfer',
                                                    'Cash',
                                                    'Card',
                                                    'Online Payment',
                                                ]}
                                                onChange={(value) => updateSale('paymentMethod', value)}
                                            />

                                            <SelectField
                                                label="Payment Status"
                                                value={sale.paymentStatus}
                                                options={[
                                                    'Pending',
                                                    'Paid',
                                                    'Partially Paid',
                                                ]}
                                                onChange={(value) => updateSale('paymentStatus', value)}
                                            />
                                        </div>
                                    </section>

                                    {/* PRODUCTS */}
                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-2 border-b border-[#ECEEF2] pb-4">
                                            <Package size={17} className="text-[#0757C9]" />
                                            <h2 className="text-sm font-semibold">
                                                Products
                                            </h2>
                                        </div>

                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                            <div className="relative min-w-0 flex-1">
                                                <Search
                                                    size={15}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858B97]"
                                                />

                                                <input
                                                    value={productSearch}
                                                    onChange={(event) => {
                                                        setProductSearch(event.target.value)
                                                        setShowProducts(true)
                                                    }}
                                                    onFocus={() => setShowProducts(true)}
                                                    placeholder="Search product name, SKU or barcode..."
                                                    className="h-10 w-full rounded-md border border-[#D9DDE5] pl-9 pr-3 text-xs outline-none focus:border-[#0757C9]"
                                                />

                                                {showProducts && (
                                                    <div className="absolute left-0 right-0 top-11 z-20 max-h-64 overflow-y-auto rounded-md border border-[#E1E4EA] bg-white shadow-lg">
                                                        {loadingProducts ? (
                                                            <p className="p-4 text-xs text-[#737A87]">
                                                                Loading products...
                                                            </p>
                                                        ) : filteredProducts.length ? (
                                                            filteredProducts.map((product) => (
                                                                <button
                                                                    type="button"
                                                                    key={product._id}
                                                                    onClick={() => addProduct(product)}
                                                                    className="flex w-full items-center justify-between border-b border-[#ECEEF2] px-3 py-3 text-left hover:bg-[#F5F8FE]"
                                                                >
                                                                    <span>
                                                                        <span className="block text-xs font-semibold text-[#343A47]">
                                                                            {product.productName}
                                                                        </span>
                                                                        <span className="mt-1 block text-[10px] text-[#858B97]">
                                                                            {product.productId} · Stock: {product.quantity}
                                                                        </span>
                                                                    </span>

                                                                    <span className="text-xs font-semibold text-[#0757C9]">
                                                                        {formatCurrency(product.price)}
                                                                    </span>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <p className="p-4 text-xs text-[#737A87]">
                                                                No available products found.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (filteredProducts[0]) {
                                                        addProduct(filteredProducts[0])
                                                    } else {
                                                        setShowProducts(true)
                                                    }
                                                }}
                                                disabled={loadingProducts || !filteredProducts.length}
                                                className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#0757C9] px-4 text-xs font-medium text-white hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Plus size={15} />
                                                Add Product
                                            </button>
                                        </div>

                                        <div className="mt-4 overflow-x-auto">
                                            <table className="w-full min-w-162.5 border-collapse">
                                                <thead>
                                                    <tr className="bg-[#F8F9FC] text-left">
                                                        {['PRODUCT', 'SKU', 'PRICE', 'STOCK', 'QTY', 'TOTAL', ''].map((heading) => (
                                                            <th
                                                                key={heading}
                                                                className="px-3 py-3 text-[9px] font-semibold text-[#737A87]"
                                                            >
                                                                {heading}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {items.map((item) => {
                                                        const qty = Math.max(0, Number(item.qty) || 0)
                                                        const lineTotal =
                                                            item.price *
                                                            qty *
                                                            (1 - item.discount / 100) *
                                                            (1 + item.taxRate / 100)

                                                        return (
                                                            <tr key={item._id} className="border-t border-[#ECEEF2]">
                                                                <td className="px-3 py-3 text-xs font-medium">
                                                                    {item.product}
                                                                </td>

                                                                <td className="px-3 py-3 text-[10px] text-[#737A87]">
                                                                    {item.sku}
                                                                </td>

                                                                <td className="px-3 py-3 text-xs">
                                                                    {formatCurrency(item.price)}
                                                                </td>

                                                                <td className="px-3 py-3 text-xs text-[#0757C9]">
                                                                    {item.stock}
                                                                </td>

                                                                <td className="px-3 py-3">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={item.stock}
                                                                        step="1"
                                                                        value={item.qty}
                                                                        onChange={(event) => updateQuantity(item._id, event.target.value)}
                                                                        className="h-8 w-16 rounded border border-[#D9DDE5] px-2 text-center text-xs outline-none focus:border-[#0757C9]"
                                                                    />
                                                                </td>

                                                                <td className="px-3 py-3 text-xs font-semibold text-[#0757C9]">
                                                                    {formatCurrency(lineTotal)}
                                                                </td>

                                                                <td className="px-3 py-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeProduct(item._id)}
                                                                        aria-label={`Remove ${item.product}`}
                                                                        className="text-[#737A87] hover:text-red-500"
                                                                    >
                                                                        <X size={15} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}

                                                    {!items.length && (
                                                        <tr>
                                                            <td colSpan="7" className="px-4 py-10 text-center text-xs text-[#858B97]">
                                                                {loadingProducts
                                                                    ? 'Loading inventory products...'
                                                                    : 'No products added. Search for a product above.'}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <p className="mt-3 border-t border-[#ECEEF2] pt-3 text-[10px] text-[#858B97]">
                                            Product prices, discounts, tax rates and final totals are validated by the server.
                                        </p>
                                    </section>

                                    {/* NOTES */}
                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-[#0757C9]" />
                                            <h2 className="text-sm font-semibold">
                                                Additional Notes
                                            </h2>
                                        </div>

                                        <textarea
                                            value={notes}
                                            onChange={(event) => setNotes(event.target.value)}
                                            rows={4}
                                            placeholder="Enter remarks or special instructions..."
                                            className="mt-4 w-full resize-none rounded-md border border-[#D9DDE5] px-3 py-3 text-xs outline-none focus:border-[#0757C9]"
                                        />
                                    </section>
                                </div>

                                {/* RIGHT COLUMN */}
                                <div className="space-y-4">

                                    {/* SUMMARY */}
                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-sm">
                                        <h2 className="text-sm font-semibold">
                                            Order Summary
                                        </h2>

                                        <div className="mt-5 space-y-4">
                                            <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                                            <SummaryRow label="Discount" value={`-${formatCurrency(discount)}`} valueClass="text-red-500" />
                                            <SummaryRow label="Tax" value={formatCurrency(tax)} />

                                            <div className="flex items-center justify-between gap-3">
                                                <label htmlFor="staff-shipping" className="text-xs text-[#737A87]">
                                                    Shipping Fee
                                                </label>

                                                <input
                                                    id="staff-shipping"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={shipping}
                                                    onChange={(event) => setShipping(event.target.value)}
                                                    className="h-8 w-24 rounded border border-[#D9DDE5] px-2 text-right text-xs outline-none focus:border-[#0757C9]"
                                                />
                                            </div>

                                            <div className="border-t border-[#E1E4EA] pt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold">
                                                        Grand Total
                                                    </span>
                                                    <span className="text-xl font-bold text-[#0757C9]">
                                                        {formatCurrency(grandTotal)}
                                                    </span>
                                                </div>
                                            </div>

                                            <SummaryRow
                                                label="Outstanding Balance"
                                                value={formatCurrency(outstanding)}
                                            />
                                        </div>
                                    </section>

                                    {/* INVOICE PREVIEW */}
                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-sm">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#858B97]">
                                            Invoice Preview
                                        </p>

                                        <p className="mt-4 break-all text-lg font-bold text-[#343A47]">
                                            {savedInvoice || 'Invoice pending'}
                                        </p>

                                        <div className="mt-4 border-t border-[#ECEEF2] pt-4">
                                            <p className="text-[9px] font-semibold uppercase text-[#858B97]">
                                                Bill To
                                            </p>
                                            <p className="mt-1 text-xs font-medium">
                                                {customer.name || 'Customer not entered'}
                                            </p>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#ECEEF2] pt-4">
                                            <div>
                                                <p className="text-[9px] text-[#858B97]">PRODUCTS</p>
                                                <p className="mt-1 text-sm font-semibold">
                                                    {items.length}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] text-[#858B97]">QUANTITY</p>
                                                <p className="mt-1 text-sm font-semibold">
                                                    {items.reduce((total, item) => total + (Number(item.qty) || 0), 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* ACTIONS */}
                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-sm">
                                        <h2 className="text-sm font-semibold">
                                            Save Transaction
                                        </h2>

                                        <p className="mt-2 text-[10px] leading-5 text-[#858B97]">
                                            Review the customer and product details before saving this transaction.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => saveSale('Completed')}
                                            disabled={saving || loadingProducts}
                                            className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0757C9] px-4 text-xs font-semibold text-white hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <Loader2 size={15} className="animate-spin" />
                                            ) : (
                                                <ShoppingCart size={15} />
                                            )}
                                            {saving ? 'Saving...' : 'Complete Sale'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => saveSale('Draft')}
                                            disabled={saving || loadingProducts}
                                            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#D9DDE5] px-4 text-xs font-semibold text-[#454B58] hover:bg-[#F8F9FC] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Save as Draft
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => navigate('/staff/sales')}
                                            disabled={saving}
                                            className="mt-2 h-9 w-full rounded-md text-xs font-medium text-[#737A87] hover:bg-[#F8F9FC]"
                                        >
                                            Cancel
                                        </button>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

function Field({
    label,
    value,
    onChange,
    placeholder = '',
    type = 'text',
    required = false,
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-medium text-[#59606E]">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>

            <input
                type={type}
                value={value}
                required={required}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-10 w-full rounded-md border border-[#D9DDE5] px-3 text-xs text-[#343A47] outline-none placeholder:text-[#A1A6B0] focus:border-[#0757C9]"
            />
        </div>
    )
}

function SelectField({ label, value, options, onChange }) {
    return (
        <div>
            <label className="mb-2 block text-xs font-medium text-[#59606E]">
                {label}
            </label>

            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-md border border-[#D9DDE5] bg-white px-3 text-xs text-[#343A47] outline-none focus:border-[#0757C9]"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    )
}

function SummaryRow({ label, value, valueClass = '' }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#737A87]">{label}</span>
            <span className={`text-xs font-semibold text-[#343A47] ${valueClass}`}>
                {value}
            </span>
        </div>
    )
}

export default StaffAddSalesRecord
