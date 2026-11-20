const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');

exports.getAnalyticsOverview = async (req, res) => {
    try {
        const now = new Date();

        // --------------------------------------------------
        // DATE RANGES
        // --------------------------------------------------

        const currentMonthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const nextMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );

        const previousMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

        const sixMonthsStart = new Date(
            now.getFullYear(),
            now.getMonth() - 5,
            1
        );

        // Only completed, non-refunded sales contribute to revenue.
        const revenueFilter = {
            saleStatus: 'Completed',
            paymentStatus: { $ne: 'Refunded' },
        };

        // --------------------------------------------------
        // RUN ANALYTICS QUERIES
        // --------------------------------------------------

        const [
            revenueSummary,
            previousRevenueSummary,
            monthlyRevenue,
            inventorySummary,
            inventoryDistribution,
            taskSummary,
            revenueByCategory,
            topProducts,
            recentActivity,
        ] = await Promise.all([

            // 1. Current month revenue and sales.
            Sale.aggregate([
                {
                    $match: {
                        ...revenueFilter,
                        saleDate: {
                            $gte: currentMonthStart,
                            $lt: nextMonthStart,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$grandTotal' },
                        totalSales: { $sum: 1 },
                    },
                },
            ]),

            // 2. Previous month revenue and sales.
            Sale.aggregate([
                {
                    $match: {
                        ...revenueFilter,
                        saleDate: {
                            $gte: previousMonthStart,
                            $lt: currentMonthStart,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$grandTotal' },
                        totalSales: { $sum: 1 },
                    },
                },
            ]),

            // 3. Revenue over the previous six months.
            Sale.aggregate([
                {
                    $match: {
                        ...revenueFilter,
                        saleDate: { $gte: sixMonthsStart },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$saleDate' },
                            month: { $month: '$saleDate' },
                        },
                        revenue: { $sum: '$grandTotal' },
                        sales: { $sum: 1 },
                    },
                },
                {
                    $sort: {
                        '_id.year': 1,
                        '_id.month': 1,
                    },
                },
            ]),

            // 4. Inventory statistics.
            Inventory.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStockUnits: { $sum: '$quantity' },

                        inventoryValue: {
                            $sum: {
                                $multiply: [
                                    '$costPrice',
                                    '$quantity',
                                ],
                            },
                        },

                        availableProducts: {
                            $sum: {
                                $cond: [
                                    {
                                        $gt: [
                                            '$quantity',
                                            '$minimumStockLevel',
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        lowStockProducts: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gt: ['$quantity', 0] },
                                            {
                                                $lte: [
                                                    '$quantity',
                                                    '$minimumStockLevel',
                                                ],
                                            },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        outOfStockProducts: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$quantity', 0] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),

            // 5. Inventory distribution by stock status.
            Inventory.aggregate([
                {
                    $group: {
                        _id: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: ['$quantity', 0] },
                                        then: 'Out of Stock',
                                    },
                                    {
                                        case: {
                                            $lte: [
                                                '$quantity',
                                                '$minimumStockLevel',
                                            ],
                                        },
                                        then: 'Low Stock',
                                    },
                                ],
                                default: 'Available',
                            },
                        },
                        count: { $sum: 1 },
                        units: { $sum: '$quantity' },
                    },
                },
            ]),

            // 6. Task statistics.
            Task.aggregate([
                {
                    $group: {
                        _id: null,
                        totalTasks: { $sum: 1 },

                        completedTasks: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'Completed'] },
                                    1,
                                    0,
                                ],
                            },
                        },

                        pendingTasks: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'Pending'] },
                                    1,
                                    0,
                                ],
                            },
                        },

                        inProgressTasks: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'In Progress'] },
                                    1,
                                    0,
                                ],
                            },
                        },

                        reviewTasks: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'Review'] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),

            // 7. Revenue by category.
            // Uses the current Inventory category associated with
            // the product reference stored in each sale item.
            Sale.aggregate([
                {
                    $match: revenueFilter,
                },
                {
                    $unwind: '$items',
                },
                {
                    $lookup: {
                        from: Inventory.collection.name,
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'inventoryProduct',
                    },
                },
                {
                    $unwind: {
                        path: '$inventoryProduct',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $group: {
                        _id: {
                            $ifNull: [
                                '$inventoryProduct.category',
                                'Uncategorized',
                            ],
                        },
                        revenue: { $sum: '$items.lineTotal' },
                        unitsSold: { $sum: '$items.quantity' },
                    },
                },
                {
                    $sort: { revenue: -1 },
                },
            ]),

            // 8. Top five performing products.
            Sale.aggregate([
                {
                    $match: revenueFilter,
                },
                {
                    $unwind: '$items',
                },
                {
                    $group: {
                        _id: '$items.product',
                        productId: { $first: '$items.productId' },
                        productName: { $first: '$items.productName' },
                        unitsSold: { $sum: '$items.quantity' },
                        revenue: { $sum: '$items.lineTotal' },
                    },
                },
                {
                    $sort: { revenue: -1 },
                },
                {
                    $limit: 5,
                },
            ]),

            // 9. Recent actual system activity.
            AuditLog.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select(
                    'userName role action module description status createdAt'
                )
                .lean(),
        ]);

        // --------------------------------------------------
        // NORMALIZE RESULTS
        // --------------------------------------------------

        const currentRevenue = revenueSummary[0] || {
            totalRevenue: 0,
            totalSales: 0,
        };

        const previousRevenue = previousRevenueSummary[0] || {
            totalRevenue: 0,
            totalSales: 0,
        };

        const inventory = inventorySummary[0] || {
            totalProducts: 0,
            totalStockUnits: 0,
            inventoryValue: 0,
            availableProducts: 0,
            lowStockProducts: 0,
            outOfStockProducts: 0,
        };

        const tasks = taskSummary[0] || {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            reviewTasks: 0,
        };

        const calculateGrowth = (current, previous) => {
            if (previous === 0) {
                return current > 0 ? 100 : 0;
            }

            return Number(
                (((current - previous) / previous) * 100).toFixed(1)
            );
        };

        // Include months with zero revenue.
        const monthlyRevenueData = [];

        for (let i = 0; i < 6; i++) {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - 5 + i,
                1
            );

            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const existingMonth = monthlyRevenue.find(
                (item) =>
                    item._id.year === year &&
                    item._id.month === month
            );

            monthlyRevenueData.push({
                year,
                month,
                label: date.toLocaleString('en-US', {
                    month: 'short',
                }),
                revenue: existingMonth?.revenue || 0,
                sales: existingMonth?.sales || 0,
            });
        }

        const taskCompletionRate = tasks.totalTasks
            ? Number(
                (
                    (tasks.completedTasks / tasks.totalTasks) *
                    100
                ).toFixed(1)
            )
            : 0;

        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return res.status(200).json({
            success: true,
            data: {
                generatedAt: now,

                summary: {
                    totalRevenue: currentRevenue.totalRevenue,
                    totalSales: currentRevenue.totalSales,

                    inventoryValue: inventory.inventoryValue,
                    totalProducts: inventory.totalProducts,
                    totalStockUnits: inventory.totalStockUnits,
                    lowStockItems: inventory.lowStockProducts,
                    outOfStockItems: inventory.outOfStockProducts,

                    completedTasks: tasks.completedTasks,
                    totalTasks: tasks.totalTasks,
                    taskCompletionRate,

                    revenueGrowth: calculateGrowth(
                        currentRevenue.totalRevenue,
                        previousRevenue.totalRevenue
                    ),

                    salesGrowth: calculateGrowth(
                        currentRevenue.totalSales,
                        previousRevenue.totalSales
                    ),
                },

                comparisons: {
                    currentMonth: currentRevenue,
                    previousMonth: previousRevenue,
                },

                monthlyRevenue: monthlyRevenueData,

                inventoryDistribution: inventoryDistribution.map(
                    (item) => ({
                        status: item._id,
                        count: item.count,
                        units: item.units,
                    })
                ),

                inventorySummary: inventory,

                taskSummary: tasks,

                revenueByCategory,

                topProducts,

                recentActivity,
            },
        });
    } catch (error) {
        console.error('Analytics overview error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics data.',
        });
    }
};