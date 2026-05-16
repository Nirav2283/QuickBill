"use client";

import { useState } from "react";

interface SaleRow {
  id: string;
  saleNumber: string;
  status: string;
  totalAmount: string;
  itemCount: number;
  creatorName: string;
  createdAt: string;
  products: string;
}

interface StockRow {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  price: string;
  totalSold: number;
  totalRestocked: number;
}

type ReportType = "sales" | "stock";

export default function ReportsClient({
  initialSales,
  initialStock,
}: {
  initialSales: SaleRow[];
  initialStock: StockRow[];
}) {
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sales, setSales] = useState<SaleRow[]>(initialSales);
  const [stock, setStock] = useState<StockRow[]>(initialStock);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch filtered data
  const handleFilter = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", reportType);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();

      if (reportType === "sales") {
        setSales(data.sales || []);
      } else {
        setStock(data.stock || []);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  // Download Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("type", reportType);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/reports/export?${params.toString()}`);
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quickbill_${reportType}_report_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
    setExporting(false);
  };

  // Filtered stats
  const confirmedSales = sales.filter((s) => s.status === "CONFIRMED");
  const cancelledSales = sales.filter((s) => s.status === "CANCELLED");
  const totalRevenue = confirmedSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const avgOrder = confirmedSales.length > 0 ? totalRevenue / confirmedSales.length : 0;

  const outOfStock = stock.filter((p) => p.stock === 0).length;
  const lowStockCount = stock.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const totalStockValue = stock.reduce((sum, p) => sum + p.stock * Number(p.price), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reports & Export</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate sales and stock reports for any period
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {/* Report type */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Report Type
            </label>
            <div className="flex rounded-xl overflow-hidden border border-border">
              <button
                onClick={() => setReportType("sales")}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  reportType === "sales"
                    ? "bg-primary text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => setReportType("stock")}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  reportType === "stock"
                    ? "bg-primary text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Stock
              </button>
            </div>
          </div>

          {/* Date from */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-input-bg border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm"
            />
          </div>

          {/* Date to */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-input-bg border border-input-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm"
            />
          </div>

          {/* Apply */}
          <button
            onClick={handleFilter}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-200 text-sm cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20 flex-shrink-0"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                Apply
              </>
            )}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-5 py-2.5 rounded-xl bg-success hover:bg-success/90 text-white font-semibold transition-all duration-200 text-sm cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-success/20 flex-shrink-0"
          >
            {exporting ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {reportType === "sales" ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger-children">
          <MiniStat label="Confirmed Sales" value={confirmedSales.length} color="success" />
          <MiniStat label="Cancelled" value={cancelledSales.length} color="danger" />
          <MiniStat label="Total Revenue" value={`₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`} color="primary" />
          <MiniStat label="Avg. Order" value={`₹${avgOrder.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`} color="warning" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger-children">
          <MiniStat label="Total Products" value={stock.length} color="primary" />
          <MiniStat label="Out of Stock" value={outOfStock} color="danger" />
          <MiniStat label="Low Stock" value={lowStockCount} color="warning" />
          <MiniStat label="Stock Value" value={`₹${totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`} color="success" />
        </div>
      )}

      {/* Data table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === "sales" ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Sale #</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Products</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Items</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">By</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                      No sales found for this period.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className={`border-b border-border last:border-b-0 ${s.status === "CANCELLED" ? "opacity-50" : ""}`}>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-bold font-mono ${s.status === "CANCELLED" ? "text-muted" : "text-primary"}`}>{s.saleNumber}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={s.products}>{s.products || "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${
                          s.status === "CONFIRMED"
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-danger/10 text-danger border border-danger/20"
                        }`}>
                          {s.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-sm">{s.itemCount}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-semibold ${s.status === "CANCELLED" ? "line-through" : ""}`}>
                          ₹{Number(s.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{s.creatorName}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Product</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Stock</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Price</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Sold</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Restocked</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {stock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  stock.map((p) => {
                    const status = p.stock === 0 ? "out" : p.stock <= p.lowStockThreshold ? "low" : "ok";
                    return (
                      <tr key={p.id} className="border-b border-border last:border-b-0">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted font-mono">{p.sku}</p>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-sm font-bold ${
                            status === "out" ? "text-danger" : status === "low" ? "text-warning" : "text-success"
                          }`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${
                            status === "out"
                              ? "bg-danger/10 text-danger border border-danger/20"
                              : status === "low"
                              ? "bg-warning/10 text-warning border border-warning/20"
                              : "bg-success/10 text-success border border-success/20"
                          }`}>
                            {status === "out" ? "Out" : status === "low" ? "Low" : "OK"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-sm">
                          ₹{Number(p.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-center text-sm">{p.totalSold}</td>
                        <td className="px-5 py-3 text-center text-sm">{p.totalRestocked}</td>
                        <td className="px-5 py-3 text-right text-sm font-semibold">
                          ₹{(p.stock * Number(p.price)).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-5 py-3 border-t border-border bg-card-hover/30">
          <p className="text-xs text-muted">
            {reportType === "sales"
              ? `${sales.length} sale${sales.length !== 1 ? "s" : ""}`
              : `${stock.length} product${stock.length !== 1 ? "s" : ""}`}
            {dateFrom && ` · from ${dateFrom}`}
            {dateTo && ` to ${dateTo}`}
            {!dateFrom && !dateTo && " · all time"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className={`text-xl font-bold ${colorMap[color] || ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
