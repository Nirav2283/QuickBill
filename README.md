# ⚡ QuickBill

A modern, full-featured billing and inventory management system built with Next.js 16, designed for small to medium retail businesses. QuickBill handles everything from product catalog management to point-of-sale operations, stock tracking, and exportable reports.

---

## ✨ Features

### 🔐 Authentication & Access Control
- Secure JWT-based session management with HTTP-only cookies
- **Role-based access**: Admin and Staff roles with distinct permissions
- Route-level protection via Next.js middleware proxy
- Auto-redirect for unauthenticated users

### 📦 Product Management *(Admin only)*
- Full CRUD operations for product catalog
- Smart validations: duplicate name detection, impossible price prevention, empty form blocking
- Auto-generated SKU codes
- Category tagging and product descriptions
- Soft-delete architecture (products deactivated, not destroyed)

### 📊 Stock Management *(Admin only)*
- Real-time stock level monitoring with color-coded status (Out / Low / In Stock)
- Dedicated restock workflow with audit logging
- Full stock movement history timeline per product
- Configurable low-stock thresholds per product
- Low stock alerts on the admin dashboard

### 🛒 Sales / Point of Sale *(All roles)*
- Counter-style POS interface with product search and quantity inputs
- Real-time running total as items are added
- **Atomic transactions**: stock verification → decrement → sale creation in a single database transaction
- Insufficient stock is explicitly blocked with clear error messages (never silently ignored)
- Auto-generated sale numbers (e.g., `SALE-20260516-001`)

### 📄 Order Management
- **Confirmed orders are immutable** — read-only after creation
- **Cancel Order** workflow with reason prompt
- Cancellation atomically reverses all stock deductions
- Full cancellation audit trail (who, when, why)

### 🧾 Invoice Generation
- Clean, professional printable invoices at `/sales/[id]/invoice`
- White-on-paper design optimized for `Ctrl+P` browser printing
- Contains: business branding, invoice number, date/time, billed by, itemized table, grand total
- A4 page size with proper margins via `@page` CSS

### 📈 Reports & Export *(Admin only)*
- **Sales Report**: summary metrics, transaction list, line-item detail
- **Stock Report**: inventory status, stock value, sold/restocked quantities, movement log
- Date range filtering (from/to) for any time period
- **Excel export** with multi-sheet `.xlsx` workbooks (powered by SheetJS)
- Product name column in sales reports for quick reference

### 📱 Responsive Design
- Fully responsive across desktop, tablet, and mobile
- Mobile sidebar with hamburger menu, slide-in overlay, and auto-close on navigation
- Dark theme with premium glassmorphism aesthetic

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| **Language** | TypeScript |
| **Database** | PostgreSQL via [Supabase](https://supabase.com/) |
| **ORM** | [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-pg` |
| **Auth** | JWT sessions via [jose](https://github.com/panva/jose) + bcryptjs |
| **Validation** | [Zod 4](https://zod.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Excel Export** | [SheetJS (xlsx)](https://sheetjs.com/) |
| **Deployment** | [Vercel](https://vercel.com/) (recommended) |

---

## 📁 Project Structure

```
quick_bill/
├── app/
│   ├── (dashboard)/            # Protected dashboard layout group
│   │   ├── dashboard/          # Role-aware dashboard page
│   │   ├── products/           # Product CRUD (admin only)
│   │   │   ├── new/            # Add new product
│   │   │   └── [id]/edit/      # Edit product
│   │   ├── stock/              # Stock management (admin only)
│   │   │   └── [id]/
│   │   │       ├── logs/       # Stock history timeline
│   │   │       └── restock/    # Restock form
│   │   ├── sales/              # Sales & POS
│   │   │   ├── new/            # New sale (POS interface)
│   │   │   └── [id]/
│   │   │       └── invoice/    # Printable invoice
│   │   └── reports/            # Reports & export (admin only)
│   ├── actions/                # Server actions
│   │   ├── auth.ts             # Login / logout
│   │   ├── product.ts          # Product CRUD
│   │   ├── sale.ts             # Create / cancel sale
│   │   └── stock.ts            # Restock / adjust
│   ├── api/
│   │   └── reports/            # Report API routes
│   │       ├── route.ts        # JSON data for filtering
│   │       └── export/route.ts # Excel file download
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utilities
│   │   ├── db.ts               # Prisma singleton client
│   │   ├── definitions.ts      # Zod schemas & types
│   │   └── session.ts          # JWT encrypt/decrypt
│   ├── globals.css             # Design system & print styles
│   └── layout.tsx              # Root layout with Inter font
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Demo user seeding
├── proxy.ts                    # Auth middleware (route protection)
└── package.json
```

---

```

**Models**: `User`, `Product`, `Sale`, `SaleItem`, `StockLog`  
**Enums**: `Role` (ADMIN/STAFF), `SaleStatus` (CONFIRMED/CANCELLED), `StockLogType` (SALE/RESTOCK/ADJUSTMENT/CANCELLATION)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** database (or a [Supabase](https://supabase.com/) project)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/quick_bill.git
cd quick_bill
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
SESSION_SECRET="your-secret-key-min-32-chars-long"
```

> **Supabase users**: Use the connection string from your Supabase project settings → Database → Connection string (URI).

### 3. Database Setup

```bash
# Generate the Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push

# Seed demo users
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@quickbill.com` | `Admin@123` |
| **Staff** | `staff@quickbill.com` | `Staff@123` |

---

## 🔒 Role Permissions

| Feature | Admin | Staff |
|---------|:-----:|:-----:|
| Dashboard (full stats) | ✅ | — |
| Dashboard (POS-focused) | — | ✅ |
| Products (CRUD) | ✅ | ❌ |
| Stock Management | ✅ | ❌ |
| New Sale (POS) | ✅ | ✅ |
| View Sales | ✅ | ✅ |
| Cancel Orders | ✅ | ✅ |
| View Invoices | ✅ | ✅ |
| Reports & Export | ✅ | ❌ |

---

## 📝 License

This project is private and not licensed for public distribution.
