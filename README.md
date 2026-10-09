# 🌱 EcoTrack – Smart Food Waste Reduction & Redistribution Platform

**SDG 12: Responsible Consumption and Production**

EcoTrack is a full-stack web application that connects food donors (restaurants, hotels, households) with NGOs and volunteers to redistribute surplus food instead of wasting it.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open your browser
http://localhost:3000
```

---

## 🧪 Test Credentials

| Role      | Email                    | Password  |
|-----------|--------------------------|-----------|
| Admin     | admin@ecotrack.com       | password  |
| Donor     | donor@ecotrack.com       | password  |
| NGO       | ngo@ecotrack.com         | password  |
| Volunteer | volunteer@ecotrack.com   | password  |

---

## 📁 Project Structure

```
EcoTrack/
├── server.js              # Express server entry point
├── package.json
├── README.md
│
├── routes/
│   ├── auth.js            # Register, Login, JWT middleware
│   ├── donations.js       # Donation CRUD + status updates
│   ├── pickups.js         # Volunteer pickup management
│   ├── users.js           # User management (admin)
│   └── impact.js          # Platform statistics
│
├── data/
│   ├── users.json         # User records
│   ├── donations.json     # Donation records
│   └── pickups.json       # Pickup task records
│
└── public/
    ├── index.html         # Home page
    ├── css/
    │   └── styles.css     # Premium green/navy theme
    ├── js/
    │   └── app.js         # Shared utilities
    └── pages/
        ├── about.html
        ├── how-it-works.html
        ├── login.html
        ├── register.html
        ├── donor-dashboard.html
        ├── ngo-dashboard.html
        ├── volunteer-dashboard.html
        ├── admin-dashboard.html
        ├── impact-dashboard.html
        └── dashboard-redirect.html
```

---

## 🛠️ Technology Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript |
| Backend    | Node.js, Express.js   |
| Data Store | Local JSON files      |
| Auth       | JWT + bcryptjs        |

---

## 📋 Pages & Features

### Public Pages
- **Home** – Hero, problem statement, how it works, SDG 12 section, impact stats, CTA
- **About** – Mission, SDG alignment, values, team
- **How It Works** – 7-stage donation flow, role-specific guides
- **Impact Dashboard** – Live stats, category breakdown, monthly trend, environmental impact

### Auth Pages
- **Login** – JWT-based login with form validation
- **Register** – Role selection (Donor/NGO/Volunteer) with all validations

### Role Dashboards
- **Donor Dashboard** – Add donations, view status, accept NGO requests
- **NGO Dashboard** – Browse/filter available food, request donations
- **Volunteer Dashboard** – View available pickups, accept tasks, mark picked up / delivered
- **Admin Dashboard** – View all users, all donations, all pickups, platform stats

---

## 🔄 Donation Status Flow

```
Available → Requested → Accepted → Pickup Assigned → Picked Up → Delivered → Completed
```

---

## 🌍 REST API Endpoints

### Auth
- `POST /api/auth/register` – Create account
- `POST /api/auth/login`    – Login (returns JWT)
- `GET  /api/auth/me`       – Get current user (auth required)

### Donations
- `GET    /api/donations`               – List donations (filterable)
- `GET    /api/donations/:id`           – Get single donation
- `POST   /api/donations`               – Create donation (donor)
- `PATCH  /api/donations/:id/request`   – NGO requests donation
- `PATCH  /api/donations/:id/accept`    – Donor accepts request
- `PATCH  /api/donations/:id/status`    – Update status
- `DELETE /api/donations/:id`           – Delete donation

### Pickups
- `GET    /api/pickups`                 – List pickups
- `GET    /api/pickups/available`       – Donations ready for pickup
- `POST   /api/pickups/accept`          – Volunteer accepts pickup
- `PATCH  /api/pickups/:id/pickup`      – Mark as picked up
- `PATCH  /api/pickups/:id/deliver`     – Mark as delivered

### Users (Admin)
- `GET    /api/users`                   – List all users
- `GET    /api/users/by-role/:role`     – Filter by role
- `PATCH  /api/users/:id/toggle`        – Toggle active status

### Impact
- `GET    /api/impact`                  – Platform statistics (public)

---

## 🎓 Project Info

- **Course**: B.Tech CSE – 6-Week Internship Project
- **SDG Focus**: SDG 12 – Responsible Consumption and Production
- **Theme**: Food Waste Reduction & Community Redistribution
- **Stack**: Node.js + Express.js + HTML/CSS/JS (no React, no database, no external APIs)

---

## ✅ Features Checklist

- [x] Responsive premium UI (mobile + desktop)
- [x] Role-based authentication (JWT)
- [x] Donor: add donations, accept NGO requests
- [x] NGO: browse, filter, request donations
- [x] Volunteer: accept pickups, update delivery status
- [x] Admin: view all users, donations, pickups, stats
- [x] 7-stage donation status tracking
- [x] Live impact statistics
- [x] Form validation with error messages
- [x] Toast notifications
- [x] SDG 12 aligned design and content

---

*Made with 💚 for a sustainable future | EcoTrack 2024*
