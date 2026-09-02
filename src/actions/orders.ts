"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { checkoutSchema } from "@/lib/validators";
import { generateOrderNumber } from "@/lib/order-number";
import { paymentProvider } from "@/lib/payment";
import { computeDiscount, validateCoupon } from "@/lib/coupon";
import type { OrderStatus } from "@prisma/client";

function buildOrderName(items: { productName: string }[]): string {
  if (items.length === 0) return "주문";
  if (items.length === 1) return items[0].productName;
  return `${items[0].productName} 외 ${items.length - 1}건`;
}

/**
 * 장바구니 내용을 바탕으로 주문을 생성하고, 결제 Provider 에 결제를 요청한 뒤
 * mock(또는 실제) 결제창으로 리다이렉트합니다.
 *
 * 참고(단순화): 데모 목적상 재고는 "주문 생성" 시점이 아니라 "결제 승인" 시점에
 * 차감합니다. 트래픽이 많은 실서비스라면 주문 생성 시 재고를 임시로 잡아두는
 * (hold) 로직이 추가로 필요합니다.
 */
export async function createOrderFromCart(formData: FormData): Promise<void> {
  const user = await requireUser();

  const parsed = checkoutSchema.safeParse({
    receiverName: formData.get("receiverName"),
    receiverPhone: formData.get("receiverPhone"),
    receiverAddr: formData.get("receiverAddr"),
    memo: formData.get("memo"),
    couponCode: formData.get("couponCode"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    redirect(`/checkout?error=${encodeURIComponent(message)}`);
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    redirect(`/cart?error=${encodeURIComponent("장바구니가 비어있습니다.")}`);
  }

  for (const item of cart.items) {
    if (!item.product.isActive) {
      redirect(
        `/checkout?error=${encodeURIComponent(`"${item.product.name}"은(는) 판매가 중지된 상품입니다.`)}`
      );
    }
    if (item.product.stock < item.quantity) {
      redirect(
        `/checkout?error=${encodeURIComponent(`"${item.product.name}"의 재고가 부족합니다. (재고 ${item.product.stock}개)`)}`
      );
    }
  }

  const subtotalAmount = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // --- 쿠폰 적용 (선택) ---
  let couponId: string | null = null;
  let discountAmount = 0;
  const couponCode = parsed.data.couponCode;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) {
      redirect(`/checkout?error=${encodeURIComponent("존재하지 않는 쿠폰 코드입니다.")}`);
    }
    const couponError = validateCoupon(coupon, subtotalAmount);
    if (couponError) {
      redirect(`/checkout?error=${encodeURIComponent(couponError)}`);
    }
    couponId = coupon.id;
    discountAmount = computeDiscount(coupon, subtotalAmount);
  }

  const totalAmount = subtotalAmount - discountAmount;

  const orderItemsInput = cart.items.map((item) => ({
    productId: item.productId,
    productName: item.product.name,
    unitPrice: item.product.price,
    quantity: item.quantity,
  }));

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: user.id,
      subtotalAmount,
      discountAmount,
      totalAmount,
      couponId,
      receiverName: parsed.data.receiverName,
      receiverPhone: parsed.data.receiverPhone,
      receiverAddr: parsed.data.receiverAddr,
      memo: parsed.data.memo ?? "",
      items: { create: orderItemsInput },
      statusHistory: { create: { status: "PENDING_PAYMENT", note: "주문 생성" } },
    },
  });

  const paymentRequest = await paymentProvider.requestPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: totalAmount,
    orderName: buildOrderName(orderItemsInput),
    customerName: user.name,
    customerEmail: user.email,
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: paymentProvider.name,
      paymentKey: paymentRequest.paymentKey,
      amount: totalAmount,
      status: "READY",
    },
  });

  redirect(paymentRequest.checkoutUrl);
}

/** 사용자가 자신의 주문을 취소합니다. 배송이 시작된 이후에는 취소할 수 없습니다. */
export async function cancelOrder(formData: FormData): Promise<void> {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.userId !== user.id) {
    redirect(`/orders?error=${encodeURIComponent("주문을 찾을 수 없습니다.")}`);
  }

  const cancellableStatuses: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PREPARING"];
  if (!cancellableStatuses.includes(order.status)) {
    redirect(`/orders/${orderId}?error=${encodeURIComponent("이미 배송이 진행되어 취소할 수 없습니다.")}`);
  }

  await prisma.$transaction(async (tx) => {
    // 결제가 완료된 상태에서 취소하는 경우에만 재고를 복구합니다.
    if (order.status === "PAID" || order.status === "PREPARING") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CANCELLED", note: "고객 요청으로 주문 취소" },
    });
  });

  redirect(`/orders/${orderId}?cancelled=1`);
}
