# Restaurant Management System

A complete, production-style restaurant management system built as a university project.

## 🏗️ Architecture

```
[web-admin] [web-customer] [mobile-customer] [mobile-staff]
                      |
            Express REST API + Socket.IO
                      |
                 MySQL (Prisma)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+ (or Docker)
- pnpm / npm

### 1. Start the Database
```bash
# Option A: Docker (recommended)
docker-compose up mysql -d

# Option B: Local MySQL
# Create database: restaurant_db
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

npm run db:generate    # generate Prisma client
npm run db:migrate     # run migrations
npm run db:seed        # seed demo data
npm run dev            # start dev server on :5000
```

### 3. Admin Panel
```bash
cd web-admin
npm install
npm run dev            # starts on :3000
```

### 4. Customer Website
```bash
cd web-customer
npm install
npm run dev            # starts on :3002
```

## 🔑 Demo Credentials

All staff: **Password123!**

| Role | Email |
|------|-------|
| Super Admin | superadmin@spicegarden.com |
| Admin | admin@spicegarden.com |
| Manager | manager@spicegarden.com |
| Cashier | cashier@spicegarden.com |
| Waiter | waiter@spicegarden.com |
| Kitchen | kitchen@spicegarden.com |
| Rider | rider@spicegarden.com |
| Accountant | accountant@spicegarden.com |
| Inventory | inventory@spicegarden.com |
| HR | hr@spicegarden.com |

Customer accounts: **Customer123!**
- customer@example.com
- customer2@example.com

## 📁 Project Structure

```
restaurant-system/
├── backend/           # Node.js + Express + TypeScript + Prisma
├── web-admin/         # Next.js admin panel (all staff roles)
├── web-customer/      # Next.js public website + online ordering
├── mobile-customer/   # React Native Expo customer app
├── mobile-staff/      # React Native Expo staff app
├── docs/              # ER diagrams, API docs, university report
└── docker-compose.yml
```

## 📚 Documentation

See `/docs` folder for:
- ER Diagram
- API Documentation
- Permission Matrix
- Use Case Diagrams
- University Report Template
