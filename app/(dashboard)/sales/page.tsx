import { prisma } from "@/app/lib/db";
import Link from "next/link";

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    include: {
      creator: { select: { name: true } },
      items: {
        select: { quantity: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View all sales transactions
          </p>
        </div>
        <Link
          href="/sales/new"
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-primary/20 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Sale
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-glow border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create your first sale to start tracking revenue.
          </p>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-200 shadow-lg shadow-primary/20 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create First Sale
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Sale #</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Items</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Created By</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {sales.map((sale) => {
                  const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                  const isCancelled = sale.status === "CANCELLED";
                  return (
                    <tr key={sale.id} className={`border-b border-border last:border-b-0 hover:bg-card-hover transition-colors ${isCancelled ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-bold font-mono ${isCancelled ? "text-muted" : "text-primary"}`}>{sale.saleNumber}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-success/10 text-success border border-success/20">
                            Confirmed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm">{sale.itemCount} ({totalQty} units)</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-semibold ${isCancelled ? "line-through text-muted" : ""}`}>
                          ₹{Number(sale.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-muted-foreground">{sale.creator.name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/sales/${sale.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary-glow border border-primary/20 transition-all duration-200"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border bg-card-hover/30">
            <p className="text-xs text-muted">
              {sales.length} sale{sales.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
