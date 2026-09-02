import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/actions/auth";

export const CATEGORIES = [
  "가전/디지털",
  "생활용품",
  "스포츠/레저",
  "식품",
  "패션잡화",
  "뷰티/헬스",
  "홈/인테리어",
];

export default async function Header() {
  const user = await getCurrentUser();

  let cartCount = 0;
  if (user) {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });
    cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur">
      <div className="bg-gray-900 text-white">
        <p className="mx-auto max-w-6xl px-4 py-1.5 text-center text-[11px] tracking-wide">
          첫 구매 회원 전상품 5% 할인 쿠폰 · 5만원 이상 구매 시 무료배송
        </p>
      </div>

      <div className="border-b border-gray-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-gray-900">
            올마켓<span className="text-accent-600">.</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm">
            {user ? (
              <>
                <Link href="/wishlist" className="text-gray-600 hover:text-gray-900">
                  찜한 상품
                </Link>
                <Link href="/cart" className="relative text-gray-600 hover:text-gray-900">
                  장바구니
                  {cartCount > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link href="/orders" className="text-gray-600 hover:text-gray-900">
                  주문내역
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                    관리자
                  </Link>
                )}
                <span className="hidden text-gray-300 sm:inline">|</span>
                <span className="hidden text-gray-500 sm:inline">{user.name}님</span>
                <form action={logout}>
                  <button type="submit" className="text-gray-500 hover:text-gray-900">
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">
                  로그인
                </Link>
                <Link href="/signup" className="btn-primary px-3 py-1.5">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 pb-3 text-sm text-gray-600">
          <Link href="/" className="whitespace-nowrap font-semibold text-gray-900">
            전체
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/?category=${encodeURIComponent(c)}`}
              className="whitespace-nowrap hover:text-gray-900"
            >
              {c}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
