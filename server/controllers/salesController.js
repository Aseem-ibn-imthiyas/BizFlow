
const mongoose = require('mongoose');

const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const {
    notifyRoles,
} = require('../services/notificationService');

// --------------------------------------------------
// Invoice number counter
// --------------------------------------------------

// Keeps invoice numbers sequential within each year.
// The counter is stored in MongoDB, not generated in the frontend.

const saleCounterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    sequence: {
        type: Number,
        default: 0,
    },
});

const SaleCounter =
    mongoose.models.SaleCounter ||
    mongoose.model('SaleCounter', saleCounterSchema);

// --------------------------------------------------
// Helper functions
// --------------------------------------------------

const roundMoney = (value) =>
    Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateInvoiceId = async (session = null) => {
    const year = new Date().getFullYear();
    const counterId = `sales-${year}`;

    const options = {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
    };

    if (session) {
        options.session = session;
    }

    const counter = await SaleCounter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { sequence: 1 } },
        options
    );

    return `INV-${year}-${String(counter.sequence).padStart(6, '0')}`;
};

const sendError = (res, error, fallbackMessage) => {
    console.error(fallbackMessage, error);

    if (error.statusCode) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'A duplicate record was detected. Please try again.',
        });
    }

    if (
        error.name === 'ValidationError' ||
        error.name === 'CastError'
    ) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    return res.status(500).json({
        success: false,
        message: fallbackMessage,
    });
};

const getStockStatus = (quantity, minimumStockLevel) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= minimumStockLevel) return 'Low Stock';
    return 'In Stock';
};

// --------------------------------------------------
// GET /api/sales/products
// Search available inventory products for a sale.
// --------------------------------------------------

exports.getSaleProducts = async (req, res) => {
    try {
        const {
            search = '',
            page = 1,
            limit = 20,
        } = req.query;

        const currentPage = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const pageSize = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 20)
        );

        const filter = {};

        if (search.trim()) {
            const searchRegex = new RegExp(
                escapeRegex(search.trim()),
                'i'
            );

            filter.$or = [
                { productName: searchRegex },
                { productId: searchRegex },
                { category: searchRegex },
                { barcode: searchRegex },
            ];
        }

        const [products, totalItems] = await Promise.all([
            Inventory.find(filter)
                .select(
                    'productId productName category price discount taxRate quantity imageUrl'
                )
                .sort({ productName: 1 })
                .skip((currentPage - 1) * pageSize)
                .limit(pageSize)
                .lean(),

            Inventory.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage,
                pageSize,
                totalItems,
                totalPages: Math.ceil(totalItems / pageSize),
            },
        });
    } catch (error) {
        sendError(
            res,
            error,
            'Failed to retrieve products for sales.'
        );
    }
};

// --------------------------------------------------
// GET /api/sales
// Retrieve sales with search, filters and pagination.
// --------------------------------------------------

exports.getSales = async (req, res) => {
    try {
        const {
            search = '',
            saleStatus = '',
            paymentStatus = '',
            paymentMethod = '',
            startDate = '',
            endDate = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        if (search.trim()) {
            const searchRegex = new RegExp(
                escapeRegex(search.trim()),
                'i'
            );

            filter.$or = [
                { invoiceId: searchRegex },
                { 'customer.name': searchRegex },
                { 'customer.email': searchRegex },
                { 'customer.phone': searchRegex },
                { 'items.productName': searchRegex },
                { 'items.productId': searchRegex },
            ];
        }

        if (saleStatus) {
            filter.saleStatus = saleStatus;
        }

        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }

        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }

        if (startDate || endDate) {
            filter.saleDate = {};

            if (startDate) {
                const start = new Date(`${startDate}T00:00:00`);

                if (Number.isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid start date.',
                    });
                }

                filter.saleDate.$gte = start;
            }

            if (endDate) {
                const end = new Date(`${endDate}T23:59:59.999`);

                if (Number.isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid end date.',
                    });
                }

                filter.saleDate.$lte = end;
            }
        }

        const allowedSortFields = [
            'invoiceId',
            'saleDate',
            'grandTotal',
            'saleStatus',
            'paymentStatus',
            'createdAt',
        ];

        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const safeSortOrder = sortOrder === 'asc' ? 1 : -1;

        const currentPage = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const pageSize = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 10)
        );

        const [sales, totalItems] = await Promise.all([
            Sale.find(filter)
                .sort({ [safeSortBy]: safeSortOrder })
                .skip((currentPage - 1) * pageSize)
                .limit(pageSize)
                .populate('createdBy', 'fullName')
                .populate('updatedBy', 'fullName')
                .lean(),

            Sale.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: sales,
            pagination: {
                currentPage,
                pageSize,
                totalItems,
                totalPages: Math.ceil(totalItems / pageSize),
            },
        });
    } catch (error) {
        sendError(res, error, 'Failed to retrieve sales records.');
    }
};

