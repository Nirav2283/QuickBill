import { prisma } from "@/app/lib/db";
import { notFound } from "next/navigation";
import RestockForm from "@/app/components/RestockForm";

interface RestockPageProps {
  params: Promise<{ id: string }>;
}

export default async function RestockPage({ params }: RestockPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, stock: true },
  });

  if (!product) notFound();

  return (
    <RestockForm
      productId={product.id}
      productName={product.name}
      currentStock={product.stock}
    />
  );
}
