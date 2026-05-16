import { prisma } from "@/app/lib/db";
import Link from "next/link";

export default async function StockPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ stock: "asc" }, { name: "asc" }],
  });

  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
  ).length;
  const healthy = products.filter(
    (p) => p.stock > p.lowStockThreshold
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Stock Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor stock levels and restock products
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger-children">
        <div className="bg-card border border-danger/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-danger-glow border border-danger/20 flex items-center justify-center text-danger">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold">{outOfStock}</p>
            <p className="text-xs text-muted-foreground">Out of Stock</p>
          </div>
        </div>

        <div className="bg-card border border-warning/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-warning-glow border border-warning/20 flex items-center justify-center text-warning">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold">{lowStock}</p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </div>
        </div>

        <div className="bg-card border border-success/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-success-glow border border-success/20 flex items-center justify-center text-success">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold">{healthy}</p>
            <p className="text-xs text-muted-foreground">Healthy Stock</p>
          </div>
        </div>
      </div>

      {/* Stock table */}
      {products.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No products found. Add products first.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Product</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Current Stock</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Threshold</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {products.map((product) => {
                  const status =
                    product.stock === 0
                      ? "out"
                      : product.stock <= product.lowStockThreshold
                      ? "low"
                      : "ok";

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-border last:border-b-0 hover:bg-card-hover transition-colors ${
                        status === "out" ? "bg-danger-glow/20" : status === "low" ? "bg-warning-glow/20" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted font-mono">{product.sku}</p>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`text-lg font-bold ${
                            status === "out"
                              ? "text-danger"
                              : status === "low"
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-sm text-muted-foreground">
                        {product.lowStockThreshold}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {status === "out" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                            Out of Stock
                          </span>
                        ) : status === "low" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/stock/${product.id}/restock`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-success-glow text-success border border-success/20 hover:bg-success/20 transition-all duration-200 flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Restock
                          </Link>
                          <Link
                            href={`/stock/${product.id}/logs`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-border-hover transition-all duration-200"
                          >
                            History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
