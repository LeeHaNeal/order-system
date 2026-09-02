import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatKRW } from "@/lib/format";
import { deleteProduct } from "@/actions/admin";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">상품 관리</h2>
        <Link href="/admin/products/new" className="btn-primary">
          + 상품 등록
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">상품명</th>
              <th className="px-4 py-3">카테고리</th>
              <th className="px-4 py-3">가격</th>
              <th className="px-4 py-3">재고</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3 text-gray-500">{product.category}</td>
                <td className="px-4 py-3">{formatKRW(product.price)}</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      product.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {product.isActive ? "판매중" : "판매중지"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-brand-600 hover:underline"
                    >
                      수정
                    </Link>
                    <form action={deleteProduct}>
                      <input type="hidden" name="productId" value={product.id} />
                      <ConfirmSubmitButton
                        confirmMessage={`"${product.name}" 상품을 삭제할까요? 주문 이력이 있으면 삭제 대신 판매중지로 전환됩니다.`}
                        className="text-red-500 hover:underline"
                      >
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="p-8 text-center text-gray-400">등록된 상품이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
