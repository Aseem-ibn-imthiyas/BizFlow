
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const cloudinary = require('../config/cloudinary');
const { notifyRoles } = require('../services/notificationService');

// Helper: calculate stock status.
const getStockStatus = (quantity, minimumStockLevel) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= minimumStockLevel) return 'Low Stock';
    return 'In Stock';
};

const notifyInventoryStock = async (product, actorId) => {
    const stockStatus = getStockStatus(
        product.quantity,
        product.minimumStockLevel
    );

    if (stockStatus === 'In Stock') return;

    await notifyRoles({
        roles: ['Administrator', 'Manager'],
        actorId,
        title: stockStatus === 'Out of Stock'
            ? 'Product Out of Stock'
            : 'Low Stock Alert',
        description: `${product.productName} (${product.productId}) ${stockStatus === 'Out of Stock'
                ? 'is out of stock.'
                : `has only ${product.quantity} units remaining.`
            }`,
        type: 'Inventory',
        priority: stockStatus === 'Out of Stock' ? 'High' : 'Medium',
        relatedEntity: 'Inventory',
        relatedEntityId: product._id,
        metadata: {
            productId: product.productId,
            productName: product.productName,
            quantity: product.quantity,
            minimumStockLevel: product.minimumStockLevel,
            stockStatus,
        },
    });
};


// Upload an image buffer to Cloudinary.
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'bizflow/inventory',
                resource_type: 'image',
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

// Delete an image from Cloudinary.
const deleteCloudinaryImage = async (publicId) => {
    if (!publicId) return;

    return cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
    });
};


// GET /api/inventory
// Retrieve inventory with search, filters, sorting and pagination.
exports.getInventory = async (req, res) => {
    try {
        const {
            search = '',
            category = '',
            status = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        if (search.trim()) {
            const searchRegex = new RegExp(
                search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                'i'
            );

            filter.$or = [
                { productName: searchRegex },
                { productId: searchRegex },
                { category: searchRegex },
                { supplier: searchRegex },
            ];
        }

        if (category.trim() && category !== 'All Categories') {
            filter.category = category.trim();
        }

        if (status === 'In Stock') {
            filter.$expr = {
                $gt: ['$quantity', '$minimumStockLevel'],
            };
        } else if (status === 'Low Stock') {
            filter.$expr = {
                $and: [
                    { $gt: ['$quantity', 0] },
                    { $lte: ['$quantity', '$minimumStockLevel'] },
                ],
            };
        } else if (status === 'Out of Stock') {
            filter.quantity = 0;
        }

        const allowedSortFields = [
            'productName',
            'productId',
            'category',
            'price',
            'quantity',
            'createdAt',
            'updatedAt',
        ];

        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const safeSortOrder = sortOrder === 'asc' ? 1 : -1;

        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 10)
        );

        const skip = (currentPage - 1) * pageSize;

        const [products, totalItems] = await Promise.all([
            Inventory.find(filter)
                .sort({ [safeSortBy]: safeSortOrder })
                .skip(skip)
                .limit(pageSize)
                .populate('createdBy', 'fullName')
                .populate('updatedBy', 'fullName')
                .lean(),

            Inventory.countDocuments(filter),
        ]);

        const formattedProducts = products.map((product) => ({
            ...product,
            stockStatus: getStockStatus(
                product.quantity,
                product.minimumStockLevel
            ),
        }));

        res.status(200).json({
            success: true,
            data: formattedProducts,
            pagination: {
                currentPage,
                pageSize,
                totalItems,
                totalPages: Math.ceil(totalItems / pageSize),
            },
        });
    } catch (error) {
        console.error('Get inventory error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve inventory.',
        });
    }
};


// GET /api/inventory/stats
// Retrieve dynamic inventory dashboard statistics.

// GET /api/inventory/stats
// Retrieve dynamic inventory dashboard statistics.
exports.getInventoryStats = async (req, res) => {
    try {
        const [
            totalProducts,
            availableProducts,
            lowStockProducts,
            outOfStockProducts,
            categories,
            suppliers,
            totalStockUnits,
            categoryBreakdown,
        ] = await Promise.all([

            // Total number of products.
            Inventory.countDocuments(),

            // Products with stock above minimum stock level.
            Inventory.countDocuments({
                $expr: {
                    $gt: ['$quantity', '$minimumStockLevel'],
                },
            }),

            // Products with low stock.
            Inventory.countDocuments({
                $expr: {
                    $and: [
                        { $gt: ['$quantity', 0] },
                        { $lte: ['$quantity', '$minimumStockLevel'] },
                    ],
                },
            }),

            // Products with zero stock.
            Inventory.countDocuments({
                quantity: 0,
            }),

            // Unique product categories.
            Inventory.distinct('category'),

            // Unique suppliers.
            Inventory.distinct('supplier', {
                supplier: { $nin: ['', null] },
            }),

            // Total physical stock units.
            Inventory.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$quantity' },
                    },
                },
            ]),

            // Stock breakdown by category.
            Inventory.aggregate([
                {
                    $group: {
                        _id: '$category',
                        totalUnits: { $sum: '$quantity' },
                        productCount: { $sum: 1 },
                    },
                },
                {
                    $sort: {
                        totalUnits: -1,
                    },
                },
            ]),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                availableProducts,
                lowStockProducts,
                outOfStockProducts,
                totalCategories: categories.length,
                totalSuppliers: suppliers.length,
                totalStockUnits: totalStockUnits[0]?.total || 0,
                categoryNames: categories,
                categoryBreakdown,
            },
        });

    } catch (error) {
        console.error('Inventory stats error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve inventory statistics.',
        });
    }
};


