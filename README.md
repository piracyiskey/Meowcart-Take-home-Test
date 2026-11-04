# Store Snapshot Dashboard — Meowcart Take-Home Test

Candidate: **Nguyen Manh Dung**  
Position: **Fresher Software Engineer**  
Store: `meowcart-app-developer-test.myshopify.com`  
Shopify Admin API Version: `2026-10`

---

## 1. How to Install and Run Locally

### Prerequisites
- Node.js 18+ or 20+
- npm

### Installation Steps

```bash
# 1. Clone repository and enter project directory
git clone https://github.com/piracyiskey/Meowcart-Take-home-Test.git
cd meowcart-store-snapshot

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
- The React frontend simply calls `fetch('/api/snapshot')` and `fetch('/api/low-stock')`.

### 2.2 GraphQL Admin API Exclusively
- Standard endpoint: `POST https://<domain>/admin/api/2026-10/graphql.json`.
- Plain, lightweight `fetch` wrapper in `src/lib/shopify.ts` without heavy external client libraries (like Apollo), keeping the codebase lightweight and straightforward.

### 2.3 Native Search Query Filters (No In-Memory Loops)
- Product counts use Shopify's native `productsCount(query: "status:active")` and `productsCount(query: "status:draft")`.
- Low-stock query uses `products(query: "inventory_total:<5", sortKey: TITLE)` so filtering happens directly at the database layer rather than fetching hundreds of products into Node.js memory.

### 2.4 Relay Cursor-Based Pagination
- Implemented standard `first`, `after`, `last`, `before`, and `pageInfo` on the low-stock inventory table.
- Prevents duplicate or skipped items that occur with offset pagination when inventory changes.

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

In compliance with Meowcart test guidelines:
- **Tools used**: Gemini / Claude for debuging, basic syntax checks and TypeScript typing validation.
- **Scope**: Used to verify GraphQL field names in Shopify API version `2026-10`. The architecture, query design, pagination flow, and UI were written and verified manually.

---

## 5. Actual Time Spent

- **Total Time**: ~60 minutes
  - Reading instruction and exploring Shopify documentations: 20 mins
  - Initial connectivity check & API exploration: 10 mins
  - Server routes (`/api/snapshot`, `/api/low-stock`): 10 mins
  - Frontend dashboard & CSS bar chart: 10 mins
  - Verification & documentation: 10 mins


