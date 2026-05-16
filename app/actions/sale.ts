"use server";

import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";
import { SaleFormState } from "@/app/lib/definitions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";

interface SaleInput {
  productId: string;
  quantity: number;
}

export async function createSale(
  items: SaleInput[]
): Promise<SaleFormState> {
  const session = await getSession();
  if (!session?.userId) {
    return { message: "You must be logged in to create a sale." };
  }

  if (!items || items.length === 0) {
    return { message: "At least one item is required to create a sale." };
  }

  // Validate quantities
  for (const item of items) {
    if (item.quantity <= 0) {
      return { message: "All quantities must be greater than zero." };
    }
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Fetch all products and check stock
      const insufficientItems: { productName: string; available: number; requested: number }[] = [];

      const products = await Promise.all(
        items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, price: true, stock: true, isActive: true },
          });

          if (!product || !product.isActive) {
            throw new Error(`Product not found or inactive: ${item.productId}`);
          }

          if (product.stock < item.quantity) {
            insufficientItems.push({
              productName: product.name,
              available: product.stock,
              requested: item.quantity,
            });
          }

          return { ...product, requestedQty: item.quantity };
        })
      );

      // 2. If any items have insufficient stock, throw to rollback
      if (insufficientItems.length > 0) {
        const error = new Error("INSUFFICIENT_STOCK");
        (error as Error & { insufficientItems: typeof insufficientItems }).insufficientItems = insufficientItems;
        throw error;
      }

      // 3. Generate sale number
      const lastSale = await tx.sale.findFirst({
        orderBy: { createdAt: "desc" },
        select: { saleNumber: true },
      });

      let nextNum = 1;
      if (lastSale?.saleNumber) {
        const match = lastSale.saleNumber.match(/SALE-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      const saleNumber = `SALE-${String(nextNum).padStart(5, "0")}`;

      // 4. Calculate totals and prepare items
      let totalAmount = new Prisma.Decimal(0);
      const saleItemsData = products.map((product) => {
        const lineTotal = new Prisma.Decimal(product.price.toString()).mul(product.requestedQty);
        totalAmount = totalAmount.add(lineTotal);
        return {
          productId: product.id,
          quantity: product.requestedQty,
          unitPrice: product.price,
          lineTotal,
        };
      });

      // 5. Deduct stock + create logs for each item
      for (const product of products) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: product.requestedQty } },
        });

        await tx.stockLog.create({
          data: {
            productId: product.id,
            type: "SALE",
            quantity: -product.requestedQty,
            note: `Sale ${saleNumber}`,
            createdBy: session.userId,
          },
        });
      }

      // 6. Create the sale with items
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          totalAmount,
          itemCount: items.length,
          createdBy: session.userId,
          items: {
            create: saleItemsData,
          },
        },
      });

      return newSale;
    });

    // Success — revalidate and redirect
    revalidatePath("/sales");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    revalidatePath("/products");
    redirect(`/sales/${sale.id}`);
  } catch (error: unknown) {
    // Check if it's the redirect "error" from Next.js
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    // Check for insufficient stock
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      const typedError = error as Error & { insufficientItems: { productName: string; available: number; requested: number }[] };
      return {
        message: "Insufficient stock for one or more items.",
        insufficientItems: typedError.insufficientItems,
      };
    }

    // Re-throw redirect errors (they look like thrown errors in Next.js)
    if (typeof error === "object" && error !== null && "digest" in error) {
      throw error;
    }

    return { message: "Failed to create sale. Please try again." };
  }
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
      },
      creator: {
        select: { name: true },
      },
    },
  });
}

export async function cancelSale(
  saleId: string,
  cancelNote: string
): Promise<{ success?: boolean; message: string }> {
  const session = await getSession();
  if (!session?.userId) {
    return { message: "You must be logged in." };
  }

  // 1. Fetch the sale with items
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!sale) {
    return { message: "Sale not found." };
  }

  if (sale.status === "CANCELLED") {
    return { message: "This sale has already been cancelled." };
  }

  // 2. Atomically: reverse stock for each item + mark sale cancelled
  try {
    await prisma.$transaction(async (tx) => {
      // Restore stock for each item
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.stockLog.create({
          data: {
            productId: item.productId,
            type: "CANCELLATION",
            quantity: item.quantity, // positive — stock restored
            note: `Cancelled ${sale.saleNumber}: ${cancelNote || "No reason given"}`,
            createdBy: session.userId,
          },
        });
      }

      // Mark sale as cancelled
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelNote: cancelNote || null,
        },
      });
    });
  } catch {
    return { message: "Failed to cancel sale. Please try again." };
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return { success: true, message: "Sale cancelled. Stock has been restored." };
}
