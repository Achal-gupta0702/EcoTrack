const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('./auth');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const DONATIONS_FILE = path.join(__dirname, '../data/donations.json');
const PICKUPS_FILE = path.join(__dirname, '../data/pickups.json');

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { return []; }
}
function readDonations() {
  try { return JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf8')); } catch (e) { return []; }
}
function readPickups() {
  try { return JSON.parse(fs.readFileSync(PICKUPS_FILE, 'utf8')); } catch (e) { return []; }
}

// GET /api/impact — public impact stats
router.get('/', (req, res) => {
  try {
    const users = readUsers();
    const donations = readDonations();
    const pickups = readPickups();

    const donors = users.filter(u => u.role === 'donor').length;
    const ngos = users.filter(u => u.role === 'ngo').length;
    const volunteers = users.filter(u => u.role === 'volunteer').length;

    const totalDonations = donations.length;
    const completedDonations = donations.filter(d => d.status === 'completed').length;
    const activeDonations = donations.filter(d => d.status === 'available').length;
    const inProgressDonations = donations.filter(d =>
      ['requested', 'accepted', 'pickup_assigned', 'picked_up', 'delivered'].includes(d.status)
    ).length;

    const foodRedistributed = donations
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);

    const mealsProvided = Math.round(foodRedistributed * 4);

    // Category breakdown
    const categoryCount = {};
    donations.forEach(d => {
      categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
    });

    // City breakdown
    const cityCount = {};
    donations.forEach(d => {
      if (d.city) cityCount[d.city] = (cityCount[d.city] || 0) + 1;
    });

    // Monthly trend (last 6 months)
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const count = donations.filter(don => {
        const created = new Date(don.createdAt);
        return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
      }).length;
      monthlyData.push({ label, count });
    }

    res.json({
      success: true,
      stats: {
        totalDonations,
        completedDonations,
        activeDonations,
        inProgressDonations,
        foodRedistributed: parseFloat(foodRedistributed.toFixed(1)),
        mealsProvided,
        donors,
        ngos,
        volunteers,
        totalUsers: users.length,
        totalPickups: pickups.length,
        categoryBreakdown: categoryCount,
        cityBreakdown: cityCount,
        monthlyTrend: monthlyData
      }
    });
  } catch (err) {
    console.error('Impact stats error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
