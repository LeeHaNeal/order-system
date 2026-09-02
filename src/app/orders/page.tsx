import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatKRW, orderStatusColor, orderStatusLabel } from "@/lib/format";
import Toast from "@/components/Toast";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">주문내역</h1>

      <Toast type="error" message={error} />

      {orders.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          아직 주문 내역이 없습니다.
          <div className="mt-4">
            <Link href="/" className="btn-primary">
              쇼핑하러 가기
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="card flex flex-col gap-2 p-4 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
                <p className="font-mono text-sm text-gray-600">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-gray-700">
                  {order.items[0]?.productName}
                  {order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${orderStatusColor(order.status)}`}>
                  {orderStatusLabel(order.status)}
                </span>
                <span className="font-semibold">{formatKRW(order.totalAmount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
