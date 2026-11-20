import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search, UserPlus, Plus, FileText, Printer, Mail, Save, X,
    ChevronDown, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'

import ManagerSidebar from '../../components/sidebar/ManagerSidebar'
import api from '../../services/api'

function AddSalesRecord() {
    const navigate = useNavigate()

    const [customer, setCustomer] = useState({
        name: '',
        id: '',
        phone: '',
        email: '',
        address: '',
    })

    const [sales, setSales] = useState({
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Pending',
    })

    const [products, setProducts] = useState([])
    const [items, setItems] = useState([])
    const [productSearch, setProductSearch] = useState('')
    const [showProductResults, setShowProductResults] = useState(false)
    const [notes, setNotes] = useState('')
    const [shipping, setShipping] = useState(0)
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [savedInvoice, setSavedInvoice] = useState('')

    // Load available inventory products.
    useEffect(() => {
        let active = true

        const loadProducts = async () => {
            try {
                const response = await api.get('/sales/products')

                if (active) {
                    setProducts(response?.data || [])
                }
            } catch (err) {
                if (active) {
                    setError(err.message || 'Unable to load inventory products.')
                }
            } finally {
                if (active) {
                    setLoadingProducts(false)
                }
            }
        }

        Promise.resolve().then(loadProducts)

        return () => {
            active = false
        }
    }, [])

    const updateCustomer = (field, value) => {
        setCustomer((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const updateSales = (field, value) => {
        setSales((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    // Add a selected inventory product to the sale.
    const addProduct = (product) => {
        if (!product) return

        setItems((prev) => {
            const existing = prev.find(
                (item) => item._id === product._id
            )

            if (existing) {
                return prev.map((item) =>
                    item._id === product._id
                        ? {
                            ...item,
                            qty: Math.min(
                                item.qty + 1,
                                Math.max(product.quantity, 1)
                            ),
                        }
                        : item
                )
            }

            return [
                ...prev,
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
        setShowProductResults(false)
        setError('')
    }

    const updateItem = (id, field, value) => {
        setItems((prev) =>
            prev.map((item) =>
                item._id === id
                    ? {
                        ...item,
                        [field]: field === 'qty' ? value : value,
                    }
                    : item
            )
        )
    }

    const removeItem = (id) => {
        setItems((prev) =>
            prev.filter((item) => item._id !== id)
        )
    }

    // Search inventory products by name, SKU or barcode.
    const filteredProducts = useMemo(() => {
        const query = productSearch.trim().toLowerCase()

        return products.filter((product) => {
            const matches =
                !query ||
                product.productName?.toLowerCase().includes(query) ||
                product.productId?.toLowerCase().includes(query) ||
                product.barcode?.toLowerCase().includes(query)

            return matches
        }).slice(0, 8)
    }, [products, productSearch])

    // Calculate order totals.
    const subtotal = useMemo(
        () =>
            items.reduce(
                (total, item) =>
                    total +
                    item.price * Math.max(0, Number(item.qty) || 0),
                0
            ),
        [items]
    )

    const discount = useMemo(
        () =>
            items.reduce(
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
        () =>
            items.reduce((total, item) => {
                const lineAfterDiscount =
                    item.price *
                    Math.max(0, Number(item.qty) || 0) *
                    (1 - item.discount / 100)

                return total +
                    lineAfterDiscount * item.taxRate / 100
            }, 0),
        [items]
    )

    const grandTotal =
        subtotal -
        discount +
        tax +
        Math.max(0, Number(shipping) || 0)

    const outstanding =
        sales.paymentStatus === 'Paid' ? 0 : grandTotal

    const formatCurrency = (value) => {
        return `$${Number(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
    }

    // Save a draft or complete a sale.
    const saveSale = async (saleStatus) => {
        setError('')
        setSuccess('')

        if (!customer.name.trim()) {
            setError('Customer name is required.')
            return
        }

        if (items.length === 0) {
            setError('Add at least one inventory product.')
            return
        }

        const invalidItem = items.find(
            (item) =>
                !Number.isInteger(Number(item.qty)) ||
                Number(item.qty) < 1 ||
                Number(item.qty) > item.stock
        )

        if (invalidItem) {
            setError(
                `${invalidItem.product}: enter a quantity between 1 and the available stock (${invalidItem.stock}).`
            )
            return
        }

        if (
            saleStatus === 'Completed' &&
            sales.paymentStatus === 'Refunded'
        ) {
            setError(
                'A new completed sale cannot have Refunded payment status.'
            )
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

            saleDate: sales.date
                ? new Date(`${sales.date}T12:00:00`).toISOString()
                : new Date().toISOString(),

            paymentMethod: sales.paymentMethod,
            paymentStatus: sales.paymentStatus,
            saleStatus,

            shippingCost: Math.max(
                0,
                Number(shipping) || 0
            ),

            notes: notes.trim(),
        }

        setSaving(true)

        try {
            const response = await api.post('/sales', payload)

            const invoiceId =
                response?.data?.invoiceId || ''

            setSavedInvoice(invoiceId)

            setSuccess(
                saleStatus === 'Draft'
                    ? `Draft saved successfully${invoiceId ? ` (${invoiceId})` : ''}.`
                    : `Sale completed successfully${invoiceId ? ` (${invoiceId})` : ''}.`
            )

            if (saleStatus === 'Completed') {
                // Refresh stock values after a completed transaction.
                try {
                    const refreshed = await api.get('/sales/products')

                    setProducts(refreshed?.data || [])
                } catch (refreshError) {
                    console.warn(
                        'Sale saved, but product stock refresh failed:',
                        refreshError
                    )
                }
            }
        } catch (err) {
            setError(
                err.message || 'Unable to save the sales record.'
            )
        } finally {
            setSaving(false)
        }
    }

    const validationText = !customer.name.trim()
        ? 'Customer Name required'
        : items.length === 0
            ? 'Add at least one product'
            : items.some(
                (item) =>
                    Number(item.qty) < 1 ||
                    Number(item.qty) > item.stock
            )
                ? 'Check product quantities'
                : 'Ready to save'

    const selectProduct = (product) => {
        addProduct(product)
    }
    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                <ManagerSidebar />

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* HEADER */}

                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-6 lg:px-8">

                        <div className="relative w-72">
                            <Search
                                size={16}
                                strokeWidth={1.8}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                            />

                            <input
                                type="text"
                                placeholder="Search users, reports, settings..."
                                className="h-9 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-10 pr-4 text-xs text-[#343A47] outline-none transition placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-5">

                            <button
                                type="button"
                                aria-label="Messages"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Mail size={17} strokeWidth={1.7} />
                            </button>

                            <button
                                type="button"
                                aria-label="Status"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <CheckCircle2 size={17} strokeWidth={1.7} />
                            </button>

                            <button
                                type="button"
                                aria-label="Settings"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <span className="text-base">⚙</span>
                            </button>

                            <div className="h-7 w-px bg-[#E1E4EA]" />

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDE5F5] text-[10px] font-semibold text-[#315A9E]">
                                AU
                            </div>

                        </div>
                    </header>

                    {/* SCROLLABLE CONTENT */}

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">

                        <div className="px-6 py-7 lg:px-8">

                            {/* PAGE HEADING */}

                            <div>

                                <div className="flex items-center gap-2 text-xs">

                                    <span className="text-[#343A47]">
                                        Home
                                    </span>

                                    <span className="text-[#A1A6B0]">
                                        ›
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/manager/sales')}
                                        className="text-[#343A47] hover:text-[#0757C9]"
                                    >
                                        Sales Management
                                    </button>

                                    <span className="text-[#A1A6B0]">
                                        ›
                                    </span>

                                    <span className="font-medium text-[#0757C9]">
                                        Add Sales Record
                                    </span>

                                </div>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25]">
                                    Add Sales Record
                                </h1>

                                <p className="mt-1 text-sm text-[#69707D]">
                                    Create a new sales transaction and generate an invoice.
                                </p>

                            </div>

                            {/* SUCCESS AND ERROR MESSAGES */}

                            {error && (
                                <div
                                    role="alert"
                                    className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                                >
                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    role="status"
                                    className="mt-4 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700"
                                >
                                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />

                                    <span>
                                        {success}

                                        {savedInvoice && (
                                            <span className="ml-1 font-semibold">
                                                Invoice: {savedInvoice}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* MAIN GRID */}

                            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* LEFT CONTENT */}

                                <div className="space-y-4">

                                    {/* CUSTOMER DETAILS */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-4">

                                            <div className="flex items-center gap-2">
                                                <UserPlus size={16} className="text-[#0757C9]" />

                                                <h2 className="text-sm font-semibold text-[#242936]">
                                                    Customer Details
                                                </h2>
                                            </div>

                                            <span className="text-[9px] text-[#858B97]">
                                                Enter customer information
                                            </span>

                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                                            <FormField
                                                label="Customer Name"
                                                required
                                                value={customer.name}
                                                placeholder="e.g. John Doe"
                                                onChange={(value) =>
                                                    updateCustomer('name', value)
                                                }
                                            />

                                            <FormField
                                                label="Customer ID"
                                                value={customer.id}
                                                placeholder="Customer reference (optional)"
                                                onChange={(value) =>
                                                    updateCustomer('id', value)
                                                }
                                            />

                                            <FormField
                                                label="Phone Number"
                                                value={customer.phone}
                                                placeholder="+94 77 000 0000"
                                                onChange={(value) =>
                                                    updateCustomer('phone', value)
                                                }
                                            />

                                            <FormField
                                                label="Email Address"
                                                type="email"
                                                value={customer.email}
                                                placeholder="john@example.com"
                                                onChange={(value) =>
                                                    updateCustomer('email', value)
                                                }
                                            />

                                            <div className="md:col-span-2">
                                                <FormField
                                                    label="Billing Address"
                                                    value={customer.address}
                                                    placeholder="Street, City, State..."
                                                    onChange={(value) =>
                                                        updateCustomer('address', value)
                                                    }
                                                />
                                            </div>

                                        </div>
                                    </section>

                                    {/* SALES DETAILS */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex items-center gap-2 border-b border-[#ECEEF2] pb-4">

                                            <FileText size={16} className="text-[#0757C9]" />

                                            <h2 className="text-sm font-semibold text-[#242936]">
                                                Sales Details
                                            </h2>

                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                            <div>
                                                <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Invoice ID
                                                </label>

                                                <div className="flex h-9 items-center rounded-md border border-[#E6E8ED] bg-[#F8F9FC] px-3 text-xs text-[#737A87]">
                                                    Generated when saved
                                                </div>
                                            </div>

                                            <FormField
                                                label="Sales Date"
                                                type="date"
                                                value={sales.date}
                                                onChange={(value) =>
                                                    updateSales('date', value)
                                                }
                                            />

                                            <SelectField
                                                label="Payment Method"
                                                value={sales.paymentMethod}
                                                options={[
                                                    'Bank Transfer',
                                                    'Cash',
                                                    'Credit Card',
                                                    'PayPal',
                                                    'Stripe',
                                                ]}
                                                onChange={(value) =>
                                                    updateSales('paymentMethod', value)
                                                }
                                            />

                                            <SelectField
                                                label="Payment Status"
                                                value={sales.paymentStatus}
                                                options={[
                                                    'Pending',
                                                    'Paid',
                                                    'Partially Paid',
                                                ]}
                                                onChange={(value) =>
                                                    updateSales('paymentStatus', value)
                                                }
                                            />

                                        </div>

                                        <p className="mt-3 text-[9px] text-[#858B97]">
                                            Invoice numbers are generated by the server. Payment status is recorded; partial payment amounts are not collected in this form.
                                        </p>

                                    </section>

                                    {/* LINE ITEMS */}

                                    <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-[#0757C9]" />

                                                <h2 className="text-sm font-semibold text-[#242936]">
                                                    Line Items
                                                </h2>
                                            </div>

                                            <div className="flex items-center gap-2">

                                                <div className="relative">

                                                    <Search
                                                        size={13}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858B97]"
                                                    />

                                                    <input
                                                        type="text"
                                                        value={productSearch}
                                                        onFocus={() => setShowProductResults(true)}
                                                        onChange={(e) => {
                                                            setProductSearch(e.target.value)
                                                            setShowProductResults(true)
                                                        }}
                                                        placeholder="Search product or scan barcode..."
                                                        className="h-8 w-52 rounded-md border border-[#D9DDE5] bg-white pl-8 pr-3 text-[10px] outline-none focus:border-[#0757C9]"
                                                    />

                                                    {showProductResults && (
                                                        <div className="absolute right-0 top-9 z-30 max-h-64 w-72 overflow-y-auto rounded-md border border-[#D9DDE5] bg-white shadow-lg">

                                                            {loadingProducts ? (
                                                                <p className="p-3 text-[10px] text-[#737A87]">
                                                                    Loading products...
                                                                </p>
                                                            ) : filteredProducts.length ? (
                                                                filteredProducts.map((product) => (
                                                                    <button
                                                                        type="button"
                                                                        key={product._id}
                                                                        onClick={() => selectProduct(product)}
                                                                        className="flex w-full items-center justify-between border-b border-[#ECEEF2] px-3 py-2.5 text-left hover:bg-[#F5F8FE]"
                                                                    >
                                                                        <span className="min-w-0">
                                                                            <span className="block truncate text-[10px] font-semibold text-[#343A47]">
                                                                                {product.productName}
                                                                            </span>

                                                                            <span className="block text-[9px] text-[#858B97]">
                                                                                {product.productId} · Stock: {product.quantity}
                                                                            </span>
                                                                        </span>

                                                                        <span className="ml-2 text-[10px] font-semibold text-[#0757C9]">
                                                                            {formatCurrency(product.price)}
                                                                        </span>
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <p className="p-3 text-[10px] text-[#737A87]">
                                                                    No matching products found.
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
                                                            setShowProductResults(true)
                                                        }
                                                    }}
                                                    disabled={!filteredProducts.length || loadingProducts}
                                                    className="flex h-8 items-center gap-1.5 rounded-md bg-[#0757C9] px-3 text-[10px] font-medium text-white hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Plus size={13} />
                                                    Add Product
                                                </button>

                                            </div>

                                        </div>

                                        <div className="overflow-x-auto">

                                            <table className="w-full min-w-170 border-collapse">

                                                <thead>
                                                    <tr className="bg-[#F8F9FC]">
                                                        <TableHeader>PRODUCT</TableHeader>
                                                        <TableHeader>SKU</TableHeader>
                                                        <TableHeader>UNIT PRICE</TableHeader>
                                                        <TableHeader>STOCK</TableHeader>
                                                        <TableHeader>QTY</TableHeader>
                                                        <TableHeader>DISC</TableHeader>
                                                        <TableHeader>TOTAL</TableHeader>
                                                        <TableHeader />
                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {items.map((item) => {
                                                        const qty = Math.max(
                                                            0,
                                                            Number(item.qty) || 0
                                                        )

                                                        const lineTotal =
                                                            item.price *
                                                            qty *
                                                            (1 - item.discount / 100) *
                                                            (1 + item.taxRate / 100)

                                                        return (
                                                            <tr
                                                                key={item._id}
                                                                className="border-t border-[#ECEEF2]"
                                                            >

                                                                <td className="px-3 py-3 text-xs font-medium text-[#343A47]">
                                                                    {item.product}
                                                                </td>

                                                                <td className="px-3 py-3 text-[10px] text-[#737A87]">
                                                                    {item.sku}
                                                                </td>

                                                                <td className="px-3 py-3 text-xs text-[#343A47]">
                                                                    {formatCurrency(item.price)}
                                                                </td>

                                                                <td className="px-3 py-3 text-[10px] text-[#0757C9]">
                                                                    {item.stock}
                                                                </td>

                                                                <td className="px-3 py-3">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={item.stock}
                                                                        step="1"
                                                                        value={item.qty}
                                                                        onChange={(e) =>
                                                                            updateItem(
                                                                                item._id,
                                                                                'qty',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="h-7 w-14 rounded border border-[#D9DDE5] text-center text-[10px] outline-none focus:border-[#0757C9]"
                                                                    />
                                                                </td>

                                                                <td className="px-3 py-3 text-[10px] text-[#59606E]">
                                                                    {item.discount}%
                                                                </td>

                                                                <td className="px-3 py-3 text-xs font-semibold text-[#0757C9]">
                                                                    {formatCurrency(lineTotal)}
                                                                </td>

                                                                <td className="px-3 py-3">
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Remove ${item.product}`}
                                                                        onClick={() => removeItem(item._id)}
                                                                        className="text-[#59606E] transition hover:text-red-500"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </td>

                                                            </tr>
                                                        )
                                                    })}

                                                    {!items.length && (
                                                        <tr>
                                                            <td
                                                                colSpan="8"
                                                                className="px-4 py-10 text-center text-xs text-[#858B97]"
                                                            >
                                                                {loadingProducts
                                                                    ? 'Loading inventory products...'
                                                                    : 'No products added. Search for an inventory product above.'}
                                                            </td>
                                                        </tr>
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                        <div className="border-t border-[#ECEEF2] px-5 py-3 text-[9px] text-[#858B97]">
                                            Discount and tax rates are taken from each inventory product. Final totals are recalculated and validated by the server.
                                        </div>

                                    </section>

                                    {/* ADDITIONAL NOTES */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <div className="flex items-center gap-2">
                                            <FileText size={15} className="text-[#0757C9]" />

                                            <h2 className="text-sm font-semibold text-[#242936]">
                                                Additional Notes
                                            </h2>
                                        </div>

                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Enter remarks or special instructions..."
                                            rows={4}
                                            className="mt-4 w-full resize-none rounded-md border border-[#D9DDE5] px-3 py-3 text-xs text-[#343A47] outline-none placeholder:text-[#9AA0AA] focus:border-[#0757C9]"
                                        />

                                    </section>

                                </div>

                                {/* RIGHT SIDE */}

                                <div className="space-y-4">

                                    {/* ORDER SUMMARY */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <h2 className="text-sm font-semibold text-[#242936]">
                                            Order Summary
                                        </h2>

                                        <div className="mt-5 space-y-3">

                                            <SummaryRow
                                                label="Subtotal"
                                                value={formatCurrency(subtotal)}
                                            />

                                            <SummaryRow
                                                label="Discount"
                                                value={`-${formatCurrency(discount)}`}
                                                valueClass="text-red-500"
                                            />

                                            <SummaryRow
                                                label="Tax"
                                                value={formatCurrency(tax)}
                                            />

                                            <div className="flex items-center justify-between gap-3">

                                                <label
                                                    htmlFor="shipping-cost"
                                                    className="text-xs text-[#737A87]"
                                                >
                                                    Shipping Fee
                                                </label>

                                                <input
                                                    id="shipping-cost"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={shipping}
                                                    onChange={(e) =>
                                                        setShipping(e.target.value)
                                                    }
                                                    className="h-7 w-24 rounded border border-[#D9DDE5] px-2 text-right text-xs outline-none focus:border-[#0757C9]"
                                                />

                                            </div>

                                            <div className="border-t border-[#E1E4EA] pt-4">

                                                <div className="flex items-center justify-between">

                                                    <span className="text-sm font-semibold text-[#343A47]">
                                                        Grand Total
                                                    </span>

                                                    <span className="text-xl font-bold text-[#0757C9]">
                                                        {formatCurrency(grandTotal)}
                                                    </span>

                                                </div>

                                            </div>

                                            <div className="flex items-center justify-between pt-2">

                                                <span className="text-[10px] text-[#737A87]">
                                                    Outstanding Balance
                                                </span>

                                                <span className="text-[11px] font-semibold text-[#343A47]">
                                                    {formatCurrency(outstanding)}
                                                </span>

                                            </div>

                                        </div>

                                    </section>

                                    {/* QUICK PREVIEW */}

                                    <section className="rounded-lg border border-[#E6E8ED] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <p className="text-[9px] font-medium uppercase tracking-wide text-[#858B97]">
                                            Quick Preview
                                        </p>

                                        <div className="mt-4 flex items-center justify-between">

                                            <div>

                                                <p className="text-lg font-bold text-[#343A47]">
                                                    {savedInvoice || 'Invoice pending'}
                                                </p>

                                                <p className="mt-3 text-[9px] font-semibold uppercase text-[#737A87]">
                                                    Bill To
                                                </p>

                                                <p className="mt-1 text-[10px] font-medium text-[#343A47]">
                                                    {customer.name || 'New Customer / Not Selected'}
                                                </p>

                                            </div>

                                            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-dashed border-[#E6E8ED] text-[9px] font-semibold text-[#A0A5AE]">
                                                {savedInvoice ? 'SAVED' : 'DRAFT'}
                                            </div>

                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#ECEEF2] pt-4">

                                            <div>
                                                <p className="text-[8px] uppercase text-[#858B97]">
                                                    Items
                                                </p>

                                                <p className="mt-1 text-xs font-semibold">
                                                    {items.length} SKUs
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[8px] uppercase text-[#858B97]">
                                                    Total
                                                </p>

                                                <p className="mt-1 text-xs font-semibold">
                                                    {formatCurrency(grandTotal)}
                                                </p>
                                            </div>

                                        </div>

                                    </section>

                                    {/* QUICK ACTIONS */}

                                    <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                        <QuickAction
                                            icon={FileText}
                                            title="Generate Invoice"
                                            description="Available after saving"
                                            disabled={!savedInvoice}
                                            onClick={() =>
                                                setError('PDF invoice generation is not implemented yet.')
                                            }
                                        />

                                        <QuickAction
                                            icon={Printer}
                                            title="Print Receipt"
                                            description="Receipt printing is not implemented"
                                            disabled
                                            onClick={() => { }}
                                        />

                                        <QuickAction
                                            icon={Mail}
                                            title="Email Invoice"
                                            description="Email delivery is not implemented"
                                            disabled
                                            last
                                            onClick={() => { }}
                                        />

                                    </section>

                                </div>

                            </div>

                            {/* BOTTOM ACTION BAR */}

                            <section className="mt-4 rounded-lg border border-[#E6E8ED] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">

                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                    <div className="flex items-center gap-2 text-[10px] text-[#59606E]">

                                        <AlertCircle size={13} className="text-[#0757C9]" />

                                        <span>Validation:</span>

                                        <span className={
                                            validationText === 'Ready to save'
                                                ? 'text-green-600'
                                                : 'text-red-500'
                                        }>
                                            {validationText}
                                        </span>

                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2">

                                        <button
                                            type="button"
                                            onClick={() => navigate('/manager/sales')}
                                            className="flex h-8 items-center gap-1.5 rounded-md border border-[#D9DDE5] px-4 text-[10px] font-medium text-[#454B58] hover:bg-[#F8F9FC]"
                                        >
                                            <X size={12} />
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => saveSale('Draft')}
                                            className="flex h-8 items-center gap-1.5 rounded-md border border-[#0757C9] px-4 text-[10px] font-medium text-[#0757C9] hover:bg-[#EEF3FF] disabled:opacity-50"
                                        >
                                            {saving
                                                ? <Loader2 size={12} className="animate-spin" />
                                                : <Save size={12} />
                                            }
                                            Save as Draft
                                        </button>

                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => saveSale('Completed')}
                                            className="flex h-8 items-center gap-1.5 rounded-md bg-[#0757C9] px-4 text-[10px] font-medium text-white shadow-sm hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving
                                                ? <Loader2 size={12} className="animate-spin" />
                                                : <Save size={12} />
                                            }
                                            Complete Sale
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!savedInvoice}
                                            onClick={() =>
                                                setError('PDF invoice generation is not implemented yet.')
                                            }
                                            className="flex h-8 items-center gap-1.5 rounded-md border border-[#C8D5F2] bg-[#EEF3FF] px-4 text-[10px] font-medium text-[#0757C9] hover:bg-[#E4EBFF] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <FileText size={12} />
                                            Generate Invoice
                                        </button>

                                    </div>

                                </div>

                            </section>

                            {/* FOOTER */}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">

                                <div className="flex flex-col gap-3 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">

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

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
    label,
    required = false,
    value,
    placeholder,
    onChange,
    type = 'text',
}) {
    return (
        <div>

            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                {label}

                {required && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </label>

            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-full rounded-md border border-[#D9DDE5] bg-white px-3 text-xs text-[#343A47] outline-none transition placeholder:text-[#9AA0AA] focus:border-[#0757C9] focus:ring-1 focus:ring-[#0757C9]/10"
            />

        </div>
    )
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
    label,
    value,
    options,
    onChange,
}) {
    return (
        <div>

            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                {label}
            </label>

            <div className="relative">

                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-full appearance-none rounded-md border border-[#D9DDE5] bg-white px-3 pr-8 text-xs text-[#343A47] outline-none focus:border-[#0757C9]"
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737A87]"
                />

            </div>

        </div>
    )
}

/* =========================================================
   TABLE HEADER
========================================================= */

function TableHeader({ children }) {
    return (
        <th className="px-3 py-3 text-left text-[8px] font-semibold tracking-wide text-[#59606E]">
            {children}
        </th>
    )
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
    label,
    value,
    valueClass = 'text-[#343A47]',
}) {
    return (
        <div className="flex items-center justify-between">

            <span className="text-xs text-[#737A87]">
                {label}
            </span>

            <span className={`text-xs font-medium ${valueClass}`}>
                {value}
            </span>

        </div>
    )
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
    icon: Icon,
    title,
    description,
    last = false,
    disabled = true,
    onClick,
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`
                flex
                w-full
                items-center
                justify-between
                px-4
                py-3
                text-left
                transition
                ${!last ? 'border-b border-[#ECEEF2]' : ''}
                ${disabled
                    ? 'cursor-not-allowed opacity-55'
                    : 'hover:bg-[#F8F9FC]'
                }
            `}
        >

            <div className="flex items-center gap-3">

                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EEF3FF] text-[#0757C9]">
                    <Icon size={15} />
                </span>

                <span>

                    <span className="block text-[10px] font-semibold text-[#343A47]">
                        {title}
                    </span>

                    <span className="mt-0.5 block text-[9px] text-[#858B97]">
                        {description}
                    </span>

                </span>

            </div>

            <span className="text-[#858B97]">
                ›
            </span>

        </button>
    )
}

export default AddSalesRecord