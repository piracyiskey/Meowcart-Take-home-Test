# Store Snapshot Dashboard — Meowcart Take-Home Test

Candidate: **Nguyen Manh Dung**  
Position: **Fresher Software Engineer**  
Store: `meowcart-app-developer-test.myshopify.com`  
Shopify Admin API Version: `2026-10`

---

## Video Walkthrough
- **Demo Recording (Vietnamese)**: [Watch on Google Drive](https://drive.google.com/file/d/1fUUDsCa_PBCm8GNhUmJcMiGElMIDfmqx/view?usp=sharing)
- *A 2-minute walkthrough presenting the live dashboard, data accuracy matching the store, and a concise explanation of the server-side GraphQL proxy architecture.*

---

## 1. How to Install and Run Locally

### Prerequisites
- Node.js 18+ or 20+
- npm

### Installation Steps

```bash
# 1. Clone repository and enter project directory
git clone https://github.com/piracyiskey/Meowcart-Take-home-Test.git
cd Meowcart-Take-home-Test

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
```

Make sure your `.env.local` contains the test store credentials:
```env
SHOPIFY_STORE_DOMAIN=meowcart-app-developer-test.myshopify.com
SHOPIFY_ACCESS_TOKEN=<YOUR_SHOPIFY_ACCESS_TOKEN>
SHOPIFY_API_VERSION=2026-10
```

### Run Project

```bash
# Development mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Main Technical Decisions & Architecture

### 2.1 Server-Side Proxy (`/api/snapshot` and `/api/low-stock`)
- The browser never contacts Shopify directly. This prevents CORS errors and keeps the `SHOPIFY_ACCESS_TOKEN` secure inside `.env.local` on the server runtime.
- The React frontend simply calls internal endpoints: `fetch('/api/snapshot')` and `fetch('/api/low-stock')`.

### 2.2 GraphQL Admin API Exclusively
- Standard endpoint: `POST https://<domain>/admin/api/2026-10/graphql.json`.
- Plain, lightweight `fetch` wrapper in `src/lib/shopify.ts` without heavy external client libraries (like Apollo), keeping the codebase lightweight and straightforward.

### 2.3 Native Search Query Filters (No In-Memory Loops)
- Product counts use Shopify's native `productsCount(query: "status:active")` and `productsCount(query: "status:draft")`.
- Low-stock query uses `products(query: "inventory_total:<5", sortKey: TITLE)` so filtering happens directly at the database layer rather than fetching hundreds of products into Node.js memory.

### 2.4 Relay Cursor-Based Pagination
- Implemented standard `first`, `after`, `last`, `before`, and `pageInfo` on the low-stock inventory table.
- Configured with a page size of 2 to demonstrate smooth forward/backward navigation across the 4 low-stock items in the catalog without "page drift".

### 2.5 30-Day Orders & Revenue Aggregation
- Uses a unified GraphQL query filtering by `created_at:>=<30_DAYS_AGO>` to retrieve `ordersCount` and the `orders` connection with `totalPriceSet.shopMoney.amount`.
- Sums the order amounts using `.reduce()`, calculating the exact gross revenue (**$8,992.01 USD**) across all 7 store orders without extra round-trips.

---

## 3. What I Would Improve With One More Hour

1. **Server-Side Caching (Stale-While-Revalidate)**: Add a 30-second cache to `/api/snapshot` to prevent hitting Shopify API rate limits on multiple rapid page refreshes.
2. **Variant Drill-Down**: Add a simple modal or expandable row to see which specific variants (e.g. Size/Color) of a product are out of stock.
3. **Date Range Filter**: Add quick filter buttons (7 days, 14 days, 30 days) to adjust the orders trend dynamically.

---

## 4. AI Tool Usage Disclosure

In compliance with Meowcart's evaluation principles:
- **Tools Used**: Gemini & Claude (as documentation lookups and syntax debugging assistants).
- **Specific Tasks Assisted by AI**:
  1. **Schema & Field Verification**: Used to quickly confirm Shopify Admin GraphQL `2026-10` schema field names (e.g. `totalPriceSet.shopMoney.amount`, `productsCount` syntax) instead of manually searching through extensive documentation pages.
  2. **Type Checking & Syntax Debugging**: Used to validate Next.js 16 Route Handler type signatures and Tailwind CSS utility classes.
- **Independent Ownership**:
  - All architecture decisions (Server-side proxy boundary, Relay cursor pagination with `endCursor`/`startCursor`, native search query filters, and pure CSS bar chart) were designed, implemented, and verified by me.
  - Every line of code is fully understood and demonstrated in the submitted video walkthrough.

---

## 5. Actual Time Spent

- **Total Time**: ~60 minutes
  - Reading instructions and exploring Shopify documentation: 20 mins
  - Initial connectivity check & API exploration: 10 mins
  - Server routes (`/api/snapshot`, `/api/low-stock`): 10 mins
  - Frontend dashboard & CSS bar chart: 10 mins
  - Verification & documentation: 10 mins
