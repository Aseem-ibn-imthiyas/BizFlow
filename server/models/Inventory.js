
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: [true, 'Product ID is required'],
            unique: true,
            trim: true,
            uppercase: true,
        },

        productName: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: 150,
        },

        category: {
            type: String,
            required: [true, 'Product category is required'],
            trim: true,
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            default: '',
            maxlength: 1000,
        },

        // Product identification
        barcode: {
            type: String,
            trim: true,
            default: '',
        },

        // Product pricing
        costPrice: {
            type: Number,
            min: [0, 'Cost price cannot be negative'],
            default: 0,
        },

        price: {
            type: Number,
            required: [true, 'Product selling price is required'],
            min: [0, 'Selling price cannot be negative'],
        },

        discount: {
            type: Number,
            min: [0, 'Discount cannot be negative'],
            max: [100, 'Discount cannot exceed 100%'],
            default: 0,
        },

        taxRate: {
            type: Number,
            min: [0, 'Tax rate cannot be negative'],
            default: 0,
        },

        // Stock information
        quantity: {
            type: Number,
            required: [true, 'Product quantity is required'],
            min: [0, 'Quantity cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'Quantity must be a whole number',
            },
            default: 0,
        },

        minimumStockLevel: {
            type: Number,
            required: true,
            min: [0, 'Minimum stock level cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'Minimum stock level must be a whole number',
            },
            default: 5,
        },

        storageLocation: {
            type: String,
            trim: true,
            default: '',
            maxlength: 150,
        },

        supplier: {
            type: String,
            trim: true,
            default: '',
            maxlength: 150,
        },

        // Product image stored through Cloudinary
        imageUrl: {
            type: String,
            trim: true,
            default: '',
        },

        imagePublicId: {
            type: String,
            trim: true,
            default: '',
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Automatically calculate stock status.
inventorySchema.virtual('stockStatus').get(function () {
    if (this.quantity === 0) {
        return 'Out of Stock';
    }

    if (this.quantity <= this.minimumStockLevel) {
        return 'Low Stock';
    }

    return 'In Stock';
});

// Useful indexes for inventory searching and filtering.
inventorySchema.index({ productName: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ quantity: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
