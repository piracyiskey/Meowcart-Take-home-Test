// Helper to send GraphQL queries to Shopify Admin API
// This code runs ONLY on the server, so SHOPIFY_ACCESS_TOKEN is never exposed to the browser.

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-10';

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  if (!DOMAIN || !TOKEN) {
    throw new Error('Missing Shopify domain or token in environment variables.');
  }

  const endpoint = `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store', // Always get fresh data
  });

  if (!response.ok) {
    throw new Error(`Shopify HTTP Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
