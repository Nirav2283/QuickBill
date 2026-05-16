import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
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

  const wb = XLSX.utils.book_new();

  if (type === "sales") {
    // ─── SALES REPORT ───
    const sales = await prisma.sale.findMany({
      where: {
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
      include: {
        creator: { select: { name: true } },
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Summary sheet
    const confirmed = sales.filter((s) => s.status === "CONFIRMED");
    const cancelled = sales.filter((s) => s.status === "CANCELLED");
    const totalRevenue = confirmed.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalItems = confirmed.reduce((sum, s) => sum + s.itemCount, 0);

    const summaryData = [
      ["QuickBill — Sales Report"],
      ["Period", from ? `${from} to ${to || "today"}` : "All time"],
      ["Generated", new Date().toLocaleString("en-IN")],
      [],
      ["Metric", "Value"],
      ["Total Sales", confirmed.length],
      ["Cancelled Sales", cancelled.length],
      ["Total Revenue", totalRevenue],
      ["Total Items Sold", totalItems],
      ["Average Order Value", confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs["!cols"] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Sales detail sheet
    const salesRows = sales.map((s) => ({
      "Sale #": s.saleNumber,
      Status: s.status,
      "Total (₹)": Number(s.totalAmount),
      Items: s.itemCount,
      "Created By": s.creator.name,
      Date: new Date(s.createdAt).toLocaleString("en-IN"),
      ...(s.cancelNote ? { "Cancel Reason": s.cancelNote } : {}),
    }));
    const salesWs = XLSX.utils.json_to_sheet(salesRows);
    salesWs["!cols"] = [
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 8 },
      { wch: 18 }, { wch: 22 }, { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, salesWs, "Sales");

    // Line items detail sheet
    const lineItems = sales.flatMap((s) =>
      s.items.map((item) => ({
        "Sale #": s.saleNumber,
        Product: item.product.name,
        SKU: item.product.sku,
        Qty: item.quantity,
        "Unit Price (₹)": Number(item.unitPrice),
        "Line Total (₹)": Number(item.lineTotal),
        Date: new Date(s.createdAt).toLocaleString("en-IN"),
      }))
    );
    const itemsWs = XLSX.utils.json_to_sheet(lineItems);
    itemsWs["!cols"] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 6 },
      { wch: 15 }, { wch: 15 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, itemsWs, "Line Items");

  } else {
    // ─── STOCK REPORT ───
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { saleItems: true, stockLogs: true } },
      },
      orderBy: { name: "asc" },
    });

    // Get aggregated sale quantities
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

    // Get restock quantities
    const restockAgg = await prisma.stockLog.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        type: "RESTOCK",
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
    });
    const restockMap = new Map(restockAgg.map((a) => [a.productId, a._sum.quantity || 0]));

    // Summary
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const healthy = products.filter((p) => p.stock > p.lowStockThreshold).length;

    const summaryData = [
      ["QuickBill — Stock Report"],
      ["Period", from ? `${from} to ${to || "today"}` : "All time"],
      ["Generated", new Date().toLocaleString("en-IN")],
      [],
      ["Metric", "Value"],
      ["Total Products", products.length],
      ["Out of Stock", outOfStock],
      ["Low Stock", lowStock],
      ["Healthy Stock", healthy],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs["!cols"] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Products detail
    const productRows = products.map((p) => ({
      Product: p.name,
      SKU: p.sku,
      Category: p.category || "—",
      "Current Stock": p.stock,
      Threshold: p.lowStockThreshold,
      Status: p.stock === 0 ? "OUT OF STOCK" : p.stock <= p.lowStockThreshold ? "LOW" : "OK",
      "Price (₹)": Number(p.price),
      "Units Sold": saleMap.get(p.id) || 0,
      "Units Restocked": restockMap.get(p.id) || 0,
      "Stock Value (₹)": p.stock * Number(p.price),
    }));
    const productsWs = XLSX.utils.json_to_sheet(productRows);
    productsWs["!cols"] = [
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 14 },
      { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, productsWs, "Products");

    // Stock movements
    const logs = await prisma.stockLog.findMany({
      where: {
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
      include: {
        product: { select: { name: true, sku: true } },
        creator: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const logRows = logs.map((l) => ({
      Product: l.product.name,
      SKU: l.product.sku,
      Type: l.type,
      Quantity: l.quantity,
      Note: l.note || "—",
      "Done By": l.creator.name,
      Date: new Date(l.createdAt).toLocaleString("en-IN"),
    }));
    const logsWs = XLSX.utils.json_to_sheet(logRows);
    logsWs["!cols"] = [
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
      { wch: 30 }, { wch: 18 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, logsWs, "Stock Movements");
  }

  // Generate buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `quickbill_${type}_report_${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
