import * as z from "zod";

// ─── Auth Schemas ──────────────────────────────────────────────────

export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(1, { message: "Password is required." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

// ─── Product Schemas ───────────────────────────────────────────────

export const ProductFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Product name must be at least 2 characters." })
    .max(100, { message: "Product name must be under 100 characters." })
    .trim(),
  description: z
    .string()
    .max(500, { message: "Description must be under 500 characters." })
    .optional()
    .or(z.literal("")),
  price: z
    .string()
    .min(1, { message: "Price is required." })
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Price must be a valid number.",
    })
    .refine((val) => parseFloat(val) > 0, {
      message: "Price must be greater than ₹0.",
    })
    .refine((val) => parseFloat(val) <= 999999.99, {
      message: "Price cannot exceed ₹9,99,999.99.",
    })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.trim()), {
      message: "Price can have at most 2 decimal places.",
    }),
  stock: z
    .string()
    .min(1, { message: "Stock quantity is required." })
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Stock must be a valid whole number.",
    })
    .refine((val) => parseInt(val) >= 0, {
      message: "Stock cannot be negative.",
    })
    .refine((val) => Number.isInteger(parseFloat(val)), {
      message: "Stock must be a whole number (no decimals).",
    }),
  sku: z
    .string()
    .min(1, { message: "SKU is required." })
    .max(50, { message: "SKU must be under 50 characters." })
    .trim(),
  category: z
    .string()
    .max(50, { message: "Category must be under 50 characters." })
    .optional()
    .or(z.literal("")),
});

export type ProductFormState =
  | {
      errors?: {
        name?: string[];
        description?: string[];
        price?: string[];
        stock?: string[];
        sku?: string[];
        category?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

// ─── Restock Schemas ───────────────────────────────────────────────

export const RestockFormSchema = z.object({
  productId: z.string().min(1, { message: "Product is required." }),
  quantity: z
    .string()
    .min(1, { message: "Quantity is required." })
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Quantity must be a valid number.",
    })
    .refine((val) => parseInt(val) > 0, {
      message: "Quantity must be greater than 0.",
    })
    .refine((val) => parseInt(val) <= 99999, {
      message: "Quantity cannot exceed 99,999 per restock.",
    }),
  note: z
    .string()
    .max(200, { message: "Note must be under 200 characters." })
    .optional()
    .or(z.literal("")),
});

export type RestockFormState =
  | {
      errors?: {
        productId?: string[];
        quantity?: string[];
        note?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

// ─── Sale Types ────────────────────────────────────────────────────

export interface SaleLineItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
}

export type SaleFormState =
  | {
      message?: string;
      success?: boolean;
      insufficientItems?: { productName: string; available: number; requested: number }[];
    }
  | undefined;
