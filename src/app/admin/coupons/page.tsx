import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatKRW } from "@/lib/format";
import { deleteCoupon, toggleCoupon } from "@/actions/admin";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Toast from "@/components/Toast";

function discountLabel(coupon: { discountType: string; discountValue: number }) {
  return coupon.discountType === "PERCENT"
    ? `${coupon.discountValue}%`
    : formatKRW(coupon.discountValue);
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">쿠폰 관리</h2>
        <Link href="/admin/coupons/new" className="btn-primary">
          + 쿠폰 등록
        </Link>
      </div>

      <Toast type="error" message={error} />

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">코드</th>
              <th className="px-4 py-3">설명</th>
              <th className="px-4 py-3">할인</th>
              <th className="px-4 py-3">최소주문금액</th>
              <th className="px-4 py-3">만료일</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-4 py-3 font-mono font-medium">{coupon.code}</td>
                <td className="px-4 py-3 text-gray-500">{coupon.description || "-"}</td>
                <td className="px-4 py-3">{discountLabel(coupon)}</td>
                <td className="px-4 py-3">{formatKRW(coupon.minOrderAmount)}</td>
                <td className="px-4 py-3 text-gray-500">
                  {coupon.expiresAt
                    ? new Intl.DateTimeFormat("ko-KR").format(coupon.expiresAt)
                    : "무제한"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      coupon.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {coupon.isActive ? "사용가능" : "사용중지"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <form action={toggleCoupon}>
                      <input type="hidden" name="couponId" value={coupon.id} />
                      <button type="submit" className="text-brand-600 hover:underline">
                        {coupon.isActive ? "중지" : "활성화"}
                      </button>
                    </form>
                    <form action={deleteCoupon}>
                      <input type="hidden" name="couponId" value={coupon.id} />
                      <ConfirmSubmitButton
                        confirmMessage={`"${coupon.code}" 쿠폰을 삭제할까요? 이미 사용된 쿠폰이면 삭제 대신 사용중지로 전환됩니다.`}
                        className="text-red-500 hover:underline"
                      >
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {coupons.length === 0 && (
          <p className="p-8 text-center text-gray-400">등록된 쿠폰이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
