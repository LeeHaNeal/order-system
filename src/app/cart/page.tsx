import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatKRW } from "@/lib/format";
import { removeCartItem, updateCartItem } from "@/actions/cart";
import Toast from "@/components/Toast";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
  });

  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const hasOutOfStock = items.some((item) => item.quantity > item.product.stock || !item.product.isActive);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">장바구니</h1>

      <Toast type="error" message={error} />

      {items.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          장바구니가 비어있습니다.
          <div className="mt-4">
            <Link href="/" className="btn-primary">
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => {
              const invalid = !item.product.isActive || item.quantity > item.product.stock;
              return (
                <div key={item.id} className="card flex items-center gap-4 p-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-gray-100">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full rounded-md object-cover"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link href={`/products/${item.productId}`} className="font-medium hover:underline">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500">{formatKRW(item.product.price)}</p>
                    {invalid && (
                      <p className="mt-1 text-xs text-red-600">
                        {!item.product.isActive
                          ? "판매 중지된 상품입니다."
                          : `재고가 부족합니다. (재고 ${item.product.stock}개)`}
                      </p>
                    )}
                  </div>

                  <form action={updateCartItem} className="flex items-center gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input
                      type="number"
                      name="quantity"
                      min={0}
                      max={Math.max(item.product.stock, 0)}
                      defaultValue={item.quantity}
                      className="input w-16"
                    />
                    <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                      변경
                    </button>
                  </form>

                  <form action={removeCartItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="text-xs text-gray-400 hover:text-red-600">
                      삭제
                    </button>
                  </form>

                  <p className="w-24 text-right font-semibold">
                    {formatKRW(item.product.price * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="card h-fit p-6">
            <h2 className="mb-4 font-semibold">주문 요약</h2>
            <div className="flex justify-between text-sm text-gray-600">
              <span>상품 수량</span>
              <span>{items.reduce((n, i) => n + i.quantity, 0)}개</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-3 text-base font-semibold">
              <span>총 결제금액</span>
              <span className="font-bold text-accent-600">{formatKRW(total)}</span>
            </div>

            {hasOutOfStock && (
              <p className="mt-3 text-xs text-red-600">
                재고 부족 또는 판매중지 상품이 있어 주문할 수 없습니다. 수량을 조정하거나 삭제해주세요.
              </p>
            )}

            <Link
              href="/checkout"
              aria-disabled={hasOutOfStock}
              className={`btn-primary mt-4 w-full ${hasOutOfStock ? "pointer-events-none opacity-50" : ""}`}
            >
              주문하기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
