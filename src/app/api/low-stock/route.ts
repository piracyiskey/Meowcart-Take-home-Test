import { NextRequest, NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';
import { LowStockData, LowStockProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const after = searchParams.get('after') || undefined;
    const before = searchParams.get('before') || undefined;

    // Use backward pagination if "before" is set, otherwise forward pagination
    const isBackward = Boolean(before);

    const query = `
      query GetLowStock($first: Int, $after: String, $last: Int, $before: String) {
        products(
          first: $first
          after: $after
          last: $last
          before: $before
          query: "inventory_total:<5"
          sortKey: TITLE
        ) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              id
              title
              totalInventory
            }
          }
        }
      }
    `;

    const variables = isBackward
      ? { last: limit, before }
      : { first: limit, after };

    const result = await shopifyFetch<{
      products: {
        pageInfo: {
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          startCursor: string | null;
          endCursor: string | null;
        };
        edges: Array<{
          node: {
            id: string;
            title: string;
            totalInventory: number;
          };
        }>;
      };
    }>(query, variables);

    const productsData = result.data?.products;

    const products: LowStockProduct[] = (productsData?.edges || []).map((edge) => ({
      id: edge.node.id,
      title: edge.node.title,
      totalInventory: edge.node.totalInventory,
    }));

    const response: LowStockData = {
      products,
      pageInfo: productsData?.pageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch low stock products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
