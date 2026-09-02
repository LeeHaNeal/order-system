import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateProduct } from "@/actions/admin";
import ProductForm from "@/components/ProductForm";
import Toast from "@/components/Toast";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-lg font-semibold">상품 수정</h2>
      <Toast type="error" message={error} />
      <ProductForm action={updateProduct} product={product} submitLabel="저장하기" />
    </div>
  );
}
