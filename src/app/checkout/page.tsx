import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatKRW } from "@/lib/format";
import { createOrderFromCart } from "@/actions/orders";
import { computeDiscount, validateCoupon } from "@/lib/coupon";
import Toast from "@/components/Toast";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; coupon?: string }>;
}) {
  const user = await requireUser();
  const { error, coupon: couponParam } = await searchParams;

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  });

  const items = cart?.items ?? [];
  if (items.length === 0) {
    redirect("/cart");
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // --- 쿠폰 미리보기 (GET 파라미터로 조회, 실제 적용은 결제 시점에 서버에서 다시 검증) ---
  let appliedCode = "";
  let discount = 0;
  let couponError = "";

  if (couponParam) {
    const code = couponParam.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
      couponError = "존재하지 않는 쿠폰 코드입니다.";
    } else {
      const validationError = validateCoupon(coupon, subtotal);
      if (validationError) {
        couponError = validationError;
      } else {
        appliedCode = coupon.code;
        discount = computeDiscount(coupon, subtotal);
      }
    }
  }

  const total = subtotal - discount;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">주문/결제</h1>

      <Toast type="error" message={error} />

      <div className="card mb-6 divide-y">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              {item.product.name} x {item.quantity}
            </span>
            <span className="font-medium">{formatKRW(item.product.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="card mb-6 p-4">
        <h2 className="mb-3 font-semibold">쿠폰 적용</h2>
        <form action="/checkout" className="flex gap-2">
          <input
            type="text"
            name="coupon"
            defaultValue={couponParam}
            placeholder="쿠폰 코드를 입력하세요"
            className="input"
          />
          <button type="submit" className="btn-secondary whitespace-nowrap">
            쿠폰 확인
          </button>
        </form>
        {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
        {appliedCode && !couponError && (
          <p className="mt-2 text-sm text-accent-600">
            &quot;{appliedCode}&quot; 쿠폰이 적용되었습니다. ({formatKRW(discount)} 할인)
          </p>
        )}

        <div className="mt-4 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>상품 금액</span>
            <span>{formatKRW(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>쿠폰 할인</span>
            <span>{discount > 0 ? `-${formatKRW(discount)}` : formatKRW(0)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold">
            <span>최종 결제금액</span>
            <span className="font-bold text-accent-600">{formatKRW(total)}</span>
          </div>
        </div>
      </div>

      <form action={createOrderFromCart} className="card space-y-4 p-6">
        <input type="hidden" name="couponCode" value={appliedCode} />
        <h2 className="font-semibold">배송 정보</h2>

        <div>
          <label className="label" htmlFor="receiverName">
            받으실 분
          </label>
          <input
            id="receiverName"
            name="receiverName"
            required
            defaultValue={user.name}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="receiverPhone">
            연락처
          </label>
          <input
            id="receiverPhone"
            name="receiverPhone"
            required
            placeholder="010-0000-0000"
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="receiverAddr">
            배송지 주소
          </label>
          <input id="receiverAddr" name="receiverAddr" required className="input" />
        </div>

        <div>
          <label className="label" htmlFor="memo">
            배송 메모 (선택)
          </label>
          <input id="memo" name="memo" placeholder="예: 부재 시 경비실에 맡겨주세요." className="input" />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link href="/cart" className="text-sm text-gray-500 hover:underline">
            장바구니로 돌아가기
          </Link>
          <button type="submit" className="btn-primary">
            {formatKRW(total)} 결제하기
          </button>
        </div>
      </form>
    </div>
  );
}