// --------------------------------------------------
// GET /api/sales/stats
// Retrieve dynamic sales dashboard statistics.
// --------------------------------------------------

exports.getSalesStats = async (req, res) => {
    try {
        const now = new Date();

        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const startOfTomorrow = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );

        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const completedFilter = {
            saleStatus: 'Completed',
        };

        const [
            todayStats,
            monthStats,
            statusCounts,
            paymentBreakdown,
            topProducts,
            recentSales,
        ] = await Promise.all([
            Sale.aggregate([
                {
                    $match: {
                        ...completedFilter,
                        saleDate: {
                            $gte: startOfToday,
                            $lt: startOfTomorrow,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$grandTotal' },
                        totalOrders: { $sum: 1 },
                    },
                },
            ]),

            Sale.aggregate([
                {
                    $match: {
                        ...completedFilter,
                        saleDate: { $gte: startOfMonth },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$grandTotal' },
                        totalOrders: { $sum: 1 },
                    },
                },
            ]),

            Sale.aggregate([
                {
                    $group: {
                        _id: '$saleStatus',
                        count: { $sum: 1 },
                    },
                },
            ]),

            Sale.aggregate([
                {
                    $match: completedFilter,
                },
                {
                    $group: {
                        _id: '$paymentMethod',
                        totalRevenue: { $sum: '$grandTotal' },
                        totalOrders: { $sum: 1 },
                    },
                },
                {
                    $sort: { totalRevenue: -1 },
                },
            ]),

            Sale.aggregate([
                {
                    $match: completedFilter,
                },
                {
                    $unwind: '$items',
                },
                {
                    $group: {
                        _id: '$items.product',
                        productId: { $first: '$items.productId' },
                        productName: { $first: '$items.productName' },
                        quantitySold: { $sum: '$items.quantity' },
                        revenue: { $sum: '$items.lineTotal' },
                    },
                },
                {
                    $sort: { quantitySold: -1 },
                },
                {
                    $limit: 5,
                },
            ]),

            Sale.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select(
                    'invoiceId customer.name grandTotal saleStatus paymentStatus saleDate'
                )
                .lean(),
        ]);

        const statusSummary = {
            Draft: 0,
            Completed: 0,
            Cancelled: 0,
        };

        statusCounts.forEach((item) => {
            statusSummary[item._id] = item.count;
        });

        res.status(200).json({
            success: true,
            data: {
                today: {
                    revenue: todayStats[0]?.totalRevenue || 0,
                    orders: todayStats[0]?.totalOrders || 0,
                },

                month: {
                    revenue: monthStats[0]?.totalRevenue || 0,
                    orders: monthStats[0]?.totalOrders || 0,
                },

                totalOrders:
                    Object.values(statusSummary).reduce(
                        (total, count) => total + count,
                        0
                    ),

                statusCounts: statusSummary,
                paymentBreakdown,
                topProducts,
                recentSales,
            },
        });
    } catch (error) {
        sendError(
            res,
            error,
            'Failed to retrieve sales statistics.'
        );
    }
};

// --------------------------------------------------
// GET /api/sales/:id
// Retrieve one sale.
// --------------------------------------------------

exports.getSale = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale ID.',
            });
        }

        const sale = await Sale.findById(id)
            .populate('createdBy', 'fullName')
            .populate('updatedBy', 'fullName');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale record not found.',
            });
        }

        res.status(200).json({
            success: true,
            data: sale,
        });
    } catch (error) {
        sendError(res, error, 'Failed to retrieve sale record.');
    }
};

// --------------------------------------------------
// POST /api/sales
// Create a draft or completed sale.
// --------------------------------------------------

