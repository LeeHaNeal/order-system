import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">관리자</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-gray-600 hover:text-brand-600">
            대시보드
          </Link>
          <Link href="/admin/products" className="text-gray-600 hover:text-brand-600">
            상품 관리
          </Link>
          <Link href="/admin/orders" className="text-gray-600 hover:text-brand-600">
            주문 관리
          </Link>
          <Link href="/admin/coupons" className="text-gray-600 hover:text-brand-600">
            쿠폰 관리
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
