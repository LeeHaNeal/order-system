import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/components/Header";
import { getCurrentUser } from "@/lib/session";
import { getRatingMap } from "@/lib/ratings";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const [products, user] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
    getCurrentUser(),
  ]);

  const productIds = products.map((p) => p.id);
  const [ratingMap, wishlistedIds] = await Promise.all([
    getRatingMap(productIds),
    user
      ? prisma.wishlistItem
          .findMany({ where: { userId: user.id, productId: { in: productIds } } })
          .then((rows) => new Set(rows.map((r) => r.productId)))
      : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div>
      <section className="mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 px-8 py-12 text-white sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-300">
          Autumn Sale
        </p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          가을맞이 전상품 특가, 지금 만나보세요
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          신규 회원 가입 시 5% 할인 쿠폰 즉시 지급 · 5만원 이상 구매 시 무료배송
        </p>
      </section>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">{category ?? "전체 상품"}</h2>
          <p className="mt-1 text-sm text-gray-500">총 {products.length}개의 상품</p>
        </div>

        <form className="flex flex-wrap gap-2" action="/" method="get">
          <input
            type="text"
            name="q"
            placeholder="찾으시는 상품을 검색해보세요"
            defaultValue={q ?? ""}
            className="input w-56"
          />
          {category && <input type="hidden" name="category" value={category} />}
          <button type="submit" className="btn-secondary">
            검색
          </button>
        </form>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/"
          className={`badge border px-3 py-1.5 ${
            !category
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
          }`}
        >
          전체
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/?category=${encodeURIComponent(c)}`}
            className={`badge border px-3 py-1.5 ${
              category === c
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-gray-500">조건에 맞는 상품이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showWishlistButton={!!user}
              isWishlisted={wishlistedIds.has(product.id)}
              rating={ratingMap.get(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
