import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKRW, orderStatusColor, orderStatusLabel } from "@/lib/format";
import RevenueChart from "@/components/RevenueChart";
import type { OrderStatus } from "@prisma/client";

const REVENUE_STATUSES: OrderStatus[] = ["PAID", "PREPARING", "SHIPPING", "DELIVERED"];
const CHART_DAYS = 14;

/** 로컬 타임존 기준 YYYY-MM-DD 키 (UTC 변환으로 인한 날짜 밀림 방지) */
function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function AdminDashboardPage() {
  const chartStart = new Date();
  chartStart.setDate(chartStart.getDate() - (CHART_DAYS - 1));
  chartStart.setHours(0, 0, 0, 0);

  const [revenueAgg, statusCounts, productCount, lowStock, recentOrders, recentRevenueOrders] =
    await Promise.all([
      prisma.order.aggregate({
        where: { status: { in: REVENUE_STATUSES } },
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.product.count(),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 8,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: true },
      }),
      prisma.order.findMany({
        where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: chartStart } },
        select: { createdAt: true, totalAmount: true },
      }),
    ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all])
  ) as Record<string, number>;

  // 최근 14일 일별 매출 합계를 계산합니다 (DB 종류에 상관없이 동작하도록 JS에서 집계).
  const revenueByDay = new Map<string, number>();
  for (const order of recentRevenueOrders) {
    const key = dayKey(order.createdAt);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.totalAmount);
  }
  const chartData = Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = new Date(chartStart);
    date.setDate(date.getDate() + i);
    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      amount: revenueByDay.get(dayKey(date)) ?? 0,
    };
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">총 매출 (결제완료 기준)</p>
          <p className="mt-1 text-xl font-bold text-accent-600">
            {formatKRW(revenueAgg._sum.totalAmount ?? 0)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">결제대기</p>
          <p className="mt-1 text-xl font-bold">{countByStatus.PENDING_PAYMENT ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">배송중</p>
          <p className="mt-1 text-xl font-bold">{countByStatus.SHIPPING ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">등록 상품 수</p>
          <p className="mt-1 text-xl font-bold">{productCount}</p>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 font-semibold">최근 {CHART_DAYS}일 매출 추이</h2>
        <RevenueChart data={chartData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">최근 주문</h2>
          <div className="space-y-2 text-sm">
            {recentOrders.length === 0 && <p className="text-gray-400">주문이 없습니다.</p>}
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50"
              >
                <div>
                  <p className="font-mono text-xs text-gray-500">{order.orderNumber}</p>
                  <p>{order.user.name}</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${orderStatusColor(order.status)}`}>
                    {orderStatusLabel(order.status)}
                  </span>
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold">재고 부족 상품 (5개 이하)</h2>
          <div className="space-y-2 text-sm">
            {lowStock.length === 0 && (
              <p className="text-gray-400">재고 부족 상품이 없습니다.</p>
            )}
            {lowStock.map((product) => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}/edit`}
                className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50"
              >
                <span>{product.name}</span>
                <span className="font-semibold text-red-600">재고 {product.stock}개</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
