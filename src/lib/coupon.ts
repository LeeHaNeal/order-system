import type { Coupon } from "@prisma/client";

/**
 * 쿠폰이 지금 이 주문(subtotal)에 사용 가능한지 검증합니다.
 * 문제가 없으면 null, 문제가 있으면 사용자에게 보여줄 에러 메시지를 반환합니다.
 */
export function validateCoupon(coupon: Coupon, subtotal: number): string | null {
  if (!coupon.isActive) return "사용할 수 없는 쿠폰입니다.";
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return "유효기간이 지난 쿠폰입니다.";
  }
  if (subtotal < coupon.minOrderAmount) {
    return `이 쿠폰은 ${coupon.minOrderAmount.toLocaleString("ko-KR")}원 이상 구매 시 사용할 수 있습니다.`;
  }
  return null;
}

/** 쿠폰 할인 금액을 계산합니다 (subtotal을 초과하지 않도록 clamp). */
export function computeDiscount(coupon: Coupon, subtotal: number): number {
  let discount =
    coupon.discountType === "PERCENT"
      ? Math.floor((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;

  if (coupon.maxDiscountAmount != null) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }

  return Math.max(0, Math.min(discount, subtotal));
}
