import { prisma } from "@/app/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/app/components/PrintButton";

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
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

  if (!sale || sale.status === "CANCELLED") notFound();

  const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Action bar — hidden on print */}
      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          href={`/sales/${sale.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Sale
        </Link>
        <PrintButton />
      </div>

      {/* Invoice document */}
      <div className="invoice-page bg-white text-gray-900 rounded-2xl print:rounded-none shadow-xl print:shadow-none max-w-3xl mx-auto">

        {/* Header */}
        <div className="px-10 pt-10 pb-6 border-b-2 border-gray-900">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">QuickBill</h1>
              <p className="text-sm text-gray-500 mt-1">Smart Billing System</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gray-400">Invoice</h2>
              <p className="text-lg font-mono font-bold text-gray-900 mt-1">{sale.saleNumber}</p>
            </div>
          </div>
        </div>

        {/* Invoice meta */}
        <div className="px-10 py-6 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invoice Date</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(sale.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed By</p>
            <p className="text-sm font-medium text-gray-900">{sale.creator.name}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="px-10">
          <table className="w-full">
            <thead>
              <tr className="border-t-2 border-b border-gray-900">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 w-10">#</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Item</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 w-16">Qty</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 w-28">Rate</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 text-sm text-gray-400">{idx + 1}</td>
                  <td className="py-3">
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.product.sku}</p>
                  </td>
                  <td className="py-3 text-center text-sm text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-sm text-gray-700">
                    ₹{Number(item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-gray-900">
                    ₹{Number(item.lineTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-10 py-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">Total Items</span>
                <span className="text-gray-700">{sale.items.length} ({totalQty} units)</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-1">
                <span className="text-lg font-bold text-gray-900">Grand Total</span>
                <span className="text-lg font-bold text-gray-900">
                  ₹{Number(sale.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-gray-200 bg-gray-50 print:bg-transparent rounded-b-2xl print:rounded-none">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-400">Thank you for your purchase!</p>
              <p className="text-xs text-gray-400 mt-0.5">This is a computer-generated invoice.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">QuickBill © {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
