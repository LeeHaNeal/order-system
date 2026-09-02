import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatKRW } from "@/lib/format";

/**
 * 실제 PG사의 결제창을 흉내낸 mock 페이지입니다.
 * 실제 서비스에서는 이 화면 대신 PG SDK가 제공하는 결제창이 뜨고,
 * 결제 결과에 따라 아래와 동일한 successUrl/failUrl 로 리다이렉트됩니다.
 */
export default async function MockPayPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    paymentKey?: string;
    amount?: string;
    orderName?: string;
  }>;
}) {
  const { orderId, paymentKey, amount, orderName } = await searchParams;

  if (!orderId || !paymentKey || !amount) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order || !order.payment || order.payment.paymentKey !== paymentKey) {
    notFound();
  }

  if (order.payment.status !== "READY") {
    redirect(`/orders/${orderId}`);
  }

  const successHref = `/checkout/success?${new URLSearchParams({
    orderId,
    paymentKey,
    amount,
  }).toString()}`;
  const failHref = `/checkout/fail?${new URLSearchParams({
    orderId,
    message: "고객이 결제를 취소했습니다.",
  }).toString()}`;

  return (
    <div className="mx-auto max-w-md">
      <div className="card overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 text-white">
          <p className="text-xs text-gray-300">Mock PG 결제창 (테스트 전용)</p>
          <h1 className="text-lg font-semibold">결제 진행</h1>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <p className="text-sm text-gray-500">주문명</p>
            <p className="font-medium">{orderName ?? order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">주문번호</p>
            <p className="font-mono text-sm">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">결제 금액</p>
            <p className="text-2xl font-bold text-accent-600">{formatKRW(Number(amount))}</p>
          </div>

          <p className="rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            이 화면은 실제 PG사 결제창이 아니라 결제 흐름을 테스트하기 위한 mock 화면입니다. 아래
            버튼으로 결제 성공/실패 상황을 직접 선택해 시뮬레이션할 수 있습니다.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Link href={successHref} className="btn-primary">
              결제 성공으로 진행
            </Link>
            <Link href={failHref} className="btn-secondary">
              결제 실패/취소로 진행
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
