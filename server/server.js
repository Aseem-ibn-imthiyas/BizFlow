
const auditLogRoutes = require('./routes/auditLogRoutes')
const permissionRoutes = require('./routes/permissionRoutes');
const userRoutes = require('./routes/userRoutes');
const systemHealthRoutes = require('./routes/systemHealthRoutes')
const workflowRoutes = require('./routes/workflowRoutes')
const systemSettingsRoutes = require('./routes/systemSettingsRoutes')
const supportTicketRoutes = require('./routes/supportTicketRoutes.js');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    })
);

app.use(express.json());

// API routes
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/system-health', systemHealthRoutes)
app.use('/api/workflows', workflowRoutes)
app.use('/api/system-settings', systemSettingsRoutes)
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'BizFlow API is running',
    });
});

// Health-check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'BizFlow backend is healthy',
        database:
            mongoose.connection.readyState === 1
                ? 'connected'
                : 'disconnected',
        timestamp: new Date().toISOString(),
    });
});

// Connect to MongoDB and start the server
async function startServer() {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is missing from the .env file');
        }

        await mongoose.connect(MONGODB_URI);

        console.log('MongoDB Atlas connected successfully');

        app.listen(PORT, () => {
            console.log(`BizFlow server running at http://localhost:${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start BizFlow:', error.message);
        process.exit(1);
    }
}

startServer();
