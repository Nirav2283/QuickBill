import { prisma } from "@/app/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import CancelSaleButton from "@/app/components/CancelSaleButton";

interface SaleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const { id } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { name: true, sku: true } } },
      },
      creator: { select: { name: true } },
    },
  });

  if (!sale) notFound();

  const isCancelled = sale.status === "CANCELLED";

  return (
    <div>
      <Link href="/sales" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Sales
      </Link>

      {/* Header with status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{sale.saleNumber}</h1>
            {isCancelled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirmed
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            by {sale.creator.name} ·{" "}
            {new Date(sale.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className={`text-2xl font-bold ${isCancelled ? "text-muted line-through" : "text-primary"}`}>
              ₹{Number(sale.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          {!isCancelled && (
            <>
              <Link
                href={`/sales/${sale.id}/invoice`}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium transition-all duration-200 text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Invoice
              </Link>
              <CancelSaleButton saleId={sale.id} saleNumber={sale.saleNumber} />
            </>
          )}
        </div>
      </div>

      {/* Cancellation notice */}
      {isCancelled && (
        <div className="bg-danger-glow border border-danger/20 rounded-2xl p-4 mb-6 animate-fade-in">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-danger">Order Cancelled</p>
              {sale.cancelNote && (
                <p className="text-sm text-danger/80 mt-0.5">Reason: {sale.cancelNote}</p>
              )}
              {sale.cancelledAt && (
                <p className="text-xs text-danger/60 mt-1">
                  Cancelled on{" "}
                  {new Date(sale.cancelledAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <p className="text-xs text-danger/60 mt-0.5">All stock from this sale has been restored.</p>
            </div>
          </div>
        </div>
      )}

      {/* Line items — read-only, no edit capability */}
      <div className={`bg-card border rounded-2xl overflow-hidden ${isCancelled ? "border-danger/20 opacity-75" : "border-border"}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Product</th>
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Qty</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Unit Price</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-b-0">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted font-mono">{item.product.sku}</p>
                </td>
                <td className="px-5 py-3 text-center text-sm">{item.quantity}</td>
                <td className="px-5 py-3 text-right text-sm">
                  ₹{Number(item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3 text-right text-sm font-semibold">
                  ₹{Number(item.lineTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t border-border bg-card-hover/30 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
          </span>
          <span className={`text-lg font-bold ${isCancelled ? "line-through text-muted" : ""}`}>
            ₹{Number(sale.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
