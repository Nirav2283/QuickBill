"use client";

import { useState, useTransition } from "react";
import { cancelSale } from "@/app/actions/sale";

interface CancelSaleButtonProps {
  saleId: string;
  saleNumber: string;
}

export default function CancelSaleButton({ saleId, saleNumber }: CancelSaleButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; message: string } | null>(null);

  const handleCancel = () => {
    startTransition(async () => {
      const res = await cancelSale(saleId, cancelNote);
      setResult(res);
      if (res.success) {
        setShowConfirm(false);
      }
    });
  };

  return (
    <>
      {result?.success && (
        <div className="bg-success-glow border border-success/30 rounded-xl px-4 py-3 mb-4 animate-fade-in">
          <p className="text-success text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {result.message}
          </p>
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 rounded-xl border border-danger/30 text-danger hover:bg-danger-glow font-medium transition-all duration-200 text-sm cursor-pointer flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Cancel Order
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-danger-glow border border-danger/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Cancel Order</h3>
                <p className="text-sm text-muted">This will restore all stock from {saleNumber}</p>
              </div>
            </div>

            {result?.message && !result.success && (
              <div className="bg-danger-glow border border-danger/30 rounded-xl px-4 py-3 mb-4 animate-fade-in">
                <p className="text-danger text-sm">{result.message}</p>
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="cancelNote" className="block text-sm font-medium text-muted-foreground mb-2">
                Reason for cancellation
              </label>
              <input
                id="cancelNote"
                type="text"
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="e.g. Customer changed their mind"
                className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-danger/50 focus:border-danger transition-all duration-200"
              />
            </div>

            <p className="text-sm text-muted-foreground mb-5">
              <span className="text-danger font-semibold">Warning:</span> All items in this sale will have their stock restored. This action cannot be undone.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all duration-200 text-sm font-medium cursor-pointer"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-danger hover:bg-danger-hover text-white font-semibold transition-all duration-200 disabled:opacity-50 text-sm cursor-pointer flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
