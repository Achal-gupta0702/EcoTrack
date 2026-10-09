const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('./auth');

const DONATIONS_FILE = path.join(__dirname, '../data/donations.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');

function readDonations() {
  try { return JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf8')); } catch (e) { return []; }
}
function writeDonations(data) {
  fs.writeFileSync(DONATIONS_FILE, JSON.stringify(data, null, 2));
}
function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { return []; }
}

// GET /api/donations — get all donations (filterable)
router.get('/', verifyToken, (req, res) => {
  try {
    let donations = readDonations();
    const { status, city, category, donorId } = req.query;

    if (status) donations = donations.filter(d => d.status === status);
    if (city) donations = donations.filter(d => d.city.toLowerCase().includes(city.toLowerCase()));
    if (category) donations = donations.filter(d => d.category === category);
    if (donorId) donations = donations.filter(d => d.donorId === donorId);

    // Sort by latest first
    donations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, donations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/donations/:id
router.get('/:id', verifyToken, (req, res) => {
  const donations = readDonations();
  const donation = donations.find(d => d.id === req.params.id);
  if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });
  res.json({ success: true, donation });
});

// POST /api/donations — create new donation (donor only)
router.post('/', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ success: false, message: 'Only donors can add donations.' });
    }

    const { foodName, category, quantity, unit, expiryDateTime, pickupAddress, city, description } = req.body;
    if (!foodName || !category || !quantity || !unit || !expiryDateTime || !pickupAddress || !city) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const users = readUsers();
    const donor = users.find(u => u.id === req.user.id);

    const newDonation = {
      id: `don-${uuidv4().substring(0, 8)}`,
      donorId: req.user.id,
      donorName: req.user.name,
      donorPhone: donor ? donor.phone : '',
      donorCity: donor ? donor.city : city,
      foodName: foodName.trim(),
      category,
      quantity: parseFloat(quantity),
      unit,
      expiryDateTime,
      pickupAddress: pickupAddress.trim(),
      city: city.trim(),
      description: description ? description.trim() : '',
      status: 'available',
      requestedBy: null,
      requestedByName: null,
      volunteerId: null,
      volunteerName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        { status: 'available', timestamp: new Date().toISOString(), note: 'Donation listed by donor' }
      ]
    };

    const donations = readDonations();
    donations.push(newDonation);
    writeDonations(donations);

    res.status(201).json({ success: true, message: 'Donation added successfully!', donation: newDonation });
  } catch (err) {
    console.error('Create donation error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/donations/:id/request — NGO requests a donation
router.patch('/:id/request', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ success: false, message: 'Only NGOs can request donations.' });
    }

    const donations = readDonations();
    const idx = donations.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Donation not found.' });

    const donation = donations[idx];
    if (donation.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This donation is no longer available.' });
    }

    donations[idx] = {
      ...donation,
      status: 'requested',
      requestedBy: req.user.id,
      requestedByName: req.user.name,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...donation.statusHistory,
        { status: 'requested', timestamp: new Date().toISOString(), note: `Requested by ${req.user.name}` }
      ]
    };

    writeDonations(donations);
    res.json({ success: true, message: 'Donation requested successfully!', donation: donations[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/donations/:id/accept — Donor accepts NGO request
router.patch('/:id/accept', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ success: false, message: 'Only donors can accept requests.' });
    }

    const donations = readDonations();
    const idx = donations.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Donation not found.' });

    const donation = donations[idx];
    if (donation.donorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only accept requests for your own donations.' });
    }
    if (donation.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'Donation is not in requested state.' });
    }

    donations[idx] = {
      ...donation,
      status: 'accepted',
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...donation.statusHistory,
        { status: 'accepted', timestamp: new Date().toISOString(), note: 'Accepted by donor' }
      ]
    };

    writeDonations(donations);
    res.json({ success: true, message: 'Request accepted!', donation: donations[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/donations/:id/status — generic status update (for volunteer/admin)
router.patch('/:id/status', verifyToken, (req, res) => {
  try {
    const { status, note, volunteerId, volunteerName } = req.body;
    const validStatuses = ['available', 'requested', 'accepted', 'pickup_assigned', 'picked_up', 'delivered', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const donations = readDonations();
    const idx = donations.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Donation not found.' });

    const updates = {
      status,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...donations[idx].statusHistory,
        { status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` }
      ]
    };

    if (volunteerId) updates.volunteerId = volunteerId;
    if (volunteerName) updates.volunteerName = volunteerName;

    donations[idx] = { ...donations[idx], ...updates };
    writeDonations(donations);

    res.json({ success: true, message: 'Status updated successfully!', donation: donations[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/donations/:id — donor or admin can delete
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const donations = readDonations();
    const idx = donations.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Donation not found.' });

    const donation = donations[idx];
    if (req.user.role !== 'admin' && donation.donorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this donation.' });
    }

    donations.splice(idx, 1);
    writeDonations(donations);
    res.json({ success: true, message: 'Donation deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
