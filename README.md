<div align="center">

# 🍛 SPICE GARDEN — ENTERPRISE RESTAURANT MANAGEMENT SYSTEM (RMS)
### Complete Multi-Branch Restaurant ERP, Point-of-Sale (POS), Kitchen Display (KDS), Online Ordering & Mobile Apps Suite

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo%2051-61DAFB?logo=react&logoColor=black)](https://expo.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7+-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%20%2F%20MariaDB-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

*A full-stack, university capstone-grade restaurant operations platform with zero database duplication and real-time sub-second sync.*

---

[Key Highlights](#-key-highlights) •
[System Architecture](#-system-architecture) •
[Monorepo Structure](#-monorepo-structure) •
[Quick Start](#-quick-start) •
[User Credentials](#-demo-accounts--credentials) •
[Features & Modules](#-features--modules) •
[API & Sockets](#-api-documentation--real-time-events) •
[Automated Tests](#-automated-testing)

---

</div>

## 🌟 Key Highlights

- **Single Source of Truth**: **ONE** MySQL database + **ONE** Express.js REST API + Socket.IO server powering 4 diverse clients (Admin desktop, Touch POS, Kitchen KDS, Web Consumers, Waiter/Chef/Rider mobile apps).
- **Omni-Channel Orders**: Dine-In (Table Sessions & Contactless QR), Takeaway Counter, and Home Delivery with real-time tracking.
- **Touch-Friendly POS Terminal**: 80mm thermal receipt printing, single/split payments (Cash, Card, MFS bKash), and end-of-shift cash drawer balance reconciliation.
- **Fullscreen Kitchen Display System (KDS)**: Web Audio API tone alert chime (`order:new`), multi-station routing (Grill, Fry, Bar, Desserts), and 1-tap Kanban bump buttons (`Pending` → `Preparing` → `Ready`).
- **Contactless Table QR Ordering**: Dynamic QR token resolution (`/t/:token`) that locks sessions and direct-dispatches orders to the kitchen line.
- **Automated Recipe Inventory Control**: Real-time ingredient stock deduction upon order completion with low-stock threshold alerts.
- **Financial Audit & P&L Reporting**: Automated 5% VAT computation, recipe-based COGS (Cost of Goods Sold), and daily cash float reconciliation.

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────────┐
                                  │    MySQL 8 / MariaDB (XAMPP) │
                                  │      40+ Relational Tables   │
                                  └──────────────▲───────────────┘
                                                 │
                                                 │ (Prisma ORM)
                                                 │
                                  ┌──────────────┴───────────────┐
                                  │  Unified Backend REST Server │
                                  │   Express.js + Socket.IO     │
                                  │         Port: 5000           │
                                  └──────▲───▲───────▲────▲──────┘
                                         │   │       │    │
                     ┌───────────────────┘   │       │    └───────────────────┐
                     │                       │       │                        │
             HTTP / Socket.IO                │       │                 HTTP / Socket.IO
                     │                       │       │                        │
       ┌─────────────┴─────────────┐         │       │          ┌─────────────┴─────────────┐
       │   web-admin (Next.js 14)  │         │       │          │   web-customer (Next.js)  │
       │   Port: 3000              │         │       │          │   Port: 3002              │
       │   • Executive Dashboard   │         │       │          │   • Public Website        │
       │   • Fullscreen POS        │         │       │          │   • Online Menu & Basket  │
       │   • Kitchen KDS Display   │         │       │          │   • Contactless QR Order  │
       │   • Inventory & HR Payroll│         │       │          │   • Live 5-Stage Tracker  │
       └───────────────────────────┘         │       │          └───────────────────────────┘
                                             │       │
                                  ┌──────────┴┐     ┌┴──────────┐
                                  │  mobile-  │     │  mobile-  │
                                  │ customer  │     │   staff   │
                                  │ (Expo RN) │     │ (Expo RN) │
                                  │ iOS / Droid     │ iOS / Droid
                                  └───────────┘     └───────────┘
```

---

## 📂 Monorepo Structure

```
Restaurant-Management-System/
├── restaurant-system/
│   ├── backend/               # Express.js REST API, Socket.IO & Prisma MySQL Server (Port 5000)
│   │   ├── prisma/            # 40+ Models schema, migrations & seed scripts
│   │   ├── src/modules/       # Modular domain controllers, services, routes, validations
│   │   └── tests/             # 62 unit & integration tests
│   │
│   ├── web-admin/             # Next.js 14 App Router Admin, POS & KDS UI (Port 3000)
│   │   ├── src/app/pos/       # Touch POS terminal with thermal receipt generator
│   │   ├── src/app/kitchen/   # Fullscreen live KDS with Web Audio chimes
│   │   └── src/app/dashboard/ # Executive charts, analytics & branch controls
│   │
│   ├── web-customer/          # Next.js 14 Customer Website & QR Self-Order (Port 3002)
│   │   ├── src/app/menu/      # Responsive menu with portions & add-on customizer
│   │   ├── src/app/t/[token]/ # Contactless Table QR landing page
│   │   └── src/app/orders/    # Real-time order pipeline tracker
│   │
│   ├── mobile-customer/       # React Native Expo customer mobile ordering app
│   │
│   ├── mobile-staff/          # React Native Expo staff multi-role app (Waiter, Kitchen, Rider)
│   │
│   └── docker-compose.yml     # Multi-container orchestration (MySQL + API + Web)
└── README.md                  # Master repository documentation
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** $\ge 18.x$
- **MySQL 8.0+** or **XAMPP** (with MySQL running on port 3306)
- **Git**

### 2. Database Initialization
```powershell
cd restaurant-system/backend
npm install

# 1. Sync database schema (Creates restaurant_db & 40+ tables in MySQL)
npx prisma db push

# 2. Seed demo branches, users, categories, menu items, ingredients & tables
npm run db:seed
```

### 3. Launch Backend API (Port 5000)
```powershell
cd restaurant-system/backend
npm run dev
```
*API Base:* `http://localhost:5000/api`  
*Interactive Swagger UI:* `http://localhost:5000/api/docs`

### 4. Launch Web Admin, POS & Kitchen (Port 3000)
```powershell
cd restaurant-system/web-admin
npm run dev
```
*Admin Dashboard:* `http://localhost:3000`  
*POS Terminal:* `http://localhost:3000/pos`  
*Kitchen Display:* `http://localhost:3000/kitchen`

### 5. Launch Customer Website (Port 3002)
```powershell
cd restaurant-system/web-customer
npm run dev
```
*Customer Portal:* `http://localhost:3002`  
*Table QR Simulation:* `http://localhost:3002/t/tbl-dhan-01`

### 6. Launch Mobile Applications (Optional)
```powershell
# Customer App
cd restaurant-system/mobile-customer
npx expo start

# Staff App
cd restaurant-system/mobile-staff
npx expo start
```

---

## 🔐 Demo Accounts & Credentials

All seeded accounts use password: **`Password123!`** (Customers: **`Customer123!`**)

| Role | Email | Access Scope |
|---|---|---|
| **Super Admin** | `superadmin@spicegarden.com` | All branches, roles, settings & system logs |
| **Branch Admin** | `admin@spicegarden.com` | Full branch operations, reports & financials |
| **Manager** | `manager@spicegarden.com` | Floor management, table seating & void approvals |
| **Cashier** | `cashier@spicegarden.com` | POS terminal, cash drawer float & settlement |
| **Kitchen / Chef** | `kitchen@spicegarden.com` | KDS screen, station routing & bump controls |
| **Waiter** | `waiter@spicegarden.com` | Table order taking & kitchen dispatch |
| **Rider** | `rider@spicegarden.com` | Home delivery dispatch & COD cash collection |
| **Customer** | `customer@example.com` | Online ordering, order tracking & table booking |

---

## 🎯 Features & Modules

### 🖥️ Admin Operations (`web-admin`)
- **Dashboard**: Live sales metrics, open table occupancy, pending orders, and low-inventory warnings.
- **Menu Management**: Category organizing, dietary tags, allergen badges, and **1-click 86 Out-of-Stock toggle**.
- **Floor Visualizer**: Color-coded tables (Available, Occupied, Reserved) and printable QR code badges.
- **Inventory & Wastage**: Raw ingredient tracking, minimum stock reorder alerts, and spoilage logging.
- **HR & Payroll**: Employee profiles, shift clock-in/out, leave approvals, and monthly salary slip calculation.
- **Finance & P&L**: Profit & Loss statements with recipe COGS calculation, 5% government VAT audit, and expense vouchers.

### 🧾 Point-of-Sale (`/pos`)
- Touch-optimized fast catalog with instant keyword search.
- Variant modal (Half, Full, Family) with dynamic add-ons and special kitchen instructions.
- Multi-tender payment: Cash (with auto change-due math), Card, bKash / Nagad, and Split payments.
- Printable 80mm standard thermal receipt format.
- End-of-shift physical cash drawer count and shortage/excess reconciliation.

### 🍳 Kitchen Display System (`/kitchen`)
- Dark high-contrast Kanban board: `New Tickets` $\rightarrow$ `In The Kitchen` $\rightarrow$ `Ready for Service`.
- Real-time browser **Web Audio chime** upon receiving orders.
- Station filter tabs: `Grill`, `Fry`, `Bar & Drinks`, `Desserts`.
- Urgent order timer highlighting tickets older than 15 minutes.

### 🌐 Customer Web & Contactless QR (`web-customer`)
- Responsive catalog with instant filtering and portion price calculations.
- Table QR self-order mode (`/t/:token`) locking the cart to the physical restaurant table.
- Online Delivery checkout with automated zone delivery fees.
- Promo coupon validation engine (`WELCOME10`).
- Real-time 5-stage visual tracker (`Order Received` $\rightarrow$ `Confirmed` $\rightarrow$ `Cooking` $\rightarrow$ `Ready` $\rightarrow$ `Served/Delivered`).

---

## 📡 API Documentation & Real-Time Events

### REST API Routing
- Full interactive Swagger OpenAPI documentation available at: `http://localhost:5000/api/docs`.
- Dual prefix support: Both `/api` and `/api/v1` route seamlessly to the API engine.

### Socket.IO Real-Time Rooms
| Room | Purpose | Broadcast Events |
|---|---|---|
| `branch:{id}` | Branch metrics and alerts | `stock:low`, `order:new`, `kitchen:ready` |
| `kitchen:{id}` | Real-time kitchen display | `order:new`, `order:status` |
| `order:{id}` | Customer live tracking | `order:status`, `delivery:status` |
| `rider:{id}` | Rider dispatch notifications | `delivery:assigned` |

---

## 🧪 Automated Testing

The backend includes a comprehensive suite of **62 automated tests**:
```powershell
cd restaurant-system/backend
npx ts-node tests/foundation.test.ts  # JWT, Auth, Pagination, Errors (14 tests)
npx ts-node tests/orders.test.ts      # Menu, Tables, Orders, Void (10 tests)
npx ts-node tests/payments.test.ts    # Payments, Cash Drawer, Refunds (13 tests)
npx ts-node tests/operations.test.ts  # Delivery, Reservations, Inventory (12 tests)
npx ts-node tests/business.test.ts    # HR, Payroll, Expenses, Reviews (13 tests)
```
**Pass Rate:** `100% (62/62 PASS)`

---

## 🐳 Docker Deployment

To run the entire system inside Docker containers:
```powershell
cd restaurant-system
docker-compose up --build -d
```
This boots MySQL 8.0 with automatic healthcheck, Express backend, Admin Web, and Customer Web.

---

## 📄 University Defense Report
For academic evaluators, university project supervisors, and defense presentations, please refer to the comprehensive [UNIVERSITY_REPORT.md](./restaurant-system/UNIVERSITY_REPORT.md) detailing system requirements, ER diagrams, security analysis, and use-case proofs.

---

<div align="center">
Built with ❤️ for Excellence in Computer Science & Software Engineering Capstone 2026.
</div>
