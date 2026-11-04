'use client';

import React, { useEffect, useState } from 'react';
import { DashboardData, LowStockData } from '@/lib/types';

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardData | null>(null);
  const [lowStock, setLowStock] = useState<LowStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch store KPI metrics from our server-side route (/api/snapshot)
  const fetchSnapshot = async () => {
    try {
      setError(null);
      const res = await fetch('/api/snapshot');
      if (!res.ok) throw new Error(`Snapshot request failed with status ${res.status}`);
      const data: DashboardData = await res.json();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading store snapshot');
    }
  };

  // 2. Fetch low-stock products from our server-side route (/api/low-stock)
  const fetchLowStock = async (cursorParam?: { after?: string; before?: string }) => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '2');
      if (cursorParam?.after) params.set('after', cursorParam.after);
      if (cursorParam?.before) params.set('before', cursorParam.before);

      const res = await fetch(`/api/low-stock?${params.toString()}`);
      if (!res.ok) throw new Error(`Low stock request failed with status ${res.status}`);
      const data: LowStockData = await res.json();
      setLowStock(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading low-stock items');
    } finally {
      setTableLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSnapshot(), fetchLowStock()]);
      setLoading(false);
    };
    init();
  }, []);

  // Manual refresh button
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchSnapshot(), fetchLowStock()]);
    setLoading(false);
  };

  // Cursor pagination handlers
  const handleNextPage = () => {
    if (lowStock?.pageInfo.hasNextPage && lowStock.pageInfo.endCursor) {
      fetchLowStock({ after: lowStock.pageInfo.endCursor });
    }
  };

  const handlePrevPage = () => {
    if (lowStock?.pageInfo.hasPreviousPage && lowStock.pageInfo.startCursor) {
      fetchLowStock({ before: lowStock.pageInfo.startCursor });
    }
  };

  // Compute maximum count for simple CSS bar chart scaling
  const maxOrderCount = Math.max(...(snapshot?.orders.daily.map((d) => d.count) || [1]), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans text-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Store Snapshot Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Store: {snapshot?.shopName || 'meowcart-app-developer-test.myshopify.com'} (Shopify Admin API 2026-10)
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="border border-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-3 border border-red-300 bg-red-50 text-red-800 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="underline font-semibold text-xs ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 border border-gray-200 bg-gray-50">
          Loading store data from Shopify...
        </div>
      ) : snapshot ? (
        <div className="space-y-6">
          {/* 1. Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Products */}
            <div className="border border-gray-300 p-4 bg-white">
              <div className="text-xs font-semibold uppercase text-gray-500">Total Products</div>
              <div className="text-2xl font-bold mt-2">{snapshot.productCounts.total}</div>
              <div className="text-xs text-gray-500 mt-1">Catalog items</div>
            </div>

            {/* Card 2: Active vs Draft */}
            <div className="border border-gray-300 p-4 bg-white">
              <div className="text-xs font-semibold uppercase text-gray-500">Product Status</div>
              <div className="text-2xl font-bold mt-2">{snapshot.productCounts.active} Active</div>
              <div className="text-xs text-gray-500 mt-1">{snapshot.productCounts.draft} Draft</div>
            </div>

            {/* Card 3: 30-Day Orders */}
            <div className="border border-gray-300 p-4 bg-white">
              <div className="text-xs font-semibold uppercase text-gray-500">Orders (Last 30 Days)</div>
              <div className="text-2xl font-bold mt-2">{snapshot.orders.count30d}</div>
              <div className="text-xs text-gray-500 mt-1">Total orders processed</div>
            </div>

            {/* Card 4: 30-Day Revenue */}
            <div className="border border-gray-300 p-4 bg-white">
              <div className="text-xs font-semibold uppercase text-gray-500">Revenue (Last 30 Days)</div>
              <div className="text-2xl font-bold mt-2">
                ${snapshot.orders.revenue30d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total gross sales</div>
            </div>
          </div>

          {/* 2. 14-Day Orders Daily Trend (Simple Bar Chart) */}
          <div className="border border-gray-300 p-4 bg-white">
            <h2 className="text-sm font-bold mb-3">Orders Per Day (Last 14 Days)</h2>
            <div className="flex items-end gap-1 sm:gap-2 h-32 border-b border-gray-300 pb-1 bg-gray-50 px-2 pt-6">
              {snapshot.orders.daily.map((item) => {
                const heightPercent = item.count > 0 ? (item.count / maxOrderCount) * 100 : 4;
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center h-full justify-end">
                    {item.count > 0 && (
                      <span className="text-[10px] font-bold text-gray-700 mb-1">{item.count}</span>
                    )}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[24px] ${item.count > 0 ? 'bg-gray-800' : 'bg-gray-300'}`}
                      title={`${item.label}: ${item.count} orders`}
                    />
                    <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Low-Stock Table (< 5 units) with Cursor Pagination */}
          <div className="border border-gray-300 p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold">Low-Stock Products (Inventory &lt; 5)</h2>
              {tableLoading && <span className="text-xs text-gray-400">Updating...</span>}
            </div>

            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-xs text-gray-600 uppercase">
                  <th className="p-2 border-r border-gray-200">Product Title</th>
                  <th className="p-2 text-right">Total Inventory</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {!lowStock || lowStock.products.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-gray-500">
                      No products with inventory below 5 found.
                    </td>
                  </tr>
                ) : (
                  lowStock.products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 border-r border-gray-200">{product.title}</td>
                      <td className="p-2 text-right font-mono font-medium">
                        {product.totalInventory}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Cursor-Based Pagination Controls */}
            {lowStock && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                <span>Showing {lowStock.products.length} items (2 per page)</span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={!lowStock.pageInfo.hasPreviousPage || tableLoading}
                    className="border border-gray-300 px-3 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={!lowStock.pageInfo.hasNextPage || tableLoading}
                    className="border border-gray-300 px-3 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
