import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKRW, orderStatusColor, orderStatusLabel } from "@/lib/format";
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus = ALL_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: validStatus ? { status: validStatus } : {},
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-semibold">주문 관리</h2>
        <Link
          href="/admin/orders"
          className={`badge ${!validStatus ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          전체
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`badge ${validStatus === s ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {orderStatusLabel(s)}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">주문번호</th>
              <th className="px-4 py-3">주문자</th>
              <th className="px-4 py-3">상품</th>
              <th className="px-4 py-3">금액</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">주문일시</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-brand-600 hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {order.user.name}
                  <div className="text-xs text-gray-400">{order.user.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {order.items[0]?.productName}
                  {order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ""}
                </td>
                <td className="px-4 py-3 font-medium">{formatKRW(order.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${orderStatusColor(order.status)}`}>
                    {orderStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <p className="p-8 text-center text-gray-400">해당 조건의 주문이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
