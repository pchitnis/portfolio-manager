# Portfolio Manager - Architecture & Design Guide

## Overview

A personal portfolio management and net-worth tracking application built with **Next.js 14 App Router**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**. Users can track multiple asset types, manage liabilities, view a unified dashboard with currency conversion, and maintain monthly cash flow statements with visual analytics.

## Tech Stack

| Layer         | Technology                                              |
|---------------|---------------------------------------------------------|
| Framework     | Next.js 14 (App Router, `src/` directory)               |
| Language      | TypeScript                                              |
| Database      | PostgreSQL via Prisma ORM                               |
| Auth          | NextAuth.js v4 — credentials provider, JWT sessions     |
| Styling       | Tailwind CSS v4 (via `@tailwindcss/postcss`)            |
| Charts        | Recharts (ComposedChart, PieChart)                      |
| Icons         | lucide-react                                            |
| Email         | Nodemailer (Gmail SMTP for password reset)              |
| Market Data   | Yahoo Finance v8 chart API (stocks & forex rates)       |
| Validation    | Zod (available, inline validation used in practice)     |

## Quick Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio GUI
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── assets/[type]/route.ts          # Generic CRUD for all 8 asset types
│   │   ├── assets/[type]/[id]/route.ts     # GET/PUT/DELETE single asset
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts      # NextAuth handler
│   │   │   ├── register/route.ts           # User registration
│   │   │   ├── forgot-password/route.ts    # Password reset token creation
│   │   │   └── reset-password/route.ts     # Token validation & password update
│   │   ├── cashflow/route.ts               # GET/POST cash flow entries
│   │   ├── dashboard/route.ts              # Aggregated dashboard with forex conversion
│   │   ├── forex/rate/route.ts             # Forex rate lookup (Yahoo Finance)
│   │   ├── stocks/price/route.ts           # Stock price lookup (Yahoo Finance)
│   │   ├── upload/route.ts                 # File upload (saves to public/uploads/)
│   │   └── user/currency/route.ts          # GET/PATCH user currency preference
│   ├── assets/
│   │   ├── page.tsx                        # Asset type selection grid
│   │   ├── bank-accounts/page.tsx          # Each asset page uses AssetGrid
│   │   ├── term-deposits/page.tsx
│   │   ├── stocks/page.tsx
│   │   ├── metals/page.tsx
│   │   ├── real-estate/page.tsx
│   │   ├── pension/page.tsx
│   │   ├── loans/page.tsx
│   │   └── insurance/page.tsx
│   ├── cashflow/page.tsx                   # Full cash flow statement + charts
│   ├── dashboard/page.tsx                  # Net worth dashboard
│   ├── home/page.tsx                       # Landing page (post-login)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── layout.tsx                          # Root layout with Providers
│   ├── page.tsx                            # Root redirect
│   └── globals.css
├── components/
│   ├── asset-form.tsx                      # Dynamic form (handles all asset types)
│   ├── asset-grid.tsx                      # Data table with CRUD actions
│   ├── dashboard-card.tsx                  # Expandable summary card
│   ├── navbar.tsx                          # Top navigation bar
│   ├── providers.tsx                       # SessionProvider + ToastProvider
│   └── ui/                                 # Reusable UI primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── toast.tsx
├── lib/
│   ├── asset-configs.ts                    # Declarative config for all 8 asset types
│   ├── auth.ts                             # NextAuth configuration
│   ├── currencies.ts                       # Currency list, symbols, grouped options
│   ├── email.ts                            # Nodemailer transporter for password reset
│   ├── prisma.ts                           # Singleton Prisma client
│   ├── utils.ts                            # cn() and formatCurrency()
│   └── yahoo-finance.ts                    # Stock/forex price fetcher
├── types/
│   ├── index.ts                            # DashboardData interface, NextAuth module augmentation
│   └── next-auth.d.ts                      # Session type extensions
└── middleware.ts                            # NextAuth route protection
```

## Architecture Patterns

### 1. Configuration-Driven Asset Management

The core design pattern is a **declarative asset configuration system** in `src/lib/asset-configs.ts`. Each of the 8 asset types (bank accounts, term deposits, stocks, metals, real estate, pension, loans, insurance) is defined as an `AssetTypeConfig` object with:

- **`fields`**: Array of `FieldConfig` defining form inputs (type, validation, conditional visibility via `showWhen`, auto-calculation features)
- **`gridColumns`**: Array of `GridColumn` defining table display (supports `computed` columns, `noFormatCurrency`, `noTotal` flags)
- **`prismaModel`**: Maps to Prisma model name for the generic API

This allows **two generic components** (`AssetForm` + `AssetGrid`) to handle all 8 asset types without any type-specific code. Each asset page is a thin wrapper:

```tsx
// Example: src/app/assets/bank-accounts/page.tsx
import { AssetGrid } from "@/components/asset-grid";
import { assetConfigs } from "@/lib/asset-configs";
export default function Page() {
  return <AssetGrid config={assetConfigs["bank-accounts"]} />;
}
```

### 2. Generic API Routes

`src/app/api/assets/[type]/route.ts` uses a `modelMap` to dynamically resolve the Prisma model from the URL parameter. This single route file handles CRUD for all 8 asset types. The `[id]` subroute handles GET/PUT/DELETE for individual items with ownership verification.

### 3. Smart Form Features (AssetForm)

The `AssetForm` component supports several automatic behaviors configured declaratively in `FieldConfig`:

- **`autoFetchPrice`**: Fetches live stock prices from Yahoo Finance when symbol/quantity changes (800ms debounce)
- **`autoCalcCompound`**: Calculates compound interest for term deposits based on principal, rate, frequency, and start date
- **`autoSuggestNextDue`**: Suggests next insurance premium due date based on payment schedule
- **`showWhen`**: Conditional field visibility (e.g., quarterly month selectors only shown when frequency = "Quarterly")
- **`groupedOptions`**: Supports `<optgroup>` for currency dropdowns

### 4. Dashboard Currency Conversion

The dashboard API (`/api/dashboard`) accepts a `?currency=` parameter and:
1. Fetches all assets for the user in parallel
2. Collects unique source currencies across all assets
3. Fetches forex rates via Yahoo Finance (5-minute in-memory cache)
4. Converts all values to the display currency before aggregation

### 5. Cash Flow Statement

The cash flow page (`/cashflow`) is a standalone feature with:
- **Indian fiscal year model** (Apr–Mar), selectable year
- **Inflow and outflow tables** with editable categories, monthly values, row totals, column totals
- **"Copy to all months" checkbox**: Copies first non-zero value across all months, auto-unchecks
- **Validation**: Blocks save on non-numeric input, negative values, >2 decimal places
- **Charts**: ComposedChart (bar + line), two PieCharts (income/spending analysis by category)
- **Persistence**: Upsert via compound unique key `(userId, type, category, fiscalYear)`. Deleted rows are removed in a `prisma.$transaction` before upserting remaining entries
- **Currency stored in DB**: User's preferred currency persisted via `/api/user/currency` (not localStorage)

Default rows are only shown on first load (`entries.length === 0`). Once the user has saved data, only DB entries are displayed — deleted rows do not reappear.

## Database Schema (Prisma)

**10 models** defined in `prisma/schema.prisma`:

| Model              | Purpose                                                  |
|--------------------|----------------------------------------------------------|
| User               | Auth (email/password), country, currency preference      |
| PasswordResetToken | Time-limited tokens for forgot-password flow             |
| BankAccount        | Bank accounts with holder, balance, currency             |
| TermDeposit        | FDs, ISAs, bonds with compound interest calculation      |
| Stock              | Stocks/mutual funds with live price fetch                |
| Metal              | Precious metals (gold, silver, etc.)                     |
| RealEstate         | Properties with purchase price, current value, mortgage  |
| Pension            | Pension pots with provider details                       |
| Loan               | Loans by type (mortgage, car, credit card, retail)       |
| Insurance          | Policies with premium schedule and document upload       |
| CashFlowEntry     | Monthly inflow/outflow with fiscal year grouping         |

Every asset model has a `currency` field (default "INR") enabling multi-currency support. All models use `onDelete: Cascade` from User.

## Authentication Flow

- **Provider**: Credentials (email + bcrypt password)
- **Session strategy**: JWT (no database sessions)
- **Middleware**: Protects `/home`, `/assets/*`, `/dashboard/*`, `/cashflow/*`
- **Stale JWT handling**: API routes verify `prisma.user.findUnique` before writes to catch sessions that reference deleted users after DB migrations
- **Password reset**: Token-based via email (Nodemailer/Gmail), 1-hour expiry, single-use tokens

## Key Conventions

- **Currency formatting**: Always use `formatCurrency(amount, currencyCode)` from `src/lib/utils.ts` (wraps `Intl.NumberFormat`)
- **Currency data**: Import from `src/lib/currencies.ts` — `PRIORITY_CURRENCIES` (INR, USD, GBP, EUR), `OTHER_CURRENCIES` (~40 more), `CURRENCY_GROUPED_OPTIONS` for dropdowns
- **All pages are client components** ("use client") that check `useSession()` status and redirect unauthenticated users
- **Toast notifications**: Via `useToast()` hook from custom `ToastProvider` — `toast("message")` for success, `toast("message", "error")` for errors
- **API error handling pattern**: Always surface the actual API error message in the UI — `const body = await res.json().catch(() => null); toast(body?.error || "Fallback message", "error")`
- **File uploads**: Stored on disk at `public/uploads/{userId}/`, paths saved as JSON arrays in the database
- **No testing framework** is currently configured

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL` — Base URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET` — JWT signing secret
- `GMAIL_USER` — Gmail address for password reset emails
- `GMAIL_APP_PASSWORD` — Gmail app password
