const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const pickupRoutes = require('./routes/pickups');
const userRoutes = require('./routes/users');
const impactRoutes = require('./routes/impact');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/impact', impactRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Fallback: serve index.html only for root (static middleware handles pages/)
app.use((req, res, next) => {
  // Only fall back for non-file requests (no extension in path)
  if (!path.extname(req.path)) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🌱 EcoTrack Server running at http://localhost:${PORT}`);
  console.log(`📊 Impact Dashboard: http://localhost:${PORT}/pages/impact-dashboard.html`);
  console.log(`🔐 Test credentials: admin@ecotrack.com / password\n`);
});
