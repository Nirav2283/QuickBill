import { prisma } from "@/app/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

interface StockLogsPageProps {
  params: Promise<{ id: string }>;
}

export default async function StockLogsPage({ params }: StockLogsPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, sku: true, stock: true },
  });

  if (!product) notFound();

  const logs = await prisma.stockLog.findMany({
    where: { productId: id },
    include: {
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/stock"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Stock
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Stock History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          <span className="font-semibold text-foreground">{product.name}</span>{" "}
          <span className="font-mono text-xs">({product.sku})</span> — Current stock:{" "}
          <span className="font-bold">{product.stock}</span>
        </p>
      </div>

      {/* Timeline */}
      {logs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No stock history yet.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {logs.map((log) => {
            const isPositive = log.quantity > 0;
            const typeConfig = {
              SALE: {
                color: "text-danger",
                bg: "bg-danger-glow",
                border: "border-danger/20",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                ),
              },
              RESTOCK: {
                color: "text-success",
                bg: "bg-success-glow",
                border: "border-success/20",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                ),
              },
              ADJUSTMENT: {
                color: "text-primary",
                bg: "bg-primary-glow",
                border: "border-primary/20",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                ),
              },
              CANCELLATION: {
                color: "text-warning",
                bg: "bg-warning-glow",
                border: "border-warning/20",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                  </svg>
                ),
              },
            };

            const config = typeConfig[log.type];

            return (
              <div
                key={log.id}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:border-border-hover transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase ${config.color}`}>
                      {log.type}
                    </span>
                    <span className={`text-sm font-bold ${isPositive ? "text-success" : "text-danger"}`}>
                      {isPositive ? "+" : ""}
                      {log.quantity}
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-sm text-muted-foreground mt-0.5">{log.note}</p>
                  )}
                  <p className="text-xs text-muted mt-1">
                    by {log.creator.name} ·{" "}
                    {new Date(log.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
