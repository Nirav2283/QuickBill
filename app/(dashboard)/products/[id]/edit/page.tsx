import { prisma } from "@/app/lib/db";
import { notFound } from "next/navigation";
import ProductForm from "@/app/components/ProductForm";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update the details for{" "}
          <span className="font-semibold text-foreground">{product.name}</span>
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-3xl">
        <ProductForm
          mode="edit"
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            stock: product.stock,
            sku: product.sku,
            category: product.category,
          }}
        />
      </div>
    </div>
  );
}