exports.createSale = async (req, res) => {
    try {
        const {
            customer,
            items,
            saleDate,
            paymentMethod,
            paymentStatus,
            saleStatus,
            shippingCost = 0,
            notes = '',
        } = req.body;

        // Validate customer information.
        if (
            !customer ||
            typeof customer.name !== 'string' ||
            !customer.name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Customer name is required.',
            });
        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please add at least one product.',
            });
        }

        const finalSaleStatus = saleStatus || 'Completed';

        if (!['Draft', 'Completed'].includes(finalSaleStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale status.',
            });
        }

        const finalPaymentMethod =
            paymentMethod || 'Bank Transfer';

        const allowedPaymentMethods = [
            'Cash',
            'Bank Transfer',
            'Credit Card',
            'PayPal',
            'Stripe',
        ];

        if (!allowedPaymentMethods.includes(finalPaymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method.',
            });
        }

        const finalPaymentStatus = paymentStatus || 'Pending';

        const allowedPaymentStatuses = [
            'Pending',
            'Paid',
            'Partially Paid',
            'Refunded',
        ];

        if (!allowedPaymentStatuses.includes(finalPaymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status.',
            });
        }

        if (
            finalSaleStatus === 'Completed' &&
            finalPaymentStatus === 'Refunded'
        ) {
            return res.status(400).json({
                success: false,
                message: 'A new completed sale cannot be marked as refunded.',
            });
        }

        const finalShippingCost = Number(shippingCost);

        if (
            !Number.isFinite(finalShippingCost) ||
            finalShippingCost < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Shipping cost must be a valid non-negative amount.',
            });
        }

        // Validate sale date.
        const finalSaleDate = saleDate
            ? new Date(saleDate)
            : new Date();

        if (Number.isNaN(finalSaleDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale date.',
            });
        }

        // Validate and normalize item identifiers and quantities.
        const normalizedItems = [];

        for (const item of items) {
            if (!item.product || !mongoose.isValidObjectId(item.product)) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more products have an invalid product ID.',
                });
            }

            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Product quantities must be positive whole numbers.',
                });
            }

            normalizedItems.push({
                productId: item.product,
                quantity,
                requestedDiscount:
                    item.discount === undefined
                        ? null
                        : Number(item.discount),
            });

            const requestedDiscount =
                normalizedItems[normalizedItems.length - 1]
                    .requestedDiscount;

            if (
                requestedDiscount !== null &&
                (
                    !Number.isFinite(requestedDiscount) ||
                    requestedDiscount < 0 ||
                    requestedDiscount > 100
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Product discounts must be between 0 and 100%.',
                });
            }
        }

        // Retrieve the current inventory products.
        const uniqueProductIds = [
            ...new Set(normalizedItems.map((item) => item.productId)),
        ];

        const inventoryProducts = await Inventory.find({
            _id: { $in: uniqueProductIds },
        }).lean();

        const inventoryMap = new Map(
            inventoryProducts.map((product) => [
                product._id.toString(),
                product,
            ])
        );

        if (inventoryProducts.length !== uniqueProductIds.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more selected products could not be found.',
            });
        }

        // Build product snapshots and calculate totals on the server.
        let subtotal = 0;
        let totalDiscount = 0;
        let taxAmount = 0;

        const saleItems = normalizedItems.map((item) => {
            const product = inventoryMap.get(item.productId);

            const unitPrice = Number(product.price);
            const discount =
                item.requestedDiscount === null
                    ? Number(product.discount || 0)
                    : item.requestedDiscount;

            const taxRate = Number(product.taxRate || 0);

            if (
                !Number.isFinite(unitPrice) ||
                unitPrice < 0 ||
                !Number.isFinite(taxRate) ||
                taxRate < 0
            ) {
                const error = new Error(
                    `Invalid pricing information for ${product.productName}.`
                );
                error.statusCode = 400;
                throw error;
            }

            const lineSubtotal = roundMoney(
                unitPrice * item.quantity
            );

            const lineDiscount = roundMoney(
                lineSubtotal * (discount / 100)
            );

            const taxableAmount = roundMoney(
                lineSubtotal - lineDiscount
            );

            const lineTax = roundMoney(
                taxableAmount * (taxRate / 100)
            );

            const lineTotal = roundMoney(
                taxableAmount + lineTax
            );

            subtotal += lineSubtotal;
            totalDiscount += lineDiscount;
            taxAmount += lineTax;

            return {
                product: product._id,
                productId: product.productId,
                productName: product.productName,
                quantity: item.quantity,
                unitPrice,
                discount,
                taxRate,
                lineSubtotal,
                lineDiscount,
                lineTax,
                lineTotal,
            };
        });

        subtotal = roundMoney(subtotal);
        totalDiscount = roundMoney(totalDiscount);
        taxAmount = roundMoney(taxAmount);

        const grandTotal = roundMoney(
            subtotal -
            totalDiscount +
            taxAmount +
            finalShippingCost
        );

        // Group duplicate product lines to check and deduct stock correctly.
        const requiredStock = new Map();

        normalizedItems.forEach((item) => {
            const currentQuantity =
                requiredStock.get(item.productId) || 0;

            requiredStock.set(
                item.productId,
                currentQuantity + item.quantity
            );
        });

        // --------------------------------------------------
        // Draft sale: save without changing inventory.
        // --------------------------------------------------

        if (finalSaleStatus === 'Draft') {
            const invoiceId = await generateInvoiceId();

            const draftSale = await Sale.create({
                invoiceId,
                customer: {
                    name: customer.name.trim(),
                    customerId: customer.customerId || '',
                    phone: customer.phone || '',
                    email: customer.email || '',
                    address: customer.address || '',
                },
                items: saleItems,
                saleDate: finalSaleDate,
                paymentMethod: finalPaymentMethod,
                paymentStatus: finalPaymentStatus,
                saleStatus: 'Draft',
                subtotal,
                totalDiscount,
                taxAmount,
                shippingCost: finalShippingCost,
                grandTotal,
                notes,
                createdBy: req.user._id,
            });

            return res.status(201).json({
                success: true,
                message: 'Sales record saved as a draft successfully.',
                data: draftSale,
            });
        }

        // --------------------------------------------------
        // Completed sale: update inventory and create sale
        // inside one MongoDB transaction.
        // --------------------------------------------------

        const session = await mongoose.startSession();

        let completedSale;

        try {
            await session.withTransaction(async () => {
                // Deduct stock only if enough quantity is available.
                for (const [productId, quantity] of requiredStock) {
                    const result = await Inventory.updateOne(
                        {
                            _id: productId,
                            quantity: { $gte: quantity },
                        },
                        {
                            $inc: { quantity: -quantity },
                            $set: { updatedBy: req.user._id },
                        },
                        { session }
                    );

                    if (result.matchedCount === 0) {
                        const product = inventoryMap.get(productId);

                        const error = new Error(
                            `Insufficient stock for ${product.productName}. Available stock: ${product.quantity}. Requested quantity: ${quantity}.`
                        );

                        error.statusCode = 409;
                        throw error;
                    }
                }

                const invoiceId = await generateInvoiceId(session);

                const createdSales = await Sale.create(
                    [
                        {
                            invoiceId,
                            customer: {
                                name: customer.name.trim(),
                                customerId: customer.customerId || '',
                                phone: customer.phone || '',
                                email: customer.email || '',
                                address: customer.address || '',
                            },
                            items: saleItems,
                            saleDate: finalSaleDate,
                            paymentMethod: finalPaymentMethod,
                            paymentStatus: finalPaymentStatus,
                            saleStatus: 'Completed',
                            subtotal,
                            totalDiscount,
                            taxAmount,
                            shippingCost: finalShippingCost,
                            grandTotal,
                            notes,
                            createdBy: req.user._id,
                        },
                    ],
                    { session }
                );

                completedSale = createdSales[0];
            });
        } finally {
            await session.endSession();
        }

        // Notify active Administrators and Managers about the completed sale.
        await notifyRoles({
            roles: ['Administrator', 'Manager'],
            actorId: req.user._id,
            title: 'New Sale Completed',
            description: `Sale ${completedSale.invoiceId} for ${completedSale.customer.name} was completed. Total: ${completedSale.grandTotal}.`,
            type: 'Sales',
            priority: 'Medium',
            relatedEntity: 'Sale',
            relatedEntityId: completedSale._id,
            metadata: {
                invoiceId: completedSale.invoiceId,
                customerName: completedSale.customer.name,
                grandTotal: completedSale.grandTotal,
            },
        });

        // Check whether this sale caused any product to enter a stock alert state.
        const updatedProducts = await Inventory.find({
            _id: { $in: [...requiredStock.keys()] },
        }).lean();

        for (const product of updatedProducts) {
            const previousProduct = inventoryMap.get(
                product._id.toString()
            );

            const previousStatus = getStockStatus(
                previousProduct.quantity,
                previousProduct.minimumStockLevel
            );

            const currentStatus = getStockStatus(
                product.quantity,
                product.minimumStockLevel
            );

            if (
                currentStatus !== 'In Stock' &&
                currentStatus !== previousStatus
            ) {
                await notifyRoles({
                    roles: ['Administrator', 'Manager'],
                    actorId: req.user._id,
                    title: currentStatus === 'Out of Stock'
                        ? 'Product Out of Stock'
                        : 'Low Stock Alert',
                    description: `${product.productName} (${product.productId}) ${currentStatus === 'Out of Stock'
                            ? 'is out of stock.'
                            : `has only ${product.quantity} units remaining.`
                        }`,
                    type: 'Inventory',
                    priority: currentStatus === 'Out of Stock'
                        ? 'High'
                        : 'Medium',
                    relatedEntity: 'Inventory',
                    relatedEntityId: product._id,
                    metadata: {
                        productId: product.productId,
                        productName: product.productName,
                        quantity: product.quantity,
                        minimumStockLevel: product.minimumStockLevel,
                        stockStatus: currentStatus,
                    },
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Sales record created successfully.',
            data: completedSale,
        });
    } catch (error) {
        sendError(res, error, 'Failed to create sales record.');
    }
};
