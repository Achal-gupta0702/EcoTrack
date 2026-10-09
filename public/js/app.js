/* ===================================================
   EcoTrack – Shared App Utilities
   =================================================== */

const API_BASE = '/api';

// ---- Toast Notifications ----
function showToast(message, type = 'success', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size:1.1rem">${icons[type] || '✅'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- API Helper ----
async function apiRequest(method, endpoint, body = null, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = localStorage.getItem('ecotrack_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 0, data: { success: false, message: 'Network error. Please check your connection.' } };
  }
}

// ---- Alert Helper ----
function showAlert(containerId, message, type = 'success') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span> ${message}`;
  el.style.display = 'flex';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }
}

// ---- Format Date ----
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const secs = Math.floor((now - then) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs/86400)}d ago`;
  return formatDate(dateStr);
}

// ---- Status Badge ----
function statusBadge(status) {
  const labels = {
    available: 'Available',
    requested: 'Requested',
    accepted: 'Accepted',
    pickup_assigned: 'Pickup Assigned',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    completed: 'Completed'
  };
  const icons = {
    available: '🟢', requested: '🟡', accepted: '🔵',
    pickup_assigned: '🚗', picked_up: '📦', delivered: '🚚', completed: '✅'
  };
  return `<span class="badge badge-${status}">${icons[status] || ''} ${labels[status] || status}</span>`;
}

// ---- Category Label ----
function categoryLabel(cat) {
  const map = {
    'cooked-food': '🍲 Cooked Food',
    'raw-food': '🥕 Raw Food',
    'vegetables': '🥦 Vegetables',
    'fruits': '🍎 Fruits',
    'bakery': '🍞 Bakery',
    'dairy': '🥛 Dairy',
    'packaged': '📦 Packaged',
    'beverages': '🥤 Beverages',
    'other': '🍴 Other'
  };
  return map[cat] || cat;
}

// ---- Animate Count Up ----
function animateCount(el, target, duration = 1500, suffix = '') {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target.toLocaleString('en-IN') + suffix;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start).toLocaleString('en-IN') + suffix;
    }
  }, 16);
}

// ---- Navbar Scroll Effect ----
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// ---- Hamburger Menu ----
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
      }
    });
  }

  // Modal close on backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Update nav based on auth state
  updateNavAuthState();
});

// ---- Modal Helpers ----
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('show');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('show');
}

// ---- Nav Auth State ----
function updateNavAuthState() {
  const token = localStorage.getItem('ecotrack_token');
  const user = getUser();
  const loginBtn = document.getElementById('nav-login-btn');
  const registerBtn = document.getElementById('nav-register-btn');
  const userInfo = document.getElementById('nav-user-info');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const dashBtn = document.getElementById('nav-dashboard-btn');

  if (token && user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (userInfo) {
      userInfo.style.display = 'flex';
      const nameEl = document.getElementById('nav-user-name');
      const avatarEl = document.getElementById('nav-avatar');
      if (nameEl) nameEl.textContent = user.name.split(' ')[0];
      if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
    }
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (dashBtn) {
      dashBtn.style.display = 'inline-flex';
      dashBtn.href = getDashboardUrl(user.role);
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (registerBtn) registerBtn.style.display = 'inline-flex';
    if (userInfo) userInfo.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (dashBtn) dashBtn.style.display = 'none';
  }
}

// Detect whether current page is in pages/ sub-folder
function _inPagesDir() {
  return window.location.pathname.includes('/pages/') ||
         window.location.pathname.includes('\\pages\\');
}

function getDashboardUrl(role) {
  const base = _inPagesDir() ? '' : 'pages/';
  const map = {
    donor:     base + 'donor-dashboard.html',
    ngo:       base + 'ngo-dashboard.html',
    volunteer: base + 'volunteer-dashboard.html',
    admin:     base + 'admin-dashboard.html'
  };
  return map[role] || (base + 'impact-dashboard.html');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('ecotrack_user'));
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem('ecotrack_token');
  localStorage.removeItem('ecotrack_user');
  window.location.href = _inPagesDir() ? '../index.html' : 'index.html';
}

// ---- Require Auth (for dashboard pages) ----
function requireAuth(requiredRole = null) {
  const token = localStorage.getItem('ecotrack_token');
  const user = getUser();
  if (!token || !user) {
    window.location.href = _inPagesDir() ? 'login.html' : 'pages/login.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    showToast('Access denied. Redirecting...', 'error');
    setTimeout(() => window.location.href = getDashboardUrl(user.role), 1500);
    return null;
  }
  return user;
}

// ---- Build Sidebar User Info ----
function initSidebar(user) {
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role.toUpperCase();
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// ---- Intersection Observer for count animation ----
function observeCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        animateCount(el, target, 1500, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(c => observer.observe(c));
}

// ---- Render mini bar chart ----
function renderBarChart(containerId, data, labels) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const max = Math.max(...data, 1);
  container.innerHTML = `
    <div class="bar-chart">
      ${data.map((val, i) => `
        <div class="bar-item">
          <div class="bar-value">${val}</div>
          <div class="bar-fill" style="height:${(val/max)*100}%"></div>
          <div class="bar-label">${labels[i]}</div>
        </div>
      `).join('')}
    </div>
  `;
}
