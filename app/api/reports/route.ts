import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "sales";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(from + "T00:00:00");
  if (to) dateFilter.lte = new Date(to + "T23:59:59");

  if (type === "sales") {
    const sales = await prisma.sale.findMany({
      where: {
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
      include: {
        creator: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({
      sales: sales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        status: s.status,
        totalAmount: s.totalAmount.toString(),
        itemCount: s.itemCount,
        creatorName: s.creator.name,
        createdAt: s.createdAt.toISOString(),
        products: s.items.map((i) => i.product.name).join(", "),
      })),
    });
  } else {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const saleAgg = await prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        sale: {
          status: "CONFIRMED",
          ...(from || to ? { createdAt: dateFilter } : {}),
        },
      },
    });
    const saleMap = new Map(saleAgg.map((a) => [a.productId, a._sum.quantity || 0]));

    const restockAgg = await prisma.stockLog.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        type: "RESTOCK",
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
    });
    const restockMap = new Map(restockAgg.map((a) => [a.productId, a._sum.quantity || 0]));

    return NextResponse.json({
      stock: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        price: p.price.toString(),
        totalSold: saleMap.get(p.id) || 0,
        totalRestocked: restockMap.get(p.id) || 0,
      })),
    });
  }
}
