import ProductForm from "@/app/components/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in the details below to add a new product to your catalog.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-3xl">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}