// GET /api/inventory/alerts
// Retrieve products that need stock attention.
exports.getInventoryAlerts = async (req, res) => {
    try {
        const alerts = await Inventory.find({
            $or: [
                { quantity: 0 },
                {
                    $expr: {
                        $lte: ['$quantity', '$minimumStockLevel'],
                    },
                },
            ],
        })
            .sort({ quantity: 1, productName: 1 })
            .lean();

        const formattedAlerts = alerts.map((product) => ({
            ...product,
            stockStatus: getStockStatus(
                product.quantity,
                product.minimumStockLevel
            ),
        }));

        res.status(200).json({
            success: true,
            count: formattedAlerts.length,
            data: formattedAlerts,
        });
    } catch (error) {
        console.error('Inventory alerts error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve inventory alerts.',
        });
    }
};


// GET /api/inventory/:id
// Retrieve one inventory product.
exports.getInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inventory item ID.',
            });
        }

        const product = await Inventory.findById(id)
            .populate('createdBy', 'fullName')
            .populate('updatedBy', 'fullName');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found.',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                ...product.toObject(),
                stockStatus: product.stockStatus,
            },
        });
    } catch (error) {
        console.error('Get inventory item error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve inventory item.',
        });
    }
};


// POST /api/inventory
// Create a new inventory product.
exports.createInventoryItem = async (req, res) => {
    try {
        const {
            productId,
            productName,
            category,
            description,
            barcode,
            costPrice,
            price,
            discount,
            taxRate,
            quantity,
            minimumStockLevel,
            storageLocation,
            supplier,
        } = req.body;

        const product = await Inventory.create({
            productId,
            productName,
            category,
            description,
            barcode,
            costPrice,
            price,
            discount,
            taxRate,
            quantity,
            minimumStockLevel,
            storageLocation,
            supplier,
            createdBy: req.user._id,
        });

        await notifyInventoryStock(product, req.user._id);

        res.status(201).json({
            success: true,
            message: 'Inventory item created successfully.',
            data: {
                ...product.toObject(),
                stockStatus: product.stockStatus,
            },
        });
    } catch (error) {
        console.error('Create inventory item error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This Product ID already exists.',
            });
        }

        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create inventory item.',
        });
    }
};


// PATCH /api/inventory/:id
// Update an existing inventory product.
exports.updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inventory item ID.',
            });
        }

        const allowedFields = [
            'productId',
            'productName',
            'category',
            'description',
            'barcode',
            'costPrice',
            'price',
            'discount',
            'taxRate',
            'quantity',
            'minimumStockLevel',
            'storageLocation',
            'supplier',
        ];
        const updates = {};

        allowedFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields were provided for updating.',
            });
        }

        updates.updatedBy = req.user._id;


        const previousProduct = await Inventory.findById(id)
            .select('quantity minimumStockLevel');

        if (!previousProduct) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found.',
            });
        }

        const previousStockStatus = getStockStatus(
            previousProduct.quantity,
            previousProduct.minimumStockLevel
        );

        const product = await Inventory.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate('createdBy', 'fullName')
            .populate('updatedBy', 'fullName');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found.',
            });
        }

        const currentStockStatus = getStockStatus(
            product.quantity,
            product.minimumStockLevel
        );

        if (currentStockStatus !== previousStockStatus) {
            await notifyInventoryStock(product, req.user._id);
        }

        res.status(200).json({
            success: true,
            message: 'Inventory item updated successfully.',
            data: {
                ...product.toObject(),
                stockStatus: product.stockStatus,
            },
        });
    } catch (error) {
        console.error('Update inventory item error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This Product ID already exists.',
            });
        }

        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update inventory item.',
        });
    }
};


// POST /api/inventory/:id/image
// Upload or replace an inventory product image.

exports.uploadInventoryImage = async (req, res) => {
    let uploadedPublicId = null;

    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inventory item ID.',
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please select an image to upload.',
            });
        }

        const product = await Inventory.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found.',
            });
        }

        // Upload the new image first.
        const result = await uploadToCloudinary(req.file.buffer);
        uploadedPublicId = result.public_id;

        // Preserve the previous image until the new one is saved.
        const previousPublicId = product.imagePublicId;

        product.imageUrl = result.secure_url;
        product.imagePublicId = result.public_id;
        product.updatedBy = req.user._id;

        await product.save();

        // Remove the previous image after successful database update.
        if (previousPublicId) {
            try {
                await deleteCloudinaryImage(previousPublicId);
            } catch (cleanupError) {
                console.error(
                    'Previous Cloudinary image cleanup failed:',
                    cleanupError
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'Product image uploaded successfully.',
            data: {
                imageUrl: product.imageUrl,
                imagePublicId: product.imagePublicId,
                product,
            },
        });
    } catch (error) {
        console.error('Product image upload error:', error);

        // Remove a newly uploaded image if saving the product failed.
        if (uploadedPublicId) {
            try {
                await deleteCloudinaryImage(uploadedPublicId);
            } catch (cleanupError) {
                console.error(
                    'Failed to clean up uploaded image:',
                    cleanupError
                );
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload product image.',
        });
    }
};



// DELETE /api/inventory/:id
// Delete an inventory product.
exports.deleteInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inventory item ID.',
            });
        }

        const product = await Inventory.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found.',
            });
        }

        // Remove the associated Cloudinary image if one exists.
        if (product.imagePublicId) {
            try {
                await deleteCloudinaryImage(product.imagePublicId);
            } catch (imageError) {
                console.error(
                    'Cloudinary image cleanup failed:',
                    imageError
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully.',
        });
    } catch (error) {
        console.error('Delete inventory item error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete inventory item.',
        });
    }
};
