
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
    ArrowLeft,
    CheckCircle2,
    LoaderCircle,
    Package,
    Save,
    ShieldCheck,
} from 'lucide-react'

import StaffSidebar from '../../components/sidebar/StaffSidebar'
import StaffHeader from '../../components/header/StaffHeader'
import api from '../../services/api'


// READ ONLY FIELD
function ReadOnlyField({ label, value }) {
    return (
        <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-[#59606E]">
                {label}
            </label>

            <div className="flex min-h-10 items-center rounded-md border border-[#E1E4EA] bg-[#F6F7FA] px-3 py-2 text-xs text-[#59606E]">
                {value || '—'}
            </div>
        </div>
    )
}


// STOCK INPUT
function StockInput({ label, value, onChange, description }) {
    return (
        <div>
            <label className="mb-2 block text-xs font-semibold text-[#343A47]">
                {label}
            </label>

            <input
                type="number"
                min="0"
                step="1"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="
                    h-11
                    w-full
                    rounded-md
                    border
                    border-[#D9DDE7]
                    bg-white
                    px-3
                    text-sm
                    text-[#303642]
                    outline-none
                    transition
                    focus:border-[#0757C9]
                    focus:ring-1
                    focus:ring-[#0757C9]/10
                "
            />

            <p className="mt-2 text-[10px] text-[#858B97]">
                {description}
            </p>
        </div>
    )
}


function StaffEditInventoryItem() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [product, setProduct] = useState(null)
    const [currentStock, setCurrentStock] = useState('')
    const [minimumStockLevel, setMinimumStockLevel] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')


    // LOAD PRODUCT
    const loadProduct = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            if (!id) {
                throw new Error('Invalid inventory item ID.')
            }

            const response = await api.get(`/inventory/${id}`)
            const item = response?.data?.data || response?.data

            if (!item || !item._id) {
                throw new Error(
                    'The requested inventory item could not be found.'
                )
            }

            setProduct(item)
            setCurrentStock(String(item.quantity ?? 0))
            setMinimumStockLevel(String(item.minimumStockLevel ?? 0))

        } catch (err) {
            console.error('Staff inventory item loading error:', err)
            setError(err.message || 'Unable to load this inventory item.')

        } finally {
            setLoading(false)
        }
    }, [id])


    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProduct()
    }, [loadProduct])


    // VALIDATION
    const validateForm = () => {
        if (
            currentStock.trim() === '' ||
            !Number.isInteger(Number(currentStock)) ||
            Number(currentStock) < 0
        ) {
            return 'Current stock must be a whole number of 0 or higher.'
        }

        if (
            minimumStockLevel.trim() === '' ||
            !Number.isInteger(Number(minimumStockLevel)) ||
            Number(minimumStockLevel) < 0
        ) {
            return 'Minimum stock level must be a whole number of 0 or higher.'
        }

        return ''
    }


    // SAVE STOCK
    const handleSave = async (event) => {
        event.preventDefault()

        if (saving) return

        setError('')
        setSuccess('')

        const validationError = validateForm()

        if (validationError) {
            setError(validationError)
            return
        }

        // Staff can update only these two fields.
        const payload = {
            quantity: Number(currentStock),
            minimumStockLevel: Number(minimumStockLevel),
        }

        try {
            setSaving(true)

            const response = await api.patch(
                `/inventory/${id}`,
                payload
            )

            const updatedItem =
                response?.data?.data || response?.data

            setProduct((previous) => ({
                ...previous,
                ...(updatedItem && typeof updatedItem === 'object'
                    ? updatedItem
                    : {}),
                quantity: payload.quantity,
                minimumStockLevel: payload.minimumStockLevel,
            }))

            setSuccess(
                response?.message ||
                'Stock information updated successfully.'
            )

        } catch (err) {
            console.error('Staff stock update error:', err)

            setError(
                err.message || 'Unable to update stock information.'
            )

        } finally {
            setSaving(false)
        }
    }


    // STOCK STATUS
    const stockStatus = !product
        ? ''
        : Number(currentStock) === 0
            ? 'Out of Stock'
            : Number(currentStock) <= Number(minimumStockLevel)
                ? 'Low Stock'
                : 'In Stock'


    const statusClass =
        stockStatus === 'Out of Stock'
            ? 'bg-red-50 text-red-600'
            : stockStatus === 'Low Stock'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'


    return (
        <main className="
            flex
            h-dvh
            w-full
            overflow-hidden
            bg-[#FBFCFE]
            text-[#171B25]
        ">

            {/* SIDEBAR */}
            <aside className="
                hidden
                h-full
                w-60
                shrink-0
                overflow-hidden
                lg:block
                xl:w-64
            ">
                <StaffSidebar />
            </aside>


            {/* MAIN CONTENT AREA */}
            <div className="
                flex
                min-w-0
                flex-1
                flex-col
                overflow-hidden
            ">

                {/* HEADER */}
                <div className="z-30 h-16 shrink-0">
                    <StaffHeader />
                </div>


                {/* SCROLLABLE PAGE CONTENT */}
                <div className="
                    min-h-0
                    flex-1
                    overflow-y-auto
                    overflow-x-hidden
                ">

                    <div className="
                        mx-auto
                        w-full
                        max-w-[1600px]
                        px-4
                        py-6
                        sm:px-6
                        lg:px-8
                        xl:px-10
                    ">


                        {/* PAGE HEADER */}
                        <div className="
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-4
                        ">

                            <div>
                                <div className="flex items-center gap-2 text-[11px] text-[#69707D]">

                                    <span>Inventory</span>

                                    <span>›</span>

                                    <span className="font-medium text-[#171B25]">
                                        Update Stock
                                    </span>

                                </div>

                                <h1 className="
                                    mt-2
                                    text-2xl
                                    font-bold
                                    tracking-tight
                                    text-[#171B25]
                                    sm:text-3xl
                                ">
                                    Update Inventory Stock
                                </h1>

                                <p className="mt-2 text-sm text-[#69707D]">
                                    Update the current quantity and minimum stock level.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() => navigate('/staff/inventory')}
                                className="
                                    flex
                                    h-10
                                    items-center
                                    gap-2
                                    rounded-md
                                    border
                                    border-[#DDE1E8]
                                    bg-white
                                    px-4
                                    text-xs
                                    font-medium
                                    text-[#59606E]
                                    transition
                                    hover:bg-[#F8F9FC]
                                "
                            >
                                <ArrowLeft size={15} />
                                Back to Inventory
                            </button>

                        </div>


                        {/* PERMISSION NOTICE */}
                        <div className="
                            mt-6
                            flex
                            items-start
                            gap-3
                            rounded-xl
                            border
                            border-blue-100
                            bg-blue-50
                            p-5
                        ">

                            <ShieldCheck
                                size={20}
                                className="mt-0.5 shrink-0 text-[#0757C9]"
                            />

                            <div>
                                <p className="text-xs font-semibold text-[#174A91]">
                                    Staff Stock Management Access
                                </p>

                                <p className="mt-1.5 text-[11px] leading-5 text-[#49688F]">
                                    You can update current stock and minimum stock levels.
                                    Product details, pricing, supplier information and
                                    product images are managed by Managers.
                                </p>
                            </div>

                        </div>


                        {/* ERROR MESSAGE */}
                        {error && (
                            <div className="
                                mt-5
                                rounded-lg
                                border
                                border-red-200
                                bg-red-50
                                px-5
                                py-4
                                text-sm
                                text-red-700
                            ">
                                {error}
                            </div>
                        )}


                        {/* SUCCESS MESSAGE */}
                        {success && (
                            <div className="
                                mt-5
                                flex
                                items-center
                                gap-2
                                rounded-lg
                                border
                                border-emerald-200
                                bg-emerald-50
                                px-5
                                py-4
                                text-sm
                                text-emerald-700
                            ">
                                <CheckCircle2 size={17} />
                                {success}
                            </div>
                        )}


                        {/* LOADING */}
                        {loading ? (

                            <div className="
                                mt-8
                                flex
                                min-h-56
                                items-center
                                justify-center
                                text-sm
                                text-[#69707D]
                            ">
                                <LoaderCircle
                                    size={19}
                                    className="mr-2 animate-spin"
                                />

                                Loading product information...
                            </div>

                        ) : product ? (

                            <form
                                onSubmit={handleSave}
                                className="mt-7 space-y-6"
                            >


                                {/* PRODUCT INFORMATION */}
                                <section className="
                                    overflow-hidden
                                    rounded-xl
                                    border
                                    border-[#E3E6EC]
                                    bg-white
                                    shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                ">

                                    {/* SECTION HEADER */}
                                    <div className="
                                        flex
                                        items-center
                                        gap-3
                                        border-b
                                        border-[#ECEEF2]
                                        px-5
                                        py-4
                                    ">

                                        <div className="
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-[#EEF3FF]
                                            text-[#0757C9]
                                        ">
                                            <Package size={18} />
                                        </div>

                                        <div>
                                            <h2 className="text-sm font-semibold text-[#242936]">
                                                Product Information
                                            </h2>

                                            <p className="mt-0.5 text-[10px] text-[#858B97]">
                                                Read-only product details
                                            </p>
                                        </div>

                                    </div>


                                    {/* PRODUCT DETAILS */}
                                    <div className="
                                        grid
                                        grid-cols-1
                                        gap-5
                                        p-5
                                        sm:grid-cols-2
                                        lg:gap-6
                                    ">

                                        <ReadOnlyField
                                            label="Product Name"
                                            value={product.productName}
                                        />

                                        <ReadOnlyField
                                            label="Product Code"
                                            value={product.productId}
                                        />

                                        <ReadOnlyField
                                            label="Category"
                                            value={product.category}
                                        />

                                        <ReadOnlyField
                                            label="Supplier"
                                            value={product.supplier}
                                        />

                                    </div>

                                </section>


                                {/* STOCK INFORMATION */}
                                <section className="
                                    overflow-hidden
                                    rounded-xl
                                    border
                                    border-[#E3E6EC]
                                    bg-white
                                    shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                ">

                                    {/* SECTION HEADER */}
                                    <div className="
                                        flex
                                        items-center
                                        justify-between
                                        border-b
                                        border-[#ECEEF2]
                                        px-5
                                        py-4
                                    ">

                                        <div className="flex items-center gap-3">

                                            <div className="
                                                flex
                                                h-9
                                                w-9
                                                items-center
                                                justify-center
                                                rounded-lg
                                                bg-[#EEF3FF]
                                                text-[#0757C9]
                                            ">
                                                <Package size={18} />
                                            </div>

                                            <div>
                                                <h2 className="text-sm font-semibold text-[#242936]">
                                                    Stock Information
                                                </h2>

                                                <p className="mt-0.5 text-[10px] text-[#858B97]">
                                                    Editable by Staff
                                                </p>
                                            </div>

                                        </div>


                                        <span className={`
                                            rounded-full
                                            px-3
                                            py-1.5
                                            text-[10px]
                                            font-semibold
                                            ${statusClass}
                                        `}>
                                            {stockStatus}
                                        </span>

                                    </div>


                                    {/* STOCK INPUTS */}
                                    <div className="
                                        grid
                                        grid-cols-1
                                        gap-6
                                        p-5
                                        sm:grid-cols-2
                                        lg:gap-8
                                    ">

                                        <StockInput
                                            label="Current Stock Quantity"
                                            value={currentStock}
                                            onChange={setCurrentStock}
                                            description="Enter the actual quantity currently available."
                                        />

                                        <StockInput
                                            label="Minimum Stock Level"
                                            value={minimumStockLevel}
                                            onChange={setMinimumStockLevel}
                                            description="The system uses this value to identify low stock."
                                        />

                                    </div>

                                </section>


                                {/* ACTIONS */}
                                <div className="
                                    flex
                                    flex-wrap
                                    items-center
                                    justify-end
                                    gap-3
                                    pb-5
                                ">

                                    <button
                                        type="button"
                                        onClick={() => navigate('/staff/inventory')}
                                        disabled={saving}
                                        className="
                                            h-10
                                            rounded-md
                                            border
                                            border-[#DDE1E8]
                                            bg-white
                                            px-5
                                            text-xs
                                            font-medium
                                            text-[#59606E]
                                            transition
                                            hover:bg-[#F8F9FC]
                                            disabled:opacity-50
                                        "
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="
                                            flex
                                            h-10
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0757C9]
                                            px-5
                                            text-xs
                                            font-medium
                                            text-white
                                            transition
                                            hover:bg-[#0649A8]
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                        "
                                    >

                                        {saving ? (
                                            <LoaderCircle
                                                size={15}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Save size={15} />
                                        )}

                                        {saving
                                            ? 'Saving...'
                                            : 'Save Stock Changes'
                                        }

                                    </button>

                                </div>

                            </form>

                        ) : (

                            /* PRODUCT NOT AVAILABLE */
                            <div className="
                                mt-7
                                rounded-xl
                                border
                                border-[#DDE1E8]
                                bg-white
                                p-10
                                text-center
                            ">

                                <Package
                                    size={30}
                                    className="mx-auto text-[#A0A6B0]"
                                />

                                <p className="mt-4 text-sm font-semibold text-[#59606E]">
                                    Product not available
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate('/staff/inventory')}
                                    className="
                                        mt-4
                                        text-xs
                                        font-semibold
                                        text-[#0757C9]
                                        hover:underline
                                    "
                                >
                                    Return to Inventory
                                </button>

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </main>
    )
}

export default StaffEditInventoryItem
