import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { paymentProvider } from "@/lib/payment";

/**
 * PG(mock)가 결제 성공 후 리다이렉트시키는 콜백 URL.
 * 실제 토스페이먼츠 연동 시에도 동일한 구조(쿼리로 orderId/paymentKey/amount 수신 후
 * 서버에서 confirm API 호출)를 그대로 사용할 수 있습니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");
  const amountRaw = searchParams.get("amount");
  const amount = amountRaw ? Number(amountRaw) : NaN;

  if (!orderId || !paymentKey || Number.isNaN(amount)) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("잘못된 결제 응답입니다.")}`, request.url)
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, items: true },
  });

  if (!order || !order.payment) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("결제 정보를 확인할 수 없습니다.")}`, request.url)
    );
  }

  // 위변조 방지: 클라이언트를 거쳐온 결제금액과 서버에 저장된 주문금액이 반드시 일치해야 합니다.
  if (order.totalAmount !== amount) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: order.id },
        data: { status: "FAILED", failReason: "결제 금액이 일치하지 않습니다." },
      }),
      prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } }),
      prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: "FAILED", note: "결제 금액 불일치(위변조 의심)" },
      }),
    ]);
    return NextResponse.redirect(new URL(`/orders/${order.id}?failed=1`, request.url));
  }

  // 새로고침 등으로 콜백이 중복 호출된 경우, 다시 승인 처리를 하지 않고 그대로 이동시킵니다.
  if (order.payment.status === "APPROVED") {
    return NextResponse.redirect(new URL(`/orders/${order.id}?paid=1`, request.url));
  }

  // mock provider는 결제 요청 시점에 paymentKey를 미리 알 수 있어 항상 일치하지만,
  // 토스 등 실제 PG는 결제창에서 승인이 끝난 "지금" 이 시점에야 진짜 paymentKey를
  // 알려줍니다. 아직 승인 전(READY) 상태라면 그 값으로 갱신해 반영합니다.
  if (order.payment.paymentKey !== paymentKey) {
    await prisma.payment.update({ where: { orderId: order.id }, data: { paymentKey } });
  }

  const confirmResult = await paymentProvider.confirmPayment({
    paymentKey,
    orderId: order.id,
    amount,
  });

  if (!confirmResult.success) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: order.id },
        data: {
          status: "FAILED",
          failReason: confirmResult.failReason ?? "결제 승인에 실패했습니다.",
          rawResponse: confirmResult.raw as Prisma.InputJsonValue,
        },
      }),
      prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "FAILED",
          note: confirmResult.failReason ?? "결제 승인 실패",
        },
      }),
    ]);
    return NextResponse.redirect(new URL(`/orders/${order.id}?failed=1`, request.url));
  }

  // 결제 승인은 완료됐지만, 그 사이 다른 주문이 먼저 재고를 소진했을 수 있습니다.
  // updateMany + stock >= quantity 조건으로 "재고가 충분할 때만" 원자적으로 차감하고,
  // 실제로 변경된 행이 없으면(count === 0) 재고 부족으로 간주해 트랜잭션 전체를 롤백합니다.
  class OutOfStockError extends Error {
    constructor(public productName: string) {
      super(`"${productName}" 재고가 부족합니다.`);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new OutOfStockError(item.productName);
        }
      }

      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          status: "APPROVED",
          method: confirmResult.method ?? "CARD",
          approvedAt: confirmResult.approvedAt ?? new Date(),
          rawResponse: confirmResult.raw as Prisma.InputJsonValue,
        },
      });
      await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "PAID", note: "결제 승인 완료" },
      });

      for (const item of order.items) {
        await tx.cartItem.deleteMany({
          where: { productId: item.productId, cart: { userId: order.userId } },
        });
      }
    });
  } catch (e) {
    if (e instanceof OutOfStockError) {
      // 결제는 승인됐지만 재고가 없어 주문을 확정할 수 없는 경우:
      // 결제/주문을 FAILED로 남기고 (실제 서비스라면 여기서 결제 취소(환불) API를 호출해야 합니다),
      // 관리자/고객이 원인을 알 수 있도록 사유를 기록합니다.
      await prisma.$transaction([
        prisma.payment.update({
          where: { orderId: order.id },
          data: { status: "FAILED", failReason: e.message },
        }),
        prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } }),
        prisma.orderStatusHistory.create({
          data: { orderId: order.id, status: "FAILED", note: `재고 부족으로 주문 취소: ${e.message}` },
        }),
      ]);
      return NextResponse.redirect(new URL(`/orders/${order.id}?failed=1`, request.url));
    }
    throw e;
  }

  return NextResponse.redirect(new URL(`/orders/${order.id}?paid=1`, request.url));
}
