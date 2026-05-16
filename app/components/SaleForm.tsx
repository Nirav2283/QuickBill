"use client";

import { useState, useTransition } from "react";
import { createSale } from "@/app/actions/sale";
import type { SaleFormState } from "@/app/lib/definitions";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface LineItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
}

interface SaleFormProps {
  products: ProductOption[];
}

export default function SaleForm({ products }: SaleFormProps) {
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [state, setState] = useState<SaleFormState>(undefined);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !items.some((item) => item.productId === p.id)
  );

  const addItem = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    setItems([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitPrice: product.price,
        maxStock: product.stock,
      },
    ]);
    setSelectedProduct("");
    setQuantity("");
    setSearchTerm("");
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateQuantity = (idx: number, newQty: number) => {
    setItems(
      items.map((item, i) => (i === idx ? { ...item, quantity: newQty } : item))
    );
  };

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const handleSubmit = () => {
    if (items.length === 0) {
      setState({ message: "Add at least one item to create a sale." });
      return;
    }

    startTransition(async () => {
      const result = await createSale(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      );
      if (result) {
        setState(result);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Error messages */}
      {state?.message && !state?.success && (
        <div className="bg-danger-glow border border-danger/30 rounded-xl px-4 py-3 animate-fade-in">
          <p className="text-danger text-sm font-medium mb-1">{state.message}</p>
          {state.insufficientItems && state.insufficientItems.length > 0 && (
            <ul className="text-danger/80 text-xs mt-2 space-y-1">
              {state.insufficientItems.map((item, i) => (
                <li key={i}>
                  • {item.productName}: requested {item.requested}, only{" "}
                  {item.available} available
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Add item section */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
          Add Items
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Product select */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Product
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedProduct("");
                }}
                className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
              {searchTerm && !selectedProduct && filteredProducts.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(p.id);
                        setSearchTerm(p.name);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-card-hover transition-colors text-sm flex justify-between items-center cursor-pointer"
                    >
                      <span>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted ml-2 font-mono text-xs">{p.sku}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ₹{p.price.toLocaleString("en-IN")} · {p.stock} in stock
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qty"
              className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
            />
          </div>

          {/* Add button */}
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={addItem}
              disabled={!selectedProduct || !quantity || parseInt(quantity) <= 0}
              className="w-full px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Line items */}
      {items.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Product</th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Qty</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Unit Price</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Line Total</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-border last:border-b-0 hover:bg-card-hover transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted font-mono">{item.sku}</p>
                    {item.quantity > item.maxStock && (
                      <p className="text-xs text-danger mt-0.5">
                        ⚠ Only {item.maxStock} in stock
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(idx, parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2 py-1.5 rounded-lg bg-input-bg border border-input-border text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </td>
                  <td className="px-5 py-3 text-right text-sm">
                    ₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-semibold">
                    ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-glow transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total + confirm */}
          <div className="px-5 py-4 border-t border-border bg-card-hover/30 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Grand Total</p>
                <p className="text-xl font-bold text-primary">
                  ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || items.length === 0}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirm Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <p className="text-sm">Search for a product above to start building your sale</p>
        </div>
      )}
    </div>
  );
}
