"use client";

import { useActionState } from "react";
import { createProduct, updateProduct } from "@/app/actions/product";
import Link from "next/link";

interface ProductData {
  id?: string;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  sku: string;
  category: string | null;
}

interface ProductFormProps {
  product?: ProductData;
  mode: "create" | "edit";
}

export default function ProductForm({ product, mode }: ProductFormProps) {
  const action = mode === "create" ? createProduct : updateProduct;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden product ID for edit mode */}
      {mode === "edit" && product?.id && (
        <input type="hidden" name="productId" value={product.id} />
      )}

      {/* Global error */}
      {state?.message && !state?.success && (
        <div className="bg-danger-glow border border-danger/30 rounded-xl px-4 py-3 animate-fade-in">
          <p className="text-danger text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {state.message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
            Product Name <span className="text-danger">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={product?.name ?? ""}
            placeholder="e.g. Wireless Bluetooth Headphones"
            required
            className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/50 focus:border-input-focus transition-all duration-200"
          />
          {state?.errors?.name && (
            <p className="text-danger text-xs mt-1.5 animate-fade-in">{state.errors.name[0]}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-muted-foreground mb-2">
            Price (₹) <span className="text-danger">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            defaultValue={product?.price ?? ""}
            placeholder="0.00"
            required
            className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/50 focus:border-input-focus transition-all duration-200"
          />
          {state?.errors?.price && (
            <p className="text-danger text-xs mt-1.5 animate-fade-in">{state.errors.price[0]}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-muted-foreground mb-2">
            Stock Quantity <span className="text-danger">*</span>
          </label>
          <input
            id="stock"
            name="stock"
            type="text"
            inputMode="numeric"
            defaultValue={product?.stock ?? ""}
            placeholder="0"
            required
            className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/50 focus:border-input-focus transition-all duration-200"
          />
          {state?.errors?.stock && (
            <p className="text-danger text-xs mt-1.5 animate-fade-in">{state.errors.stock[0]}</p>
          )}
        </div>

        {/* SKU */}
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-muted-foreground mb-2">
            SKU <span className="text-danger">*</span>
          </label>
          <input
            id="sku"
            name="sku"
            type="text"
            defaultValue={product?.sku ?? ""}
            placeholder="e.g. WBH-001"
            required
            className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/50 focus:border-input-focus transition-all duration-200"
          />
          {state?.errors?.sku && (
            <p className="text-danger text-xs mt-1.5 animate-fade-in">{state.errors.sku[0]}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-2">
            Category
          </label>
          <input
            id="category"
            name="category"
            type="text"
            defaultValue={product?.category ?? ""}
            placeholder="e.g. Electronics"
            className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/50 focus:border-input-focus transition-all duration-200"
          />
          {state?.errors?.category && (
            <p className="text-danger text-xs mt-1.5 animate-fade-in">{state.errors.category[0]}</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            placeholder="Brief product description..."
            className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-input-focus/50 focus:border-input-focus transition-all duration-200 resize-none"
          />
          {state?.errors?.description && (
            <p className="text-danger text-xs mt-1.5 animate-fade-in">{state.errors.description[0]}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          {pending ? (
            <>
              <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {mode === "create" ? "Creating..." : "Updating..."}
            </>
          ) : (
            <>
              {mode === "create" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
              {mode === "create" ? "Create Product" : "Save Changes"}
            </>
          )}
        </button>
        <Link
          href="/products"
          className="px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border-hover transition-all duration-200 font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
