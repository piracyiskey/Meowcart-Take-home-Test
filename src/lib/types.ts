// TypeScript interfaces for our dashboard data

export interface ProductCounts {
  total: number;
  active: number;
  draft: number;
}

export interface DailyOrder {
  date: string;
  label: string;
  count: number;
}

export interface OrdersSnapshot {
  count30d: number;
  revenue30d: number;
  daily: DailyOrder[];
}

export interface DashboardData {
  shopName: string;
  productCounts: ProductCounts;
  orders: OrdersSnapshot;
}

export interface LowStockProduct {
  id: string;
  title: string;
  totalInventory: number;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface LowStockData {
  products: LowStockProduct[];
  pageInfo: PageInfo;
}
