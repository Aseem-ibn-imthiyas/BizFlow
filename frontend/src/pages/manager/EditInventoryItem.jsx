
import ManagerSidebar from '../../components/sidebar/ManagerSidebar';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Bell,
    Barcode,
    ChevronDown,
    CircleHelp,
    Clock3,
    DollarSign,
    ImagePlus,
    Package,
    Printer,
    RefreshCw,
    Save,
    Search,
    Settings,
    ShieldCheck,
    ShoppingCart,
    Trash2,
    Truck,
    UserRound,
    LoaderCircle,
    AlertCircle,
    CheckCircle2,
    X,
} from 'lucide-react';
import api from '../../services/api';

/* =========================================================
   REUSABLE INPUT
========================================================= */

function FormInput({
    label,
    value,
    onChange,
    type = 'text',
    readOnly = false,
    min,
    step,
}) {
    return (
        <div>
            <label className="mb-1.5 block text-[9px] font-semibold text-[#343A47]">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                min={min}
                step={step}
                className={`
                    h-9 w-full rounded-md border border-[#D9DDE7]
                    bg-white px-3 text-[11px] text-[#303642]
                    outline-none transition placeholder:text-[#9AA1AE]
                    focus:border-[#0757C9] focus:ring-1
                    focus:ring-[#0757C9]/10
                    ${readOnly ? 'bg-[#F1F3FA] text-[#777F8D]' : ''}
                `}
            />
        </div>
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
   MAIN COMPONENT
========================================================= */

function EditInventoryItem() {
    const navigate = useNavigate();
    const { id } = useParams();

    /* -----------------------------------------------------
       STATE
    ----------------------------------------------------- */

    const [product, setProduct] = useState(null);

    const [productName, setProductName] = useState('');
    const [productCode, setProductCode] = useState('');
    const [barcode, setBarcode] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    const [currentStock, setCurrentStock] = useState('0');
    const [minStockLevel, setMinStockLevel] = useState('5');
    const [reorderLevel, setReorderLevel] = useState('5');

    const [unitOfMeasure, setUnitOfMeasure] = useState('Pieces (pcs)');
    const [warehouse, setWarehouse] = useState('Main Warehouse A');
    const [storageLocation, setStorageLocation] = useState('');

    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('0');
    const [discount, setDiscount] = useState('0');
    const [taxRate, setTaxRate] = useState('0');

    const [supplier, setSupplier] = useState('');
    const [status, setStatus] = useState('Active');

    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const [initialValues, setInitialValues] = useState(null);

    /* -----------------------------------------------------
       CALCULATIONS
    ----------------------------------------------------- */

    const cost = Number(costPrice) || 0;
    const price = Number(sellingPrice) || 0;

    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    const discountAmount = price * ((Number(discount) || 0) / 100);
    const discountedPrice = price - discountAmount;

    const finalPrice =
        discountedPrice * (1 + (Number(taxRate) || 0) / 100);

    const stockStatus =
        Number(currentStock) === 0
            ? 'Out of Stock'
            : Number(currentStock) <= Number(minStockLevel)
                ? 'Low Stock'
                : 'In Stock';

    /* -----------------------------------------------------
       POPULATE FORM
    ----------------------------------------------------- */


    const populateForm = useCallback((item) => {
        setProduct(item);

        const values = {
            productName: item.productName || '',
            productCode: item.productId || '',
            category: item.category || '',
            description: item.description || '',
            barcode: item.barcode || '',
            currentStock: String(item.quantity ?? 0),
            minStockLevel: String(item.minimumStockLevel ?? 5),
            storageLocation: item.storageLocation || '',
            costPrice: String(item.costPrice ?? 0),
            sellingPrice: String(item.price ?? 0),
            discount: String(item.discount ?? 0),
            taxRate: String(item.taxRate ?? 0),
            supplier: item.supplier || '',
        };

        setProductName(values.productName);
        setProductCode(values.productCode);
        setCategory(values.category);
        setDescription(values.description);
        setBarcode(values.barcode);
        setCurrentStock(values.currentStock);
        setMinStockLevel(values.minStockLevel);
        setStorageLocation(values.storageLocation);
        setCostPrice(values.costPrice);
        setSellingPrice(values.sellingPrice);
        setDiscount(values.discount);
        setTaxRate(values.taxRate);
        setSupplier(values.supplier);

        // Display the existing Cloudinary image.
        setImagePreview(item.imageUrl || null);
        setImageFile(null);

        setInitialValues(values);
    }, []);


    /* -----------------------------------------------------
            LOAD PRODUCT FROM MONGODB
    ----------------------------------------------------- */

    useEffect(() => {
        let cancelled = false;

        if (!id) {
            Promise.resolve().then(() => {
                if (!cancelled) {
                    setFormError('Invalid inventory item ID.');
                    setLoading(false);
                }
            });

            return () => {
                cancelled = true;
            };
        }

        api.get(`/inventory/${id}`)
            .then((response) => {
                const item = response?.data?.data || response?.data;

                if (!item || !item._id) {
                    throw new Error('The requested inventory item could not be found.');
                }

                if (!cancelled) {
                    populateForm(item);
                    setFormError('');
                }
            })
            .catch((error) => {
                console.error('Failed to load inventory item:', error);

                if (!cancelled) {
                    setFormError(error.message || 'Failed to load inventory item.');
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
    }, [id, populateForm]);

    /* -----------------------------------------------------
       IMAGE CHANGE
    ----------------------------------------------------- */

    const handleImageChange = (event) => {
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
            setFormError('The image must be smaller than 2MB.');
            event.target.value = '';
            return;
        }

        const previewUrl = URL.createObjectURL(file);

        setImagePreview(previewUrl);
        setImageFile(file);
        setFormError('');
    };

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    const validateForm = () => {
        if (!productName.trim()) {
            return 'Please enter a product name.';
        }

        if (!category.trim()) {
            return 'Please select a product category.';
        }

        if (
            sellingPrice.trim() === '' ||
            !Number.isFinite(Number(sellingPrice)) ||
            Number(sellingPrice) < 0
        ) {
            return 'Please enter a valid selling price.';
        }

        if (
            currentStock.trim() === '' ||
            !Number.isInteger(Number(currentStock)) ||
            Number(currentStock) < 0
        ) {
            return 'Current stock must be a whole number of 0 or higher.';
        }

        if (
            minStockLevel.trim() === '' ||
            !Number.isInteger(Number(minStockLevel)) ||
            Number(minStockLevel) < 0
        ) {
            return 'Minimum stock level must be a whole number of 0 or higher.';
        }

        return null;
    };

    /* -----------------------------------------------------
       SAVE CHANGES
    ----------------------------------------------------- */

    const handleSave = async () => {
        if (isSaving || isDeleting) return;

        setFormError('');
        setFormSuccess('');

        const validationError = validateForm();

        if (validationError) {
            setFormError(validationError);
            return;
        }

        const payload = {
            productName: productName.trim(),
            category: category.trim(),
            description: description.trim(),
            barcode: barcode.trim(),
            costPrice: Number(costPrice),
            price: Number(sellingPrice),
            discount: Number(discount),
            taxRate: Number(taxRate),
            quantity: Number(currentStock),
            minimumStockLevel: Number(minStockLevel),
            storageLocation: storageLocation.trim(),
            supplier: supplier.trim(),
        };

        try {
            setIsSaving(true);

            const response = await api.patch(
                `/inventory/${id}`,
                payload
            );

            // Upload the selected image to Cloudinary.
            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append('image', imageFile);

                await api.postFormData(
                    `/inventory/${id}/image`,
                    imageFormData
                );
            }

            setFormSuccess(
                response?.message || 'Inventory item updated successfully.'
            );

            // Refresh the saved product data.
            // Update the local product preview using the saved values.
            setProduct((previous) => ({
                ...previous,
                ...payload,
                updatedAt: new Date().toISOString(),
            }));
        } catch (error) {
            console.error('Inventory update error:', error);
            setFormError(
                error.message || 'Failed to update inventory item.'
            );
        } finally {
            setIsSaving(false);
        }
    };

    /* -----------------------------------------------------
       RESET CHANGES
    ----------------------------------------------------- */

    const handleReset = () => {
        if (!initialValues || isSaving || isDeleting) return;

        setProductName(initialValues.productName);
        setProductCode(initialValues.productCode);
        setCategory(initialValues.category);
        setDescription(initialValues.description);
        setCurrentStock(initialValues.currentStock);
        setMinStockLevel(initialValues.minStockLevel);
        setSellingPrice(initialValues.sellingPrice);
        setSupplier(initialValues.supplier);

        setBarcode('');
        setReorderLevel(initialValues.minStockLevel);
        setUnitOfMeasure('Pieces (pcs)');
        setWarehouse('Main Warehouse A');
        setStorageLocation('');
        setCostPrice('');
        setDiscount('0');
        setTaxRate('0');
        setStatus('Active');

        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImagePreview(null);
        setImageFile(null);

        setFormError('');
        setFormSuccess('');
    };

    /* -----------------------------------------------------
       DELETE PRODUCT
    ----------------------------------------------------- */

    const handleDelete = async () => {
        if (isSaving || isDeleting) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete "${productName}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setIsDeleting(true);
            setFormError('');

            await api.delete(`/inventory/${id}`);

            navigate('/manager/inventory');
        } catch (error) {
            console.error('Inventory delete error:', error);
            setFormError(
                error.message || 'Failed to delete inventory item.'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    /* -----------------------------------------------------
       LOADING STATE
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
                        Loading inventory item...
                    </p>
                </div>
            </main>
        );
    }

    /* -----------------------------------------------------
       PRODUCT NOT FOUND / LOAD ERROR
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
                        {formError || 'The requested inventory item could not be found.'}
                    </p>

                    <div className="mt-5 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-md bg-[#0757C9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0045AD]"
                        >
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

                            <div className="flex items-center gap-2 text-[9px]">
                                <span className="text-[#343A47]">Home</span>
                                <span className="text-[#A1A6B0]">›</span>
                                <span className="text-[#343A47]">
                                    Inventory Management
                                </span>
                                <span className="text-[#A1A6B0]">›</span>
                                <span className="font-semibold text-[#0757C9]">
                                    Edit Inventory Item
                                </span>
                            </div>

                            {/* PAGE HEADING */}

                            <div className="mt-2">
                                <h2 className="text-2xl font-bold tracking-tight text-[#171B25]">
                                    Edit Inventory Item
                                </h2>
                                <p className="mt-1 text-[10px] text-[#69707D]">
                                    Update product information, stock levels,
                                    pricing, and supplier details.
                                </p>
                            </div>

                            {/* FEEDBACK */}

                            {(formError || formSuccess) && (
                                <div
                                    className={`mt-4 flex items-start gap-2 rounded-lg border p-3 ${formError
                                            ? 'border-red-200 bg-red-50 text-red-700'
                                            : 'border-green-200 bg-green-50 text-green-700'
                                        }`}
                                >
                                    {formError ? (
                                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    ) : (
                                        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                                    )}
                                    <p className="text-[10px] font-medium">
                                        {formError || formSuccess}
                                    </p>
                                </div>
                            )}

                            {/* MAIN GRID */}

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">

                                {/* LEFT COLUMN */}

                                <div className="space-y-4">

                                    {/* PRODUCT INFORMATION */}

                                    <SectionCard
                                        icon={Package}
                                        title="Product Information"
                                    >
                                        {/* IMAGE */}

                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-[#E0E3E9] bg-[#F6F7FA]">
                                                {imagePreview ? (
                                                    <>
                                                        <img
                                                            src={imagePreview}
                                                            alt="Product preview"
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                URL.revokeObjectURL(imagePreview);
                                                                setImagePreview(null);
                                                                setImageFile(null);
                                                            }}
                                                            className="absolute right-0 top-0 rounded-bl bg-white p-1 text-red-500"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <ImagePlus size={18} className="text-[#A0A6B2]" />
                                                )}
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="product-image"
                                                    className="inline-flex cursor-pointer items-center rounded-md border border-[#D8DDE7] bg-white px-3 py-1.5 text-[9px] font-medium text-[#343A47] hover:bg-[#F7F8FB]"
                                                >
                                                    Change Image
                                                </label>

                                                <input
                                                    id="product-image"
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />

                                                <p className="mt-1 text-[8px] text-[#8B919D]">
                                                    JPG, PNG, GIF or WEBP. Max 2MB.
                                                </p>
                                                {imageFile && (
                                                    <p className="mt-1 text-[8px] text-[#D97706]">
                                                        Preview only — image storage is not connected.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* PRODUCT NAME AND ID */}

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <FormInput
                                                label="Product Name"
                                                value={productName}
                                                onChange={(e) => setProductName(e.target.value)}
                                            />

                                            <FormInput
                                                label="Product Code / SKU (Read Only)"
                                                value={productCode}
                                                readOnly
                                            />
                                        </div>

                                        {/* BARCODE AND CATEGORY */}

                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-[9px] font-semibold text-[#343A47]">
                                                    Barcode
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={barcode}
                                                        onChange={(e) => setBarcode(e.target.value)}
                                                        placeholder="Enter barcode"
                                                        className="h-9 w-full rounded-md border border-[#D9DDE7] px-3 pr-9 text-[11px] outline-none focus:border-[#0757C9]"
                                                    />
                                                    <Barcode
                                                        size={14}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#59606E]"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[9px] font-semibold text-[#343A47]">
                                                    Category
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={category}
                                                        onChange={(e) => setCategory(e.target.value)}
                                                        className="h-9 w-full appearance-none rounded-md border border-[#D9DDE7] bg-white px-3 pr-8 text-[11px] outline-none focus:border-[#0757C9]"
                                                    >
                                                        <option value="">Select category</option>
                                                        {[
                                                            'Spices',
                                                            'Electronics',
                                                            'Furniture',
                                                            'Grocery',
                                                            'Clothing',
                                                            'Office Supplies',
                                                            'Software',
                                                            'Hardware',
                                                            'Other',
                                                        ].map((item) => (
                                                            <option key={item} value={item}>
                                                                {item}
                                                            </option>
                                                        ))}
                                                        {![
                                                            'Spices',
                                                            'Electronics',
                                                            'Furniture',
                                                            'Grocery',
                                                            'Clothing',
                                                            'Office Supplies',
                                                            'Software',
                                                            'Hardware',
                                                            'Other',
                                                        ].includes(category) && category && (
                                                                <option value={category}>
                                                                    {category}
                                                                </option>
                                                            )}
                                                    </select>
                                                    <ChevronDown
                                                        size={13}
                                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#69707D]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* DESCRIPTION */}

                                        <div className="mt-3">
                                            <label className="mb-1.5 block text-[9px] font-semibold text-[#343A47]">
                                                Product Description
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                                className="w-full resize-none rounded-md border border-[#D9DDE7] px-3 py-2 text-[10px] text-[#303642] outline-none focus:border-[#0757C9] focus:ring-1 focus:ring-[#0757C9]/10"
                                            />
                                        </div>
                                    </SectionCard>

                                    {/* STOCK DETAILS */}

                                    <SectionCard
                                        icon={Package}
                                        title="Stock Details"
                                        rightContent={
                                            <span
                                                className={`rounded-full px-2 py-1 text-[7px] font-bold uppercase ${stockStatus === 'In Stock'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-[#FFF0F0] text-[#E43D3D]'
                                                    }`}
                                            >
                                                {stockStatus}
                                            </span>
                                        }
                                    >
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <FormInput
                                                label="Current Stock"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={currentStock}
                                                onChange={(e) => setCurrentStock(e.target.value)}
                                            />

                                            <FormInput
                                                label="Min Stock Level"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={minStockLevel}
                                                onChange={(e) => setMinStockLevel(e.target.value)}
                                            />

                                            <FormInput
                                                label="Reorder Level (UI Only)"
                                                type="number"
                                                min="0"
                                                value={reorderLevel}
                                                onChange={(e) => setReorderLevel(e.target.value)}
                                            />
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div>
                                                <label className="mb-1.5 block text-[8px] font-semibold text-[#343A47]">
                                                    Unit of Measure
                                                </label>
                                                <select
                                                    value={unitOfMeasure}
                                                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                                                    className="h-9 w-full rounded-md border border-[#D9DDE7] bg-white px-3 text-[11px]"
                                                >
                                                    <option>Pieces (pcs)</option>
                                                    <option>Kilograms (kg)</option>
                                                    <option>Litres (L)</option>
                                                    <option>Boxes</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[8px] font-semibold text-[#343A47]">
                                                    Warehouse
                                                </label>
                                                <select
                                                    value={warehouse}
                                                    onChange={(e) => setWarehouse(e.target.value)}
                                                    className="h-9 w-full rounded-md border border-[#D9DDE7] bg-white px-3 text-[11px]"
                                                >
                                                    <option>Main Warehouse A</option>
                                                    <option>Main Warehouse B</option>
                                                    <option>Central Hub</option>
                                                </select>
                                            </div>

                                            <FormInput
                                                label="Storage Location"
                                                value={storageLocation}
                                                onChange={(e) => setStorageLocation(e.target.value)}
                                            />
                                        </div>
                                    </SectionCard>

                                    {/* PRICING AND SUPPLIER */}

                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                                        <SectionCard
                                            icon={DollarSign}
                                            title="Pricing"
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormInput
                                                    label="Cost Price"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={costPrice}
                                                    onChange={(e) => setCostPrice(e.target.value)}
                                                />

                                                <FormInput
                                                    label="Selling Price"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={sellingPrice}
                                                    onChange={(e) => setSellingPrice(e.target.value)}
                                                />

                                                <FormInput
                                                    label="Discount %"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                />

                                                <FormInput
                                                    label="Tax Rate %"
                                                    type="number"
                                                    min="0"
                                                    value={taxRate}
                                                    onChange={(e) => setTaxRate(e.target.value)}
                                                />
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-3 rounded-md bg-[#F2F3FC] px-3 py-2.5">
                                                <div>
                                                    <p className="text-[7px] text-[#59606E]">
                                                        Profit Margin
                                                    </p>
                                                    <p className="mt-1 text-[10px] font-bold text-[#0757C9]">
                                                        {margin.toFixed(1)}%
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[7px] text-[#59606E]">
                                                        Final Price (Inc. Tax)
                                                    </p>
                                                    <p className="mt-1 text-[10px] font-bold text-[#343A47]">
                                                        ${finalPrice.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </SectionCard>

                                        <SectionCard
                                            icon={Truck}
                                            title="Supplier"
                                        >
                                            <label className="mb-1.5 block text-[8px] font-semibold">
                                                Supplier Name
                                            </label>
                                            <input
                                                type="text"
                                                value={supplier}
                                                onChange={(e) => setSupplier(e.target.value)}
                                                placeholder="Enter supplier name"
                                                className="h-9 w-full rounded-md border border-[#D9DDE7] px-3 text-[11px] outline-none focus:border-[#0757C9]"
                                            />

                                            <p className="mt-3 text-[8px] text-[#7A808C]">
                                                Supplier contact details are not currently stored in the inventory model.
                                            </p>
                                        </SectionCard>
                                    </div>

                                    {/* RECENT STOCK ACTIVITY */}

                                    <SectionCard
                                        icon={Clock3}
                                        title="Recent Stock Activity"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF3FF] text-[#0757C9]">
                                                <UserRound size={13} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-semibold text-[#343A47]">
                                                    Activity history is not connected
                                                </p>
                                                <p className="mt-1 text-[8px] text-[#7A808C]">
                                                    Inventory activity records will appear here when an audit history endpoint is implemented.
                                                </p>
                                            </div>
                                        </div>
                                    </SectionCard>
                                </div>

                                {/* RIGHT COLUMN */}

                                <div className="space-y-4">

                                    {/* PRODUCT PREVIEW */}

                                    <section className="overflow-hidden rounded-lg border border-[#E3E6EC] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                        <div className="flex h-32 items-center justify-center overflow-hidden bg-[#EDEFF4]">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt={productName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <ImagePlus size={34} className="text-[#A0A6B2]" />
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <h3 className="text-sm font-bold text-[#242936]">
                                                {productName || 'Product Name'}
                                            </h3>

                                            <p className="mt-1 text-[8px] text-[#7A808C]">
                                                SKU: {productCode} • {category}
                                            </p>

                                            <div className="my-4 h-px bg-[#ECEEF2]" />

                                            <div className="grid grid-cols-2">
                                                <div className="text-center">
                                                    <p className="text-[7px] text-[#59606E]">
                                                        Current Stock
                                                    </p>
                                                    <p
                                                        className={`mt-1 text-lg font-bold ${stockStatus === 'In Stock'
                                                                ? 'text-green-600'
                                                                : 'text-[#E43D3D]'
                                                            }`}
                                                    >
                                                        {currentStock}
                                                    </p>
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-[7px] text-[#59606E]">
                                                        Price
                                                    </p>
                                                    <p className="mt-1 text-lg font-bold text-[#242936]">
                                                        ${Number(sellingPrice || 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="mt-4 text-[7px] text-[#777F8D]">
                                                Last Updated:{' '}
                                                {product.updatedAt
                                                    ? new Date(product.updatedAt).toLocaleString()
                                                    : 'Not available'}
                                            </p>
                                        </div>
                                    </section>

                                    {/* QUICK ACTIONS */}

                                    <section className="overflow-hidden rounded-lg border border-[#E3E6EC] bg-white">
                                        <div className="px-4 pt-4">
                                            <p className="text-[8px] font-bold uppercase tracking-wide text-[#59606E]">
                                                Quick Actions
                                            </p>
                                        </div>

                                        <div className="mt-2 divide-y divide-[#ECEEF2]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormError('Restock workflow is not connected yet.');
                                                    setFormSuccess('');
                                                }}
                                                className="flex h-10 w-full items-center justify-between px-4 text-left text-[9px] hover:bg-[#F8F9FC]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <ShoppingCart size={13} className="text-[#0757C9]" />
                                                    Restock Product
                                                </span>
                                                <span>›</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!productCode) return;
                                                    setBarcode(productCode);
                                                    setFormSuccess('Product ID copied into the barcode field.');
                                                    setFormError('');
                                                }}
                                                className="flex h-10 w-full items-center justify-between px-4 text-left text-[9px] hover:bg-[#F8F9FC]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Barcode size={13} className="text-[#0757C9]" />
                                                    Use Product ID as Barcode
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
                                                onClick={() => {
                                                    setFormError('Stock history is not connected yet.');
                                                    setFormSuccess('');
                                                }}
                                                className="flex h-10 w-full items-center justify-between px-4 text-left text-[9px] hover:bg-[#F8F9FC]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <RefreshCw size={13} className="text-[#0757C9]" />
                                                    View Stock History
                                                </span>
                                                <span>›</span>
                                            </button>
                                        </div>
                                    </section>

                                    {/* STATUS */}

                                    <section className="rounded-lg border border-[#E3E6EC] bg-white p-4">
                                        <h3 className="text-xs font-semibold">
                                            Item Status
                                        </h3>

                                        <p className="mt-1 text-[8px] text-[#7A808C]">
                                            Display setting only; status is not currently stored by the inventory API.
                                        </p>

                                        <div className="mt-3 space-y-2">
                                            {['Active', 'Inactive', 'Discontinued'].map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => setStatus(item)}
                                                    className={`
                                                        flex h-9 w-full items-center justify-between
                                                        rounded-md border px-3 text-[9px] transition
                                                        ${status === item
                                                            ? 'border-[#0757C9] bg-[#F1F5FF] text-[#0757C9]'
                                                            : 'border-[#E5E7EC] text-[#59606E] hover:bg-[#F8F9FC]'
                                                        }
                                                    `}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className={`flex h-3 w-3 items-center justify-center rounded-full border ${status === item
                                                                    ? 'border-[#0757C9]'
                                                                    : 'border-[#AAB0BC]'
                                                                }`}
                                                        >
                                                            {status === item && (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-[#0757C9]" />
                                                            )}
                                                        </span>
                                                        {item}
                                                    </span>

                                                    {status === item && (
                                                        <ShieldCheck size={12} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* BOTTOM ACTION BAR */}

                            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[#E3E6EC] bg-[#FBF9FF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isSaving || isDeleting}
                                    className="flex items-center gap-1.5 text-[8px] font-semibold text-[#D92D20] hover:text-[#B42318] disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <LoaderCircle size={12} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={12} />
                                    )}
                                    {isDeleting ? 'Deleting...' : 'Delete Product'}
                                </button>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/manager/inventory')}
                                        disabled={isSaving || isDeleting}
                                        className="h-8 rounded-md border border-[#D9DDE7] bg-white px-4 text-[9px] font-medium text-[#343A47] hover:bg-[#F7F8FB] disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={isSaving || isDeleting}
                                        className="h-8 rounded-md border border-[#7EA5F5] bg-white px-4 text-[9px] font-medium text-[#0757C9] hover:bg-[#F1F5FF] disabled:opacity-50"
                                    >
                                        Reset Changes
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving || isDeleting}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-[#0757C9] px-4 text-[9px] font-semibold text-white shadow-sm hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSaving ? (
                                            <>
                                                <LoaderCircle size={12} className="animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={12} />
                                                Update Inventory Item
                                            </>
                                        )}
                                    </button>
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

export default EditInventoryItem;
