import { NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';
import { DashboardData, DailyOrder } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch Shop Name and Product Counts (Total, Active, Draft)
    const productCountsQuery = `
      query GetCounts {
        shop {
          name
        }
        totalProducts: productsCount {
          count
        }
        activeProducts: productsCount(query: "status:active") {
          count
        }
        draftProducts: productsCount(query: "status:draft") {
          count
        }
      }
    `;

    // 2. Fetch 30-day orders count and total revenue
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const ordersQuery = `
      query GetRecentOrders($filter: String!) {
        ordersCount(query: $filter) {
          count
        }
        orders(first: 250, query: $filter) {
          edges {
            node {
              totalPriceSet {
                shopMoney {
                  amount
                }
              }
            }
          }
        }
      }
    `;

    // 3. Fetch past 14 days order count (one alias per day)
    const past14Days: Array<{ date: string; label: string; alias: string }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const date = d.toISOString().split('T')[0];
      const month = d.toLocaleString('en-US', { month: 'short' });
      const label = `${month} ${d.getDate()}`;
      past14Days.push({ date, label, alias: `day_${13 - i}` });
    }

    const dailyQueryFields = past14Days
      .map((item) => `${item.alias}: ordersCount(query: "created_at:${item.date}") { count }`)
      .join('\n');

    const dailyOrdersQuery = `
      query GetDailyTrend {
        ${dailyQueryFields}
      }
    `;

    // Run queries concurrently on the server
    const [countsRes, ordersRes, dailyRes] = await Promise.all([
      shopifyFetch<{
        shop: { name: string };
        totalProducts: { count: number };
        activeProducts: { count: number };
        draftProducts: { count: number };
      }>(productCountsQuery),

      shopifyFetch<{
        ordersCount: { count: number };
        orders: {
          edges: Array<{
            node: { totalPriceSet: { shopMoney: { amount: string } } };
          }>;
        };
      }>(ordersQuery, { filter: `created_at:>=${thirtyDaysAgo}` }),

      shopifyFetch<Record<string, { count: number }>>(dailyOrdersQuery),
    ]);

    // Format 14-day daily trend
    const daily: DailyOrder[] = past14Days.map((item) => ({
      date: item.date,
      label: item.label,
      count: dailyRes.data?.[item.alias]?.count ?? 0,
    }));

    // Calculate gross revenue across all returned orders
    const revenue30d =
      ordersRes.data?.orders?.edges.reduce((sum, edge) => {
        return sum + parseFloat(edge.node.totalPriceSet.shopMoney.amount || '0');
      }, 0) ?? 0;

    const dashboard: DashboardData = {
      shopName: countsRes.data?.shop?.name || 'Meowcart Test Store',
      productCounts: {
        total: countsRes.data?.totalProducts?.count ?? 0,
        active: countsRes.data?.activeProducts?.count ?? 0,
        draft: countsRes.data?.draftProducts?.count ?? 0,
      },
      orders: {
        count30d: ordersRes.data?.ordersCount?.count ?? 0,
        revenue30d,
        daily,
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch store snapshot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
