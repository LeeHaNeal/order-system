import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKRW, orderStatusColor, orderStatusLabel } from "@/lib/format";
import { updateOrderStatus } from "@/actions/admin";
import Toast from "@/components/Toast";
import type { OrderStatus } from "@prisma/client";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "FAILED",
  "PREPARING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
];

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: true,
      payment: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">주문 상세</h2>
        <span className={`badge ${orderStatusColor(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      <Toast type="error" message={error} />

      <div className="card mb-4 space-y-1 p-4 text-sm">
        <p>
          주문번호 <span className="font-mono">{order.orderNumber}</span>
        </p>
        <p>주문자: {order.user.name} ({order.user.email})</p>
        <p>주문일시: {formatDateTime(order.createdAt)}</p>
      </div>

      <div className="card mb-4 divide-y">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              {item.productName} x {item.quantity}
            </span>
            <span className="font-medium">{formatKRW(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
        {order.discountAmount > 0 && (
          <>
            <div className="flex justify-between px-4 py-3 text-sm text-gray-500">
              <span>상품 금액</span>
              <span>{formatKRW(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm text-gray-500">
              <span>쿠폰 할인</span>
              <span>-{formatKRW(order.discountAmount)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between px-4 py-3 font-semibold">
          <span>총 결제금액</span>
          <span className="font-bold text-accent-600">{formatKRW(order.totalAmount)}</span>
        </div>
      </div>

      <div className="card mb-4 space-y-1 p-4 text-sm">
        <h3 className="mb-2 font-semibold">배송 정보</h3>
        <p>받으실 분: {order.receiverName}</p>
        <p>연락처: {order.receiverPhone}</p>
        <p>주소: {order.receiverAddr}</p>
        {order.memo && <p>메모: {order.memo}</p>}
      </div>

      {order.payment && (
        <div className="card mb-4 space-y-1 p-4 text-sm">
          <h3 className="mb-2 font-semibold">결제 정보</h3>
          <p>Provider: {order.payment.provider}</p>
          <p className="break-all">paymentKey: {order.payment.paymentKey}</p>
          <p>결제 수단: {order.payment.method}</p>
          <p>결제 상태: {order.payment.status}</p>
          {order.payment.approvedAt && <p>승인 시각: {formatDateTime(order.payment.approvedAt)}</p>}
          {order.payment.failReason && (
            <p className="text-red-600">실패 사유: {order.payment.failReason}</p>
          )}
        </div>
      )}

      <div className="card mb-4 p-4 text-sm">
        <h3 className="mb-2 font-semibold">상태 변경 이력</h3>
        <ul className="space-y-1">
          {order.statusHistory.map((h) => (
            <li key={h.id} className="flex justify-between text-gray-600">
              <span>
                {orderStatusLabel(h.status)}
                {h.note ? ` · ${h.note}` : ""}
              </span>
              <span className="text-xs text-gray-400">{formatDateTime(h.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>

      <form action={updateOrderStatus} className="card space-y-3 p-4">
        <h3 className="font-semibold">상태 변경</h3>
        <input type="hidden" name="orderId" value={order.id} />
        <div className="flex gap-2">
          <select name="status" defaultValue={order.status} className="input w-auto">
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
          <input name="note" placeholder="메모 (선택)" className="input flex-1" />
          <button type="submit" className="btn-primary">
            변경
          </button>
        </div>
        <p className="text-xs text-gray-400">
          결제완료/준비중 상태에서 취소로 변경하면 재고가 자동으로 복구됩니다.
        </p>
      </form>
    </div>
  );
}
