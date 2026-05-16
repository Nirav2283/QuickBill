"use server";

import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";
import { ProductFormSchema, ProductFormState } from "@/app/lib/definitions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";

export async function createProduct(
  state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  // 1. Check authentication
  const session = await getSession();
  if (!session?.userId) {
    return { message: "You must be logged in to create products." };
  }

  // 2. Validate form fields
  const validatedFields = ProductFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    sku: formData.get("sku"),
    category: formData.get("category"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, description, price, stock, sku, category } =
    validatedFields.data;

  // 3. Check for duplicate product name
  const existingName = await prisma.product.findUnique({
    where: { name },
  });

  if (existingName) {
    return {
      errors: {
        name: ["A product with this name already exists."],
      },
    };
  }

  // 4. Check for duplicate SKU
  const existingSku = await prisma.product.findUnique({
    where: { sku },
  });

  if (existingSku) {
    return {
      errors: {
        sku: ["A product with this SKU already exists."],
      },
    };
  }

  // 5. Create product
  try {
    await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: new Prisma.Decimal(price),
        stock: parseInt(stock),
        sku,
        category: category || null,
        createdBy: session.userId,
      },
    });
  } catch {
    return {
      message: "Failed to create product. Please try again.",
    };
  }

  // 6. Revalidate and redirect
  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(
  state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  // 1. Check authentication
  const session = await getSession();
  if (!session?.userId) {
    return { message: "You must be logged in to update products." };
  }

  const productId = formData.get("productId") as string;
  if (!productId) {
    return { message: "Product ID is required." };
  }

  // 2. Validate form fields
  const validatedFields = ProductFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    sku: formData.get("sku"),
    category: formData.get("category"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, description, price, stock, sku, category } =
    validatedFields.data;

  // 3. Check for duplicate product name (exclude current product)
  const existingName = await prisma.product.findFirst({
    where: {
      name,
      id: { not: productId },
    },
  });

  if (existingName) {
    return {
      errors: {
        name: ["A product with this name already exists."],
      },
    };
  }

  // 4. Check for duplicate SKU (exclude current product)
  const existingSku = await prisma.product.findFirst({
    where: {
      sku,
      id: { not: productId },
    },
  });

  if (existingSku) {
    return {
      errors: {
        sku: ["A product with this SKU already exists."],
      },
    };
  }

  // 5. Update product
  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: description || null,
        price: new Prisma.Decimal(price),
        stock: parseInt(stock),
        sku,
        category: category || null,
      },
    });
  } catch {
    return {
      message: "Failed to update product. Please try again.",
    };
  }

  // 6. Revalidate and redirect
  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(productId: string) {
  // 1. Check authentication
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  // 2. Soft-delete: set isActive to false
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  } catch {
    throw new Error("Failed to delete product.");
  }

  // 3. Revalidate
  revalidatePath("/products");
}
