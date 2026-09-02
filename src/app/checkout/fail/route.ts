import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * PG(mock)가 결제 실패/취소 시 리다이렉트시키는 콜백 URL.
 * 실제 PG 연동 시에는 실패의 경우 별도로 confirm API를 호출할 필요가 없습니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const message = searchParams.get("message") || "사용자가 결제를 취소했거나 승인이 거절되었습니다.";

  if (!orderId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (order.status === "PENDING_PAYMENT") {
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    if (order.payment) {
      ops.push(
        prisma.payment.update({
          where: { orderId: order.id },
          data: { status: "FAILED", failReason: message },
        })
      );
    }

    ops.push(
      prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } }),
      prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: "FAILED", note: message },
      })
    );

    await prisma.$transaction(ops);
  }

  return NextResponse.redirect(new URL(`/orders/${order.id}?failed=1`, request.url));
}
