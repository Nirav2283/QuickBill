"use server";

import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";
import { RestockFormSchema, RestockFormState } from "@/app/lib/definitions";
import { revalidatePath } from "next/cache";

export async function restockProduct(
  state: RestockFormState,
  formData: FormData
): Promise<RestockFormState> {
  const session = await getSession();
  if (!session?.userId) {
    return { message: "You must be logged in." };
  }

  const validatedFields = RestockFormSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    note: formData.get("note"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { productId, quantity, note } = validatedFields.data;
  const qty = parseInt(quantity);

  try {
    await prisma.$transaction(async (tx) => {
      // Update stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: qty } },
      });

      // Create stock log
      await tx.stockLog.create({
        data: {
          productId,
          type: "RESTOCK",
          quantity: qty,
          note: note || null,
          createdBy: session.userId,
        },
      });
    });
  } catch {
    return { message: "Failed to restock product. Please try again." };
  }

  revalidatePath("/stock");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return { success: true, message: "Product restocked successfully!" };
}

export async function adjustStock(
  productId: string,
  newQuantity: number,
  note: string
) {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });

  if (!product) throw new Error("Product not found");

  const diff = newQuantity - product.stock;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { stock: newQuantity },
    });

    await tx.stockLog.create({
      data: {
        productId,
        type: "ADJUSTMENT",
        quantity: diff,
        note: note || `Adjusted from ${product.stock} to ${newQuantity}`,
        createdBy: session.userId,
      },
    });
  });

  revalidatePath("/stock");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}
