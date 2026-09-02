import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatKRW, orderStatusColor, orderStatusLabel } from "@/lib/format";
import { cancelOrder } from "@/actions/orders";
import Toast from "@/components/Toast";

const CANCELLABLE = ["PENDING_PAYMENT", "PAID", "PREPARING"];

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; failed?: string; cancelled?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { paid, failed, cancelled, error } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payment: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order || order.userId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/orders" className="text-sm text-gray-500 hover:underline">
        ← 주문내역으로
      </Link>

      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">주문 상세</h1>
        <span className={`badge ${orderStatusColor(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      <Toast type="success" message={paid === "1" ? "결제가 완료되었습니다." : undefined} />
      <Toast
        type="error"
        message={
          failed === "1"
            ? `결제에 실패했습니다.${order.payment?.failReason ? ` (${order.payment.failReason})` : ""}`
            : undefined
        }
      />
      <Toast type="info" message={cancelled === "1" ? "주문이 취소되었습니다." : undefined} />
      <Toast type="error" message={error} />

      <div className="card mb-4 divide-y">
        <div className="px-4 py-3 text-sm text-gray-500">
          주문번호 <span className="font-mono text-gray-800">{order.orderNumber}</span> ·{" "}
          {formatDateTime(order.createdAt)}
        </div>
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
        <h2 className="mb-2 font-semibold">배송 정보</h2>
        <p>받으실 분: {order.receiverName}</p>
        <p>연락처: {order.receiverPhone}</p>
        <p>주소: {order.receiverAddr}</p>
        {order.memo && <p>메모: {order.memo}</p>}
      </div>

      {order.payment && (
        <div className="card mb-4 space-y-1 p-4 text-sm">
          <h2 className="mb-2 font-semibold">결제 정보</h2>
          <p>결제 수단: {order.payment.method}</p>
          <p>결제 상태: {order.payment.status}</p>
          {order.payment.approvedAt && (
            <p>승인 시각: {formatDateTime(order.payment.approvedAt)}</p>
          )}
          {order.payment.failReason && (
            <p className="text-red-600">실패 사유: {order.payment.failReason}</p>
          )}
        </div>
      )}

      <div className="card mb-6 p-4 text-sm">
        <h2 className="mb-2 font-semibold">진행 상태</h2>
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

      {CANCELLABLE.includes(order.status) && (
        <form action={cancelOrder} className="flex justify-end">
          <input type="hidden" name="orderId" value={order.id} />
          <button type="submit" className="btn-danger">
            주문 취소
          </button>
        </form>
      )}
    </div>
  );
}
