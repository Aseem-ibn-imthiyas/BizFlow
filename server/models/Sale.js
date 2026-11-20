
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true,
        },

        productId: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        productName: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: 'Quantity must be a whole number.',
            },
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        discount: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        taxRate: {
            type: Number,
            min: 0,
            default: 0,
        },

        lineSubtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        lineDiscount: {
            type: Number,
            required: true,
            min: 0,
        },

        lineTax: {
            type: Number,
            required: true,
            min: 0,
        },

        lineTotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const saleSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },

        // Customer information stored as a sale snapshot.
        customer: {
            name: {
                type: String,
                required: true,
                trim: true,
                maxlength: 150,
            },

            customerId: {
                type: String,
                trim: true,
                default: '',
            },

            phone: {
                type: String,
                trim: true,
                default: '',
            },

            email: {
                type: String,
                trim: true,
                lowercase: true,
                default: '',
            },

            address: {
                type: String,
                trim: true,
                default: '',
                maxlength: 500,
            },
        },

        items: {
            type: [saleItemSchema],
            required: true,
            validate: {
                validator: (items) =>
                    Array.isArray(items) && items.length > 0,
                message: 'A sale must contain at least one product.',
            },
        },

        saleDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        paymentMethod: {
            type: String,
            required: true,
            enum: [
                'Cash',
                'Bank Transfer',
                'Credit Card',
                'PayPal',
                'Stripe',
            ],
            default: 'Bank Transfer',
        },

        paymentStatus: {
            type: String,
            required: true,
            enum: [
                'Pending',
                'Paid',
                'Partially Paid',
                'Refunded',
            ],
            default: 'Pending',
        },

        saleStatus: {
            type: String,
            required: true,
            enum: [
                'Draft',
                'Completed',
                'Cancelled',
            ],
            default: 'Draft',
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        totalDiscount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        taxAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        shippingCost: {
            type: Number,
            min: 0,
            default: 0,
        },

        grandTotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        notes: {
            type: String,
            trim: true,
            default: '',
            maxlength: 2000,
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

// Useful indexes for sales searching and filtering.
saleSchema.index({ saleDate: -1 });
saleSchema.index({ 'customer.name': 1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ saleStatus: 1 });
saleSchema.index({ createdBy: 1 });

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
