# 🍛 Spice Garden — Enterprise Restaurant Management System (RMS)

A complete, production-grade Restaurant Management System built from scratch for fine dining, takeaway, delivery, contactless table QR ordering, fullscreen Point-of-Sale (POS), Kitchen Display System (KDS), and rider dispatch.

Designed and engineered for university final-year capstone defense and real-world multi-branch deployment.

---

## 🏛️ Core Architectural Invariant
```
                   ┌─────────────────────────────────────────┐
                   │               MySQL (Prisma)            │
                   │           40+ Relational Tables         │
                   └────────────────────▲────────────────────┘
                                        │
                                        │ (Prisma ORM)
                                        │
                   ┌────────────────────┴────────────────────┐
                   │    Unified Backend REST & Socket Server │
                   │       Express.js + Socket.IO (5000)     │
                   └───────▲──────────▲──────────▲──────────▲┘
                           │          │          │          │
         ┌─────────────────┘          │          │          └─────────────────┐
         │                            │          │                            │
┌────────┴────────┐          ┌────────┴────────┐ ┌────────┴────────┐ ┌────────┴────────┐
│    web-admin    │          │  web-customer   │ │ mobile-customer │ │  mobile-staff   │
│ Next.js 14 (App)│          │ Next.js 14 (App)│ │ Expo React Native│ │ Expo React Native│
│ Port 3000       │          │ Port 3002       │ │ iOS / Android   │ │ iOS / Android   │
│ - Admin Portal  │          │ - Customer Web  │ │ - Online Order  │ │ - Waiter Tablet │
│ - POS Terminal  │          │ - Table QR Order│ │ - Live Tracking │ │ - Kitchen KDS   │
│ - Kitchen KDS   │          │ - Reservations  │ │ - Push Notifs   │ │ - Rider COD App │
└─────────────────┘          └─────────────────┘ └─────────────────┘ └─────────────────┘
```
**Strict Architectural Rule:**
- **ONE single MySQL database** stores all data.
- **ONE Express API & Socket.IO server** handles all business logic, transactions, and real-time events.
- **ZERO duplicate databases or client-side direct DB connections**. Every client communicates strictly via standard authenticated HTTP REST and Socket.IO rooms.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js $\ge 18.x$
- MySQL 8.0+ (via XAMPP or Docker)
- npm or pnpm

### 1. Database Setup & Seeding
```powershell
cd restaurant-system/backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```
> **Seed credentials created:**
> - Super Admin: `admin@spicegarden.com` / `Password123!`
> - Manager: `manager@spicegarden.com` / `Password123!`
> - Cashier: `cashier@spicegarden.com` / `Password123!`
> - Kitchen: `kitchen@spicegarden.com` / `Password123!`
> - Rider: `rider@spicegarden.com` / `Password123!`
> - Customer: `customer@spicegarden.com` / `Customer123!`

### 2. Run Backend (Port 5000)
```powershell
cd restaurant-system/backend
npm run dev
# Swagger API documentation live at: http://localhost:5000/api/docs
```

### 3. Run Web Admin Portal + POS + Kitchen (Port 3000)
```powershell
cd restaurant-system/web-admin
npm run dev
# Access Admin: http://localhost:3000
# Access POS:   http://localhost:3000/pos
# Access KDS:   http://localhost:3000/kitchen
```

### 4. Run Customer Web Application (Port 3002)
```powershell
cd restaurant-system/web-customer
npm run dev
# Access Customer Website: http://localhost:3002
# Table QR simulation:    http://localhost:3002/t/tbl-dhan-01
```

### 5. Run Mobile Apps (Expo React Native)
```powershell
# Customer App:
cd restaurant-system/mobile-customer
npx expo start

# Staff Multi-Role App:
cd restaurant-system/mobile-staff
npx expo start
```

---

## 📦 Docker Containerized Deployment
Run the full stack (MySQL + Backend + Admin Web + Customer Web) with Docker Compose:
```powershell
cd restaurant-system
docker-compose up --build -d
```

---

## 📂 Subprojects & Directory Structure
| Subproject | Technology | Port | Purpose |
|---|---|---|---|
| [`backend/`](./backend) | Express, TypeScript, Prisma, Socket.IO | 5000 | Core REST API, realtime events, DB access, Swagger UI |
| [`web-admin/`](./web-admin) | Next.js 14, Tailwind CSS, TanStack Query | 3000 | Multi-branch admin dashboard, POS terminal, KDS screen |
| [`web-customer/`](./web-customer) | Next.js 14, Tailwind CSS, TanStack Query | 3002 | Customer ordering, table QR self-order, live tracker |
| [`mobile-customer/`](./mobile-customer) | React Native, Expo SDK 51, TypeScript | - | Customer mobile app with push notifications |
| [`mobile-staff/`](./mobile-staff) | React Native, Expo SDK 51, TypeScript | - | Staff mobile app (Waiter, Kitchen bump, Rider COD) |

---

## 🧪 Automated Test Suite
The backend contains 62 automated unit and integration tests covering the entire business workflow:
```powershell
cd restaurant-system/backend
npx ts-node tests/foundation.test.ts  # Auth, JWT, pagination, AppError (14 tests)
npx ts-node tests/orders.test.ts      # Menu, tables, order creation, void (10 tests)
npx ts-node tests/payments.test.ts    # Single & split pay, cash reconciliation (13 tests)
npx ts-node tests/operations.test.ts  # Delivery zones, reservations, inventory (12 tests)
npx ts-node tests/business.test.ts    # HR, payroll, coupons, reviews (13 tests)
```
**All 62 tests pass 100%.**

---

## 📄 License
Academic and educational license for university final-year project demonstration.
