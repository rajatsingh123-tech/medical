const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const medicineRoutes = require('./routes/medicineRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection
const connectDB = async () => {
    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        
        // Add proper connection options
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://2433361:24116002405@cluster0.cbhkwju.mongodb.net/pharmacyDB?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout
            socketTimeoutMS: 45000, // Close socket after 45s
        });
        
        console.log('✅ MongoDB Atlas Connected Successfully!');
        
        // Create sample data if collection is empty
        await createSampleData();
        
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.log('💡 Please check your MongoDB Atlas connection string');
        console.log('💡 Make sure your IP is whitelisted in MongoDB Atlas');
        console.log('💡 Current MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
        return false;
    }
};

// Function to create sample data
async function createSampleData() {
    try {
        const Medicine = require('./models/Medicine');
        const count = await Medicine.countDocuments();
        
        if (count === 0) {
            const sampleMedicines = [
                {
                    name: "Paracetamol 500mg",
                    company: "Cipla Ltd",
                    price: 5.50,
                    quantity: 150,
                    expiryDate: new Date('2025-12-31')
                },
                {
                    name: "Cetirizine 10mg",
                    company: "Sun Pharma",
                    price: 8.75,
                    quantity: 80,
                    expiryDate: new Date('2024-11-30')
                },
                {
                    name: "Aspirin 75mg",
                    company: "Bayer",
                    price: 12.99,
                    quantity: 5,
                    expiryDate: new Date('2024-08-15')
                },
                {
                    name: "Amoxicillin 500mg",
                    company: "GlaxoSmithKline",
                    price: 45.00,
                    quantity: 40,
                    expiryDate: new Date('2024-09-30')
                },
                {
                    name: "Vitamin C 1000mg",
                    company: "Dabur",
                    price: 25.50,
                    quantity: 120,
                    expiryDate: new Date('2026-01-31')
                }
            ];
            
            await Medicine.insertMany(sampleMedicines);
            console.log('✅ Sample medicines created in database');
        } else {
            console.log(`✅ Database already has ${count} medicines`);
        }
    } catch (error) {
        console.error('Error creating sample data:', error);
    }
}

// API Routes
app.use('/api/medicines', medicineRoutes);

// Simple login endpoint (no database auth for simplicity)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin123') {
        res.json({
            success: true,
            message: 'Login successful',
            token: 'demo_jwt_token_admin_2024',
            user: { username: 'admin', role: 'admin' }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        server: 'Pharmacy Management System',
        version: '1.0.0'
    });
});

// Test MongoDB connection
app.get('/api/test-db', async (req, res) => {
    try {
        const Medicine = require('./models/Medicine');
        const count = await Medicine.countDocuments();
        
        res.json({
            success: true,
            message: 'Database connection successful',
            connectionStatus: mongoose.connection.readyState,
            medicineCount: count,
            databaseName: mongoose.connection.name,
            host: mongoose.connection.host
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database test failed',
            error: error.message
        });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/add-medicine', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/add-medicine.html'));
});

app.get('/view-medicines', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/view-medicines.html'));
});

app.get('/billing', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/billing.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const startServer = async () => {
    const dbConnected = await connectDB();
    
    if (dbConnected) {
        app.listen(PORT, () => {
            console.log(`\n🏥 Pharmacy Management System`);
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`\n📋 Available Pages:`);
            console.log(`   📍 Home: http://localhost:${PORT}/`);
            console.log(`   📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`   💊 Add Medicine: http://localhost:${PORT}/add-medicine`);
            console.log(`   📋 View Medicines: http://localhost:${PORT}/view-medicines`);
            console.log(`   🧾 Billing: http://localhost:${PORT}/billing`);
            console.log(`\n📡 API Endpoints:`);
            console.log(`   GET    http://localhost:${PORT}/api/health`);
            console.log(`   GET    http://localhost:${PORT}/api/test-db`);
            console.log(`   GET    http://localhost:${PORT}/api/medicines`);
            console.log(`   POST   http://localhost:${PORT}/api/medicines`);
            console.log(`   PUT    http://localhost:${PORT}/api/medicines/:id`);
            console.log(`   DELETE http://localhost:${PORT}/api/medicines/:id`);
            console.log(`   POST   http://localhost:${PORT}/api/login`);
            console.log(`   POST   http://localhost:${PORT}/api/medicines/bill/process`);
            console.log(`\n🔑 Admin Login Credentials:`);
            console.log(`   Username: admin`);
            console.log(`   Password: admin123`);
            console.log(`\n✅ MongoDB Atlas connected successfully!`);
            console.log(`✅ Ready to use!`);
        });
    } else {
        console.error('❌ Cannot start server without database connection');
        console.log('\n💡 Troubleshooting MongoDB Atlas:');
        console.log('1. Check your connection string in .env file');
        console.log('2. Make sure your IP is whitelisted in MongoDB Atlas');
        console.log('3. Check your username and password');
        console.log('4. Ensure network connectivity');
        
        // Start server anyway for testing frontend?
        const startWithoutDB = confirm('Do you want to start server without database? (Frontend will work, CRUD won\'t)');
        if (startWithoutDB) {
            app.listen(PORT, () => {
                console.log(`\n⚠️ Server running without database on http://localhost:${PORT}`);
                console.log(`⚠️ CRUD operations will not work!`);
            });
        } else {
            process.exit(1);
        }
    }
};

startServer();