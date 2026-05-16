import { prisma } from "@/app/lib/db";
import ReportsClient from "@/app/components/ReportsClient";

export default async function ReportsPage() {
  // Fetch initial data (all time)
  const [sales, products] = await Promise.all([
    prisma.sale.findMany({
      include: {
        creator: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Get aggregated sale quantities per product
  const saleAgg = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    where: { sale: { status: "CONFIRMED" } },
  });
  const saleMap = new Map(saleAgg.map((a) => [a.productId, a._sum.quantity || 0]));

  const restockAgg = await prisma.stockLog.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    where: { type: "RESTOCK" },
  });
  const restockMap = new Map(restockAgg.map((a) => [a.productId, a._sum.quantity || 0]));

  const initialSales = sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    status: s.status,
    totalAmount: s.totalAmount.toString(),
    itemCount: s.itemCount,
    creatorName: s.creator.name,
    createdAt: s.createdAt.toISOString(),
    products: s.items.map((i) => i.product.name).join(", "),
  }));

  const initialStock = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    price: p.price.toString(),
    totalSold: saleMap.get(p.id) || 0,
    totalRestocked: restockMap.get(p.id) || 0,
  }));

  return <ReportsClient initialSales={initialSales} initialStock={initialStock} />;
}
