import { prisma } from "@/app/lib/db";
import SaleForm from "@/app/components/SaleForm";

export default async function NewSalePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    select: { id: true, name: true, sku: true, price: true, stock: true },
    orderBy: { name: "asc" },
  });

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    stock: p.stock,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Sale</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add products and confirm the sale. Stock will be deducted automatically.
        </p>
      </div>
      <SaleForm products={productOptions} />
    </div>
  );
}
