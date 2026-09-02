import { createProduct } from "@/actions/admin";
import ProductForm from "@/components/ProductForm";
import Toast from "@/components/Toast";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-lg font-semibold">상품 등록</h2>
      <Toast type="error" message={error} />
      <ProductForm action={createProduct} submitLabel="등록하기" />
    </div>
  );
}
