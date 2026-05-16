"use client";

import { useActionState } from "react";
import { restockProduct } from "@/app/actions/stock";
import Link from "next/link";

interface RestockFormProps {
  productId: string;
  productName: string;
  currentStock: number;
}

export default function RestockForm({
  productId,
  productName,
  currentStock,
}: RestockFormProps) {
  const [state, formAction, pending] = useActionState(restockProduct, undefined);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/stock"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Stock
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Restock Product</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add inventory for{" "}
          <span className="font-semibold text-foreground">{productName}</span>
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-lg">
        {/* Current stock info */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-input-bg border border-input-border">
          <div className="w-10 h-10 rounded-xl bg-primary-glow border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Stock</p>
            <p className="text-2xl font-bold">{currentStock}</p>
          </div>
        </div>

        {/* Success message */}
        {state?.success && (
          <div className="bg-success-glow border border-success/30 rounded-xl px-4 py-3 mb-5 animate-fade-in">
            <p className="text-success text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {state.message}
            </p>
          </div>
        )}

        {/* Error message */}
        {state?.message && !state.success && (
          <div className="bg-danger-glow border border-danger/30 rounded-xl px-4 py-3 mb-5 animate-fade-in">
            <p className="text-danger text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {state.message}
            </p>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="productId" value={productId} />

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground mb-2">
              Quantity to Add <span className="text-danger">*</span>
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              placeholder="Enter quantity to add"
              required
              className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all duration-200"
            />
            {state?.errors?.quantity && (
              <p className="text-danger text-xs mt-1.5 animate-fade-in">{state.errors.quantity[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-muted-foreground mb-2">
              Note (optional)
            </label>
            <input
              id="note"
              name="note"
              type="text"
              placeholder="e.g. New shipment from supplier"
              className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-3 rounded-xl bg-success hover:bg-success/90 text-white font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-lg shadow-success/20"
            >
              {pending ? (
                <>
                  <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Restocking...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Confirm Restock
                </>
              )}
            </button>
            <Link
              href="/stock"
              className="px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border-hover transition-all duration-200 font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
