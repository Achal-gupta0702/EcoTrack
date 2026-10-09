const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('./auth');

const PICKUPS_FILE = path.join(__dirname, '../data/pickups.json');
const DONATIONS_FILE = path.join(__dirname, '../data/donations.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');

function readPickups() {
  try { return JSON.parse(fs.readFileSync(PICKUPS_FILE, 'utf8')); } catch (e) { return []; }
}
function writePickups(data) {
  fs.writeFileSync(PICKUPS_FILE, JSON.stringify(data, null, 2));
}
function readDonations() {
  try { return JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf8')); } catch (e) { return []; }
}
function writeDonations(data) {
  fs.writeFileSync(DONATIONS_FILE, JSON.stringify(data, null, 2));
}
function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { return []; }
}

// GET /api/pickups — get pickups (volunteer sees own, admin/ngo see all)
router.get('/', verifyToken, (req, res) => {
  try {
    let pickups = readPickups();
    if (req.user.role === 'volunteer') {
      pickups = pickups.filter(p => p.volunteerId === req.user.id);
    }
    // admin and ngo see all pickups
    pickups.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
    res.json({ success: true, pickups });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/pickups/available — get donations available for volunteer pickup (accepted status)
router.get('/available', verifyToken, (req, res) => {
  try {
    const donations = readDonations();
    const available = donations.filter(d => d.status === 'accepted');
    res.json({ success: true, donations: available });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/pickups/accept — volunteer accepts a pickup task
router.post('/accept', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ success: false, message: 'Only volunteers can accept pickups.' });
    }

    const { donationId } = req.body;
    if (!donationId) return res.status(400).json({ success: false, message: 'donationId is required.' });

    const donations = readDonations();
    const dIdx = donations.findIndex(d => d.id === donationId);
    if (dIdx === -1) return res.status(404).json({ success: false, message: 'Donation not found.' });

    const donation = donations[dIdx];
    if (donation.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'This donation is not available for pickup.' });
    }

    const users = readUsers();
    const ngo = users.find(u => u.id === donation.requestedBy);

    const newPickup = {
      id: `pickup-${uuidv4().substring(0, 8)}`,
      donationId,
      volunteerId: req.user.id,
      volunteerName: req.user.name,
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      pickupAddress: donation.pickupAddress,
      deliveryAddress: ngo ? `${ngo.organization || ngo.name}, ${ngo.city}` : donation.city,
      ngoName: donation.requestedByName,
      foodName: donation.foodName,
      quantity: donation.quantity,
      unit: donation.unit,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      pickedUpAt: null,
      deliveredAt: null
    };

    const pickups = readPickups();
    pickups.push(newPickup);
    writePickups(pickups);

    // Update donation status
    donations[dIdx] = {
      ...donation,
      status: 'pickup_assigned',
      volunteerId: req.user.id,
      volunteerName: req.user.name,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...donation.statusHistory,
        { status: 'pickup_assigned', timestamp: new Date().toISOString(), note: `Volunteer ${req.user.name} assigned` }
      ]
    };
    writeDonations(donations);

    res.status(201).json({ success: true, message: 'Pickup accepted! Please collect the food.', pickup: newPickup });
  } catch (err) {
    console.error('Accept pickup error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/pickups/:id/pickup — volunteer marks as picked up
router.patch('/:id/pickup', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ success: false, message: 'Only volunteers can update pickup status.' });
    }

    const pickups = readPickups();
    const pIdx = pickups.findIndex(p => p.id === req.params.id);
    if (pIdx === -1) return res.status(404).json({ success: false, message: 'Pickup not found.' });

    if (pickups[pIdx].volunteerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your pickup task.' });
    }

    pickups[pIdx].status = 'picked_up';
    pickups[pIdx].pickedUpAt = new Date().toISOString();
    writePickups(pickups);

    // Update donation
    const donations = readDonations();
    const dIdx = donations.findIndex(d => d.id === pickups[pIdx].donationId);
    if (dIdx !== -1) {
      donations[dIdx].status = 'picked_up';
      donations[dIdx].updatedAt = new Date().toISOString();
      donations[dIdx].statusHistory.push({ status: 'picked_up', timestamp: new Date().toISOString(), note: 'Food picked up by volunteer' });
      writeDonations(donations);
    }

    res.json({ success: true, message: 'Marked as picked up!', pickup: pickups[pIdx] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/pickups/:id/deliver — volunteer marks as delivered
router.patch('/:id/deliver', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ success: false, message: 'Only volunteers can update delivery status.' });
    }

    const pickups = readPickups();
    const pIdx = pickups.findIndex(p => p.id === req.params.id);
    if (pIdx === -1) return res.status(404).json({ success: false, message: 'Pickup not found.' });

    if (pickups[pIdx].volunteerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your pickup task.' });
    }

    pickups[pIdx].status = 'delivered';
    pickups[pIdx].deliveredAt = new Date().toISOString();
    writePickups(pickups);

    // Update donation to delivered then completed
    const donations = readDonations();
    const dIdx = donations.findIndex(d => d.id === pickups[pIdx].donationId);
    if (dIdx !== -1) {
      const now = new Date().toISOString();
      donations[dIdx].status = 'completed';
      donations[dIdx].updatedAt = now;
      donations[dIdx].statusHistory.push(
        { status: 'delivered', timestamp: now, note: 'Food delivered to NGO' },
        { status: 'completed', timestamp: now, note: 'Donation cycle completed' }
      );
      writeDonations(donations);
    }

    res.json({ success: true, message: 'Delivered successfully! Thank you for making an impact!', pickup: pickups[pIdx] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
