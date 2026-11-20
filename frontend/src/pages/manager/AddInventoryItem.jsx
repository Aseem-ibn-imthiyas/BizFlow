
import ManagerSidebar from '../../components/sidebar/ManagerSidebar';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Bell,
    CircleHelp,
    Search,
    UploadCloud,
    Info,
    PackageCheck,
    DollarSign,
    Truck,
    Barcode,
    ChevronDown,
    Check,
    Image as ImageIcon,
    RotateCcw,
    Save,
    Eye,
    X,
    LoaderCircle,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

/* =========================================================
   STATUS OPTION
========================================================= */

function StatusOption({ title, description, value, selected, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`w-full rounded-lg border p-4 text-left transition ${selected
                    ? 'border-[#4C82E8] bg-[#F5F8FF]'
                    : 'border-[#E3E6ED] bg-white hover:border-[#C9D2E5]'
                }`}
        >
            <div className="flex items-start gap-3">
                <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected
                            ? 'border-[#0757C9] bg-[#0757C9]'
                            : 'border-[#CBD1DC]'
                        }`}
                >
                    {selected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                </span>

                <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#242936]">
                        {title}
                    </span>
                    <span className="mt-1 block text-[10px] leading-4 text-[#7A808C]">
                        {description}
                    </span>
                </span>
            </div>
        </button>
    );
}

/* =========================================================
   FORM INPUT
========================================================= */

function FormInput({
    label,
    required = false,
    value,
    onChange,
    placeholder,
    type = 'text',
    disabled = false,
    min,
    step,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[10px] font-semibold text-[#343A47]">
                {label}
                {required && (
                    <span className="ml-1 text-[#E53935]">*</span>
                )}
            </span>

            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                min={min}
                step={step}
                className="
                    h-10 w-full rounded-md border border-[#D9DDE7]
                    bg-white px-3 text-xs text-[#343A47] outline-none
                    transition placeholder:text-[#9AA1AE]
                    focus:border-[#4C82E8] focus:ring-2 focus:ring-[#E8F0FF]
                    disabled:bg-[#F5F6F9]
                "
            />
        </label>
    );
}

/* =========================================================
   SELECT INPUT
========================================================= */

function FormSelect({ label, required = false, value, onChange, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[10px] font-semibold text-[#343A47]">
                {label}
                {required && (
                    <span className="ml-1 text-[#E53935]">*</span>
                )}
            </span>

            <div className="relative">
                <select
                    value={value}
                    onChange={onChange}
                    className="
                        h-10 w-full appearance-none rounded-md
                        border border-[#D9DDE7] bg-white px-3 pr-9
                        text-xs text-[#343A47] outline-none transition
                        focus:border-[#4C82E8] focus:ring-2 focus:ring-[#E8F0FF]
                    "
                >
                    {children}
                </select>

                <ChevronDown
                    size={15}
                    strokeWidth={1.8}
                    className="
                        pointer-events-none absolute right-3 top-1/2
                        -translate-y-1/2 text-[#727987]
                    "
                />
            </div>
        </label>
    );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({ icon: Icon, title, badge, children }) {
    return (
        <section
            className="
                overflow-hidden rounded-lg border border-[#E4E7ED]
                bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]
            "
        >
            <div
                className="
                    flex items-center justify-between border-b
                    border-[#ECEEF2] px-5 py-4
                "
            >
                <div className="flex items-center gap-3">
                    <span
                        className="
                            flex h-7 w-7 items-center justify-center
                            rounded-md bg-[#EEF4FF] text-[#0757C9]
                        "
                    >
                        <Icon size={16} strokeWidth={1.8} />
                    </span>

                    <h3 className="text-sm font-semibold text-[#242936]">
                        {title}
                    </h3>
                </div>

                {badge && (
                    <span
                        className="
                            rounded bg-[#ECEEF4] px-2 py-1 text-[9px]
                            font-semibold uppercase text-[#646B78]
                        "
                    >
                        {badge}
                    </span>
                )}
            </div>

            <div className="p-5">{children}</div>
        </section>
    );
}

/* =========================================================
   HEADER
========================================================= */

function ManagerHeader() {
    return (
        <header
            className="
                sticky top-0 z-20 flex h-16 shrink-0 items-center
                justify-between border-b border-[#E1E4EA] bg-white
                px-6 lg:px-8
            "
        >
            <div className="relative w-72">
                <Search
                    size={16}
                    strokeWidth={1.8}
                    className="
                        pointer-events-none absolute left-3 top-1/2
                        -translate-y-1/2 text-[#7D8491]
                    "
                />

                <input
                    type="text"
                    placeholder="Search users, reports, settings..."
                    className="
                        h-9 w-full rounded-md border border-transparent
                        bg-[#F1F3FA] pl-10 pr-4 text-xs text-[#343A47]
                        outline-none transition placeholder:text-[#8B919D]
                        focus:border-[#D4DCF0] focus:bg-white
                    "
                />
            </div>

            <div className="flex items-center gap-5">
                <button
                    type="button"
                    aria-label="Messages"
                    className="text-[#59606E] transition hover:text-[#0757C9]"
                >
                    <span className="text-sm">✉</span>
                </button>

                <button
                    type="button"
                    aria-label="Notifications"
                    className="text-[#59606E] transition hover:text-[#0757C9]"
                >
                    <Bell size={18} strokeWidth={1.7} />
                </button>

                <button
                    type="button"
                    aria-label="Help"
                    className="text-[#59606E] transition hover:text-[#0757C9]"
                >
                    <CircleHelp size={18} strokeWidth={1.7} />
                </button>

                <div className="h-7 w-px bg-[#E1E4EA]" />

                <div
                    className="
                        flex h-9 w-9 items-center justify-center
                        rounded-full bg-[#DDE5F5] text-xs font-semibold
                        text-[#315A9E]
                    "
                >
                    EM
                </div>
            </div>
        </header>
    );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function AddInventoryItem() {

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [productName, setProductName] = useState('');
    const [productCode, setProductCode] = useState('');
    const [barcode, setBarcode] = useState('');
    const [category, setCategory] = useState('Electronics');
    const [description, setDescription] = useState('');

    const [quantity, setQuantity] = useState('0');
    const [minStock, setMinStock] = useState('10');
    const [unit, setUnit] = useState('Pieces');
    const [warehouse, setWarehouse] = useState('Central Hub A');
    const [storageLocation, setStorageLocation] = useState('');

    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [discount, setDiscount] = useState('0');
    const [taxRate, setTaxRate] = useState('15');

    const [supplierName, setSupplierName] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [email, setEmail] = useState('');
    const [supplierAddress, setSupplierAddress] = useState('');

    const [status, setStatus] = useState('active');
    const [imagePreview, setImagePreview] = useState(null);

    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const [imageFile, setImageFile] = useState(null);

    /* =====================================================
       CALCULATIONS
    ===================================================== */

    const cost = Number(costPrice) || 0;
    const selling = Number(sellingPrice) || 0;
    const discountValue = Number(discount) || 0;
    const tax = Number(taxRate) || 0;

    const discountedPrice =
        selling - selling * (discountValue / 100);

    const grossProfit = discountedPrice - cost;

    const margin =
        discountedPrice > 0
            ? (grossProfit / discountedPrice) * 100
            : 0;

    const finalTaxAmount = discountedPrice * (tax / 100);

    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (!allowedTypes.includes(file.type)) {
            setFormError('Please select a JPG, PNG, GIF or WEBP image.');
            event.target.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setFormError('The image must not exceed 2MB.');
            event.target.value = '';
            return;
        }

        setFormError('');
        setImageFile(file);

        const reader = new FileReader();

        reader.onload = () => {
            setImagePreview(reader.result);
        };

        reader.readAsDataURL(file);
    };
    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /* =====================================================
       RESET
    ===================================================== */

    const handleReset = () => {
        if (isSaving) return;

        setProductName('');
        setProductCode('');
        setBarcode('');
        setCategory('Electronics');
        setDescription('');

        setQuantity('0');
        setMinStock('10');
        setUnit('Pieces');
        setWarehouse('Central Hub A');
        setStorageLocation('');

        setCostPrice('');
        setSellingPrice('');
        setDiscount('0');
        setTaxRate('15');

        setSupplierName('');
        setSupplierId('');
        setContactNumber('');
        setEmail('');
        setSupplierAddress('');

        setStatus('active');
        removeImage();

        setFormError('');
        setFormSuccess('');
    };

    /* =====================================================
       VALIDATION
    ===================================================== */

    const validateForm = () => {
        if (!productName.trim()) {
            return 'Please enter the product name.';
        }

        if (!productCode.trim()) {
            return 'Please enter the Product Code / SKU.';
        }

        if (!category.trim()) {
            return 'Please select a product category.';
        }

        if (
            sellingPrice.trim() === '' ||
            !Number.isFinite(Number(sellingPrice)) ||
            Number(sellingPrice) < 0
        ) {
            return 'Please enter a valid selling price (0 or higher).';
        }

        if (
            quantity.trim() === '' ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0
        ) {
            return 'Quantity must be a whole number of 0 or higher.';
        }

        if (
            minStock.trim() === '' ||
            !Number.isInteger(Number(minStock)) ||
            Number(minStock) < 0
        ) {
            return 'Minimum stock level must be a whole number of 0 or higher.';
        }

        return null;
    };

    /* =====================================================
       SAVE TO BACKEND
    ===================================================== */

    const handleSave = async () => {
        if (isSaving) return;

        setFormError('');
        setFormSuccess('');

        const validationError = validateForm();

        if (validationError) {
            setFormError(validationError);
            return;
        }

        const payload = {
            productId: productCode.trim().toUpperCase(),
            productName: productName.trim(),
            category: category.trim(),
            description: description.trim(),

            barcode: barcode.trim(),
            costPrice: Number(costPrice),
            price: Number(sellingPrice),
            discount: Number(discount),
            taxRate: Number(taxRate),

            quantity: Number(quantity),
            minimumStockLevel: Number(minStock),
            storageLocation: storageLocation.trim(),
            supplier: supplierName.trim(),
        };

        try {
            setIsSaving(true);

            // Create the inventory product.
            const response = await api.post('/inventory', payload);

            const createdProduct = response?.data;

            if (!createdProduct?._id) {
                throw new Error('Product was created, but its ID could not be retrieved.');
            }

            // Upload the product image if one was selected.
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);

                await api.postFormData(
                    `/inventory/${createdProduct._id}/image`,
                    formData
                );
            }

            setFormSuccess(
                response?.message || 'Inventory item created successfully.'
            );

            // Allow the success message to appear before navigating.
            setTimeout(() => {
                navigate('/manager/inventory');
            }, 800);
        } catch (error) {
            const message = error.message || 'Failed to save inventory item.';

            if (
                message.toLowerCase().includes('already exists') ||
                message.toLowerCase().includes('duplicate')
            ) {
                setFormError(
                    'This Product ID already exists. Please use a different Product Code / SKU.'
                );
            } else {
                setFormError(message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">

                <ManagerSidebar />

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    <ManagerHeader />

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-6 py-7 lg:px-8">

                            {/* PAGE HEADING */}

                            <div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-[#343A47]">Home</span>
                                    <span className="text-[#A1A6B0]">/</span>
                                    <span className="text-[#343A47]">
                                        Inventory Management
                                    </span>
                                    <span className="text-[#A1A6B0]">/</span>
                                    <span className="font-medium text-[#0757C9]">
                                        Add Inventory Item
                                    </span>
                                </div>

                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25]">
                                    Add Inventory Item
                                </h2>

                                <p className="mt-1 text-sm text-[#69707D]">
                                    Create a new inventory record and manage
                                    product information in real-time.
                                </p>
                            </div>

                            {/* FEEDBACK */}

                            {(formError || formSuccess) && (
                                <div
                                    className={`mt-5 flex items-start gap-3 rounded-lg border p-4 ${formError
                                            ? 'border-red-200 bg-red-50 text-red-700'
                                            : 'border-green-200 bg-green-50 text-green-700'
                                        }`}
                                >
                                    {formError ? (
                                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                    ) : (
                                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                                    )}

                                    <p className="text-xs font-medium">
                                        {formError || formSuccess}
                                    </p>
                                </div>
                            )}

                            {/* MAIN GRID */}

                            <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* LEFT COLUMN */}

                                <div className="min-w-0 space-y-5">

                                    {/* PRODUCT INFORMATION */}

                                    <SectionCard
                                        icon={Info}
                                        title="Product Information"
                                        badge="General"
                                    >
                                        <div>
                                            <p className="mb-2 text-[10px] font-semibold text-[#343A47]">
                                                Product Image
                                            </p>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />

                                            {imagePreview ? (
                                                <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-lg border border-[#D9DDE7] bg-[#F8F9FC]">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Product preview"
                                                        className="h-full max-w-full object-contain"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={removeImage}
                                                        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#555D6B] shadow hover:text-red-500"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#D3D9E5] bg-white transition hover:border-[#75A0E8] hover:bg-[#FAFCFF]"
                                                >
                                                    <UploadCloud
                                                        size={30}
                                                        strokeWidth={1.5}
                                                        className="text-[#B5BED0]"
                                                    />

                                                    <span className="mt-3 text-xs font-semibold text-[#4D5563]">
                                                        Drop image here or click to upload
                                                    </span>

                                                    <span className="mt-1 text-[9px] text-[#8A919E]">
                                                        Supports: JPG, PNG, WEBP (Max 5MB)
                                                    </span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <FormInput
                                                    label="Product Name"
                                                    required
                                                    value={productName}
                                                    onChange={(e) => setProductName(e.target.value)}
                                                    placeholder="e.g. Quantum X-1 Processor"
                                                />

                                                <p className="mt-1 flex items-center gap-1 text-[9px] text-[#0757C9]">
                                                    <Check size={10} />
                                                    Required field
                                                </p>
                                            </div>

                                            <FormInput
                                                label="Product Code / SKU"
                                                required
                                                value={productCode}
                                                onChange={(e) => setProductCode(e.target.value)}
                                                placeholder="SKU-2024-001"
                                            />
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="block">
                                                    <span className="mb-2 block text-[10px] font-semibold text-[#343A47]">
                                                        Barcode
                                                    </span>

                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={barcode}
                                                            onChange={(e) => setBarcode(e.target.value)}
                                                            placeholder="Scan or type barcode"
                                                            className="h-10 w-full rounded-md border border-[#D9DDE7] bg-white px-3 pr-10 text-xs outline-none focus:border-[#4C82E8] focus:ring-2 focus:ring-[#E8F0FF]"
                                                        />

                                                        <Barcode
                                                            size={17}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707786]"
                                                        />
                                                    </div>
                                                </label>
                                            </div>

                                            <FormSelect
                                                label="Category"
                                                required
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                            >
                                                <option>Electronics</option>
                                                <option>Furniture</option>
                                                <option>Office Supplies</option>
                                                <option>Software</option>
                                                <option>Hardware</option>
                                                <option>Other</option>
                                            </FormSelect>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block">
                                                <span className="mb-2 block text-[10px] font-semibold text-[#343A47]">
                                                    Description
                                                </span>

                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows={4}
                                                    placeholder="Enter detailed product specifications and features..."
                                                    className="w-full resize-none rounded-md border border-[#D9DDE7] bg-white px-3 py-3 text-xs text-[#343A47] outline-none placeholder:text-[#9AA1AE] focus:border-[#4C82E8] focus:ring-2 focus:ring-[#E8F0FF]"
                                                />
                                            </label>
                                        </div>
                                    </SectionCard>

                                    {/* STOCK DETAILS */}

                                    <SectionCard
                                        icon={PackageCheck}
                                        title="Stock Details"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <FormInput
                                                label="Current Quantity"
                                                required
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                placeholder="0"
                                            />

                                            <FormInput
                                                label="Min Stock Level"
                                                required
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={minStock}
                                                onChange={(e) => setMinStock(e.target.value)}
                                                placeholder="10"
                                            />

                                            <FormSelect
                                                label="Unit of Measure"
                                                value={unit}
                                                onChange={(e) => setUnit(e.target.value)}
                                            >
                                                <option>Pieces</option>
                                                <option>Boxes</option>
                                                <option>Units</option>
                                                <option>Kg</option>
                                                <option>Litres</option>
                                            </FormSelect>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormInput
                                                label="Warehouse Location"
                                                value={warehouse}
                                                onChange={(e) => setWarehouse(e.target.value)}
                                                placeholder="Central Hub A"
                                            />

                                            <FormInput
                                                label="Storage Location"
                                                value={storageLocation}
                                                onChange={(e) => setStorageLocation(e.target.value)}
                                                placeholder="Aisle 4, Shelf 12, Bin B"
                                            />
                                        </div>
                                    </SectionCard>

                                    {/* PRICING */}

                                    <SectionCard
                                        icon={DollarSign}
                                        title="Pricing & Financials"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                            <FormInput
                                                label="Cost Price ($)"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={costPrice}
                                                onChange={(e) => setCostPrice(e.target.value)}
                                                placeholder="0.00"
                                            />

                                            <FormInput
                                                label="Selling Price ($)"
                                                required
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={sellingPrice}
                                                onChange={(e) => setSellingPrice(e.target.value)}
                                                placeholder="0.00"
                                            />

                                            <FormInput
                                                label="Discount (%)"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={discount}
                                                onChange={(e) => setDiscount(e.target.value)}
                                                placeholder="0"
                                            />

                                            <FormInput
                                                label="Tax Rate (%)"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(e.target.value)}
                                                placeholder="15"
                                            />
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-[#F2F4FF] p-4 sm:grid-cols-3">
                                            <div>
                                                <p className="text-[10px] font-medium text-[#69707D]">
                                                    Gross Profit
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-[#242936]">
                                                    ${grossProfit.toFixed(2)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-medium text-[#69707D]">
                                                    Margin
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-[#0757C9]">
                                                    {margin.toFixed(0)}%
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-medium text-[#69707D]">
                                                    Final Tax Amount
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-[#242936]">
                                                    ${finalTaxAmount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </SectionCard>

                                    {/* SUPPLIER */}

                                    <SectionCard
                                        icon={Truck}
                                        title="Supplier Details"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormInput
                                                label="Supplier Name"
                                                value={supplierName}
                                                onChange={(e) => setSupplierName(e.target.value)}
                                                placeholder="Global Tech Solutions"
                                            />

                                            <FormInput
                                                label="Supplier ID"
                                                value={supplierId}
                                                onChange={(e) => setSupplierId(e.target.value)}
                                                placeholder="SUP-9981"
                                            />

                                            <FormInput
                                                label="Contact Number"
                                                value={contactNumber}
                                                onChange={(e) => setContactNumber(e.target.value)}
                                                placeholder="+1 (555) 000-0000"
                                            />

                                            <FormInput
                                                label="Email Address"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="orders@globaltech.com"
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <FormInput
                                                label="Supplier Address"
                                                value={supplierAddress}
                                                onChange={(e) => setSupplierAddress(e.target.value)}
                                                placeholder="123 Tech Parkway, Silicon Valley, CA 94043"
                                            />
                                        </div>
                                    </SectionCard>
                                </div>

                                {/* RIGHT COLUMN */}

                                <div className="space-y-5">

                                    {/* PRODUCT STATUS */}

                                    <section className="overflow-hidden rounded-lg border border-[#E4E7ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                                        <div className="border-b border-[#ECEEF2] px-5 py-4">
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Product Status
                                            </h3>
                                        </div>

                                        <div className="space-y-3 p-5">
                                            <StatusOption
                                                title="Active"
                                                description="Visible in store and purchasable."
                                                value="active"
                                                selected={status === 'active'}
                                                onClick={setStatus}
                                            />

                                            <StatusOption
                                                title="Inactive"
                                                description="Hidden from store but data preserved."
                                                value="inactive"
                                                selected={status === 'inactive'}
                                                onClick={setStatus}
                                            />

                                            <StatusOption
                                                title="Discontinued"
                                                description="Historical record only, no longer stocked."
                                                value="discontinued"
                                                selected={status === 'discontinued'}
                                                onClick={setStatus}
                                            />
                                        </div>
                                    </section>

                                    {/* LIVE PREVIEW */}

                                    <section className="overflow-hidden rounded-lg border border-[#E4E7ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                                        <div className="border-b border-[#ECEEF2] px-5 py-4">
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Live Preview
                                            </h3>
                                        </div>

                                        <div className="p-5">
                                            <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg bg-[#F1F3F7]">
                                                {imagePreview ? (
                                                    <img
                                                        src={imagePreview}
                                                        alt="Product"
                                                        className="h-full w-full object-contain"
                                                    />
                                                ) : (
                                                    <ImageIcon
                                                        size={38}
                                                        strokeWidth={1.2}
                                                        className="text-[#B8BFCC]"
                                                    />
                                                )}
                                            </div>

                                            <h3 className="mt-4 text-center text-lg font-bold text-[#242936]">
                                                {productName || 'New Product'}
                                            </h3>

                                            <div className="mt-1 flex justify-center">
                                                <span className="rounded-full bg-[#ECEEF4] px-3 py-1 text-[9px] font-semibold text-[#6C7381]">
                                                    {category || 'Uncategorized'}
                                                </span>
                                            </div>

                                            <div className="mt-6 border-t border-[#ECEEF2] pt-5">
                                                <div className="grid grid-cols-2 gap-4 text-center">
                                                    <div>
                                                        <p className="text-[8px] font-semibold uppercase text-[#858B97]">
                                                            Selling Price
                                                        </p>
                                                        <p className="mt-1 text-sm font-bold text-[#242936]">
                                                            ${selling.toFixed(2)}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[8px] font-semibold uppercase text-[#858B97]">
                                                            Availability
                                                        </p>
                                                        <p
                                                            className={`mt-1 text-sm font-bold ${Number(quantity) > 0
                                                                    ? 'text-[#18A957]'
                                                                    : 'text-[#E53935]'
                                                                }`}
                                                        >
                                                            {Number(quantity) > 0
                                                                ? 'In Stock'
                                                                : 'Out of Stock'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* QUICK ACTIONS */}

                                    <section className="overflow-hidden rounded-lg border border-[#E4E7ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                                        <div className="border-b border-[#ECEEF2] px-5 py-4">
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Quick Actions
                                            </h3>
                                        </div>

                                        <div className="divide-y divide-[#ECEEF2]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!productCode.trim()) {
                                                        setFormError('Enter a Product Code / SKU before generating a barcode.');
                                                        return;
                                                    }

                                                    setBarcode(productCode.trim().toUpperCase());
                                                    setFormError('');
                                                }}
                                                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#F8FAFF]"
                                            >
                                                <span className="flex items-center gap-3">
                                                    <Barcode size={16} className="text-[#4E5562]" />
                                                    <span className="text-xs font-medium text-[#343A47]">
                                                        Use Product ID as Barcode
                                                    </span>
                                                </span>
                                                <span className="text-[#A0A6B1]">›</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#F8FAFF]"
                                            >
                                                <span className="flex items-center gap-3">
                                                    <UploadCloud size={16} className="text-[#4E5562]" />
                                                    <span className="text-xs font-medium text-[#343A47]">
                                                        Upload Product Image
                                                    </span>
                                                </span>
                                                <span className="text-[#A0A6B1]">›</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => window.scrollTo({
                                                    top: 0,
                                                    behavior: 'smooth',
                                                })}
                                                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#F8FAFF]"
                                            >
                                                <span className="flex items-center gap-3">
                                                    <Eye size={16} className="text-[#4E5562]" />
                                                    <span className="text-xs font-medium text-[#343A47]">
                                                        Full Preview
                                                    </span>
                                                </span>
                                                <span className="text-[#A0A6B1]">›</span>
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* BOTTOM ACTION BAR */}

                            <div className="sticky bottom-0 z-10 mt-6 rounded-lg border border-[#E4E7ED] bg-white/95 p-4 shadow-[0_-3px_15px_rgba(15,23,42,0.06)] backdrop-blur">
                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">

                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => navigate('/manager/inventory')}
                                        className="h-10 rounded-md border border-[#C9CED8] px-5 text-xs font-medium text-[#343A47] transition hover:bg-[#F5F6F9] disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={handleReset}
                                        className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#C9CED8] px-5 text-xs font-medium text-[#343A47] transition hover:bg-[#F5F6F9] disabled:opacity-50"
                                    >
                                        <RotateCcw size={14} />
                                        Reset Form
                                    </button>

                                    <button
                                        type="button"
                                        disabled
                                        title="Draft saving is not currently supported by the inventory API."
                                        className="h-10 cursor-not-allowed rounded-md bg-[#EEF0F7] px-5 text-xs font-medium text-[#454B58] opacity-60"
                                    >
                                        Save as Draft
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#0052CC] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isSaving ? (
                                            <>
                                                <LoaderCircle size={15} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={14} />
                                                Save Inventory Item
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* FOOTER */}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <div className="flex flex-col gap-3 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">
                                    <p>
                                        © 2026 BizFlow | Cloud-Based SaaS Platform
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

export default AddInventoryItem;
