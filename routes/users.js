const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('./auth');

const USERS_FILE = path.join(__dirname, '../data/users.json');

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { return []; }
}
function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// GET /api/users — admin only
router.get('/', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only.' });
    }
    const users = readUsers();
    const sanitized = users.map(({ password, ...u }) => u);
    res.json({ success: true, users: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/users/by-role/:role — list users by role
router.get('/by-role/:role', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only.' });
    }
    const users = readUsers();
    const filtered = users.filter(u => u.role === req.params.role).map(({ password, ...u }) => u);
    res.json({ success: true, users: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/users/:id/toggle — admin toggle user active status
router.patch('/:id/toggle', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only.' });
    }
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });

    users[idx].isActive = !users[idx].isActive;
    writeUsers(users);

    const { password, ...userOut } = users[idx];
    res.json({ success: true, message: `User ${users[idx].isActive ? 'activated' : 'deactivated'}.`, user: userOut });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
