# 🎓 Spice Garden: Enterprise Multi-Branch Restaurant Management System
## Final Year Undergraduate Capstone Project Report

**Author / Candidate:** Computer Science & Engineering Department  
**Academic Year:** 2026  
**System Name:** Spice Garden RMS  
**Repository Architecture:** Unified Monorepo (Node.js, Express, Next.js, React Native, Prisma, MySQL)

---

## 1. Executive Summary
The restaurant and hospitality industry requires rigorous synchronization across front-of-house operations, back-of-house kitchens, home delivery logistics, and fiscal audits. Traditional systems suffer from disparate databases, fragmented client apps, inventory drift, and manual cash register errors. 

**Spice Garden RMS** solves this problem by enforcing a **single source of truth**: one unified MySQL database and one central Express + Socket.IO REST/real-time server that powers five specialized client interfaces:
1. **Web Admin Portal**: Role-based executive management and operational reporting.
2. **Web POS Terminal**: Fast-touch dine-in/takeaway counter checkout with 80mm thermal receipt printing.
3. **Kitchen Display System (KDS)**: Fullscreen real-time Kanban board with Web Audio chime alerts.
4. **Customer Web Application**: Responsive online menu browsing, table QR self-ordering, and live tracking.
5. **Mobile Apps (Expo React Native)**: Dedicated apps for customers and staff (waiter, chef, rider).

---

## 2. Requirement Analysis & Problem Statement

### 2.1 The Multi-Client Challenge
Existing solutions frequently deploy separate databases for online customer web apps, cashier desktop apps, and delivery portals. This creates severe synchronization bugs:
- Out-of-stock items (86'd in kitchen) remain orderable online.
- Table occupancy states mismatch across waiter tablets and POS registers.
- Manual re-entry of daily cash drawer balances leads to unrecorded shortages.

### 2.2 System Objectives
1. **Unified Database & Architecture**: 100% centralized data storage using Prisma ORM on MySQL 8.
2. **Real-time Event Bus**: Sub-second socket propagation (`order:new`, `order:status`, `kitchen:ready`, `stock:low`).
3. **Omni-Channel Order Pipeline**: Seamlessly handle `DINE_IN`, `TAKEAWAY`, and `DELIVERY`.
4. **Granular RBAC**: Role-Based Access Control spanning 10 distinct roles (Super Admin, Branch Manager, Cashier, Chef, Waiter, Rider, Inventory Manager, Accountant, HR Manager, Customer).
5. **Financial Reconciliations**: Automated VAT calculation (5%), split payments (Cash + Card), cash drawer float reconciliation, and recipe-based Cost of Goods Sold (COGS).

---

## 3. System Architecture & Component Interaction

```
[Customer Web / QR]    [Staff Waiter App]    [POS Cashier Terminal]
        │                      │                       │
        └───────────────┬──────┴───────────────────────┘
                        ▼
               HTTP REST / WebSocket
                        ▼
  ┌────────────────────────────────────────────────────────┐
  │         Express.js + Socket.IO Backend (Port 5000)     │
  │  ────────────────────────────────────────────────────  │
  │  • JWT Auth & RBAC Middleware                          │
  │  • Zod Request Validation                              │
  │  • Real-time Room Dispatcher (branch, kitchen, order)  │
  │  • SSLCommerz Sandbox Payment Gateway                  │
  │  • Recipe Ingredient Deduction Engine                  │
  └───────────────────────────┬────────────────────────────┘
                              ▼
                     Prisma ORM Client
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                 MySQL Database (Port 3306)             │
  │  ────────────────────────────────────────────────────  │
  │  40+ Relational Entities with Foreign Key Constraints  │
  └────────────────────────────────────────────────────────┘
                              ▲
                              │
  ┌───────────────────────────┴────────────────────────────┐
  │           Kitchen Display System (KDS / Mobile)        │
  │  • Real-time Audio Chimes (Web Audio API)              │
  │  • Station Filters (Grill, Fry, Bar, Dessert)          │
  │  • Bump Button (Pending -> Cooking -> Ready)           │
  └────────────────────────────────────────────────────────┘
```

---

## 4. Database Design & Entity Relationship Overview
The schema (`schema.prisma`) comprises **40+ models** organized into logical domains:
- **Core & Multi-Branch**: `Branch`, `Setting`, `AuditLog`.
- **Identity & RBAC**: `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `DeviceToken`.
- **Menu & Catalog**: `Category`, `MenuItem`, `ItemVariant`, `AddonGroup`, `Addon`.
- **Tables & Dine-In**: `Table`, `TableSession`, `TableSessionGuest`.
- **Orders & Kitchen**: `Order`, `OrderItem`, `OrderItemAddon`, `KitchenTicket`.
- **Payments & Cash Drawer**: `Payment`, `CashRegisterSession`, `MoneyReceived`, `Refund`.
- **Inventory & Supply Chain**: `Ingredient`, `Recipe`, `StockMovement`, `Wastage`, `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`.
- **Delivery & Logistics**: `DeliveryZone`, `Rider`, `Delivery`.
- **Human Resources & Payroll**: `Employee`, `Shift`, `Attendance`, `Leave`, `Salary`.
- **Customer Loyalty & Marketing**: `Customer`, `Address`, `Coupon`, `Review`, `Notification`.

---

## 5. Security & RBAC Implementation

### 5.1 Authentication Mechanism
- **Access Tokens**: Short-lived (15 minutes) signed with HMAC-SHA256 (`JWT_ACCESS_SECRET`).
- **Refresh Tokens**: Long-lived (7 days) stored securely in `HttpOnly` / AsyncStorage and rotatable upon renewal.
- **Password Security**: Bcrypt with work factor of 10.

### 5.2 Granular RBAC Middleware
Access to protected routes is guarded by declarative RBAC authorization:
```typescript
router.patch(
  '/:id/status',
  authenticate,
  authorize('orders', 'edit'),
  auditLog('orders', 'UPDATE_STATUS'),
  ordersController.updateOrderStatus
);
```
Every critical operation generates an immutable `AuditLog` row tracking the actor's user ID, entity modified, old vs new values, and IP address.

---

## 6. Real-Time Socket Architecture & Rooms
Clients join specific Socket.IO rooms on connection:
- `branch:{id}`: Broadcasts sales metrics and branch-wide alerts.
- `kitchen:{id}`: Pushes `order:new` to KDS terminals to trigger immediate audio chimes.
- `order:{id}`: Customer live tracker room emitting stage updates without polling.
- `rider:{id}`: Dispatch alerts for newly assigned home delivery routes.

---

## 7. Verification & Automated Testing
The system includes **62 automated tests** across 5 test suites verifying business logic, validation constraints, and database integrity:
1. `tests/foundation.test.ts` (14 tests): Hashing, JWT rotation, pagination, and custom errors.
2. `tests/orders.test.ts` (10 tests): Order placement, validation schemas, table transfer, and void approvals.
3. `tests/payments.test.ts` (13 tests): Payment settlement, change-due math, cash drawer shortage/excess calculation.
4. `tests/operations.test.ts` (12 tests): Delivery zones, rider dispatch, inventory tracking, and purchase orders.
5. `tests/business.test.ts` (13 tests): Employee shifts, payroll calculation, promo coupons, and customer review replies.

**Pass rate: 100% (62/62 tests passing).**

---

## 8. Conclusion & Future Work
Spice Garden RMS establishes that a clean, single-backend architecture can successfully unify diverse clients (Admin desktop, touch POS, kitchen displays, web consumers, and staff mobile apps) without data fragmentation. 

Future production enhancements include:
- Cloud kitchen printer integration (ESC/POS network printing over TCP/IP).
- Offline SQLite sync with auto-reconciliation for edge POS kiosks during internet outages.
- AI-driven dynamic menu pricing and inventory demand forecasting.
