import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKRW } from "@/lib/format";
import { addToCart } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import { deleteReview, submitReview } from "@/actions/reviews";
import { getCurrentUser } from "@/lib/session";
import Toast from "@/components/Toast";

function stars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; reviewed?: string }>;
}) {
  const { id } = await params;
  const { error, reviewed } = await searchParams;

  const [product, user] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    getCurrentUser(),
  ]);
  if (!product) notFound();

  const [reviews, ratingAgg, myWishlist] = await Promise.all([
    prisma.review.findMany({
      where: { productId: id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.aggregate({ where: { productId: id }, _avg: { rating: true }, _count: true }),
    user
      ? prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId: user.id, productId: id } },
        })
      : null,
  ]);

  const myReview = user ? reviews.find((r) => r.userId === user.id) : undefined;
  const avgRating = ratingAgg._avg.rating ?? 0;
  const soldOut = product.stock <= 0;

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-6xl">📦</span>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between">
            <span className="text-sm text-gray-400">{product.category}</span>
            {user && (
              <form action={toggleWishlist}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="redirectTo" value={`/products/${product.id}`} />
                <button
                  type="submit"
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                    myWishlist
                      ? "border-accent-600 bg-accent-50 text-accent-600"
                      : "border-gray-300 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {myWishlist ? "♥ 찜함" : "♡ 찜하기"}
                </button>
              </form>
            )}
          </div>

          <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>

          {ratingAgg._count > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              <span className="text-amber-500">★</span> {avgRating.toFixed(1)} · 리뷰{" "}
              {ratingAgg._count}개
            </p>
          )}

          <p className="mt-3 text-2xl font-bold text-accent-600">{formatKRW(product.price)}</p>

          <p className="mt-4 whitespace-pre-line text-gray-600">
            {product.description || "상품 설명이 없습니다."}
          </p>

          <p className="mt-4 text-sm text-gray-500">
            {soldOut ? (
              <span className="font-medium text-red-600">품절된 상품입니다.</span>
            ) : (
              <>남은 재고: {product.stock}개</>
            )}
          </p>

          <Toast type="error" message={error} />
          <Toast type="success" message={reviewed === "1" ? "리뷰가 등록되었습니다." : undefined} />

          {!product.isActive ? (
            <p className="mt-6 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-500">
              현재 판매가 중지된 상품입니다.
            </p>
          ) : (
            <form action={addToCart} className="mt-6 flex items-center gap-2">
              <input type="hidden" name="productId" value={product.id} />
              <input
                type="number"
                name="quantity"
                min={1}
                max={Math.max(product.stock, 1)}
                defaultValue={1}
                disabled={soldOut}
                className="input w-20"
              />
              <button type="submit" className="btn-primary" disabled={soldOut}>
                장바구니 담기
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="mt-16">
        <h2 className="section-title">상품 리뷰 {ratingAgg._count > 0 && `(${ratingAgg._count})`}</h2>

        {user ? (
          <form
            action={submitReview}
            className="card mt-4 space-y-3 p-4"
          >
            <input type="hidden" name="productId" value={product.id} />
            <div className="flex items-center gap-3">
              <label className="label mb-0" htmlFor="rating">
                별점
              </label>
              <select
                id="rating"
                name="rating"
                defaultValue={myReview?.rating ?? 5}
                className="input w-auto"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {stars(n)} ({n})
                  </option>
                ))}
              </select>
            </div>
            <textarea
              name="comment"
              rows={3}
              placeholder="상품에 대한 솔직한 리뷰를 남겨주세요."
              defaultValue={myReview?.comment}
              className="input"
            />
            <button type="submit" className="btn-primary">
              {myReview ? "리뷰 수정" : "리뷰 등록"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            리뷰를 작성하려면 로그인이 필요합니다.
          </p>
        )}

        {myReview && (
          <form action={deleteReview} className="mt-2">
            <input type="hidden" name="reviewId" value={myReview.id} />
            <input type="hidden" name="productId" value={product.id} />
            <button type="submit" className="text-xs text-gray-400 hover:text-accent-600">
              내 리뷰 삭제
            </button>
          </form>
        )}

        <div className="mt-6 divide-y">
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-gray-400">아직 등록된 리뷰가 없습니다.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="text-amber-500">{stars(r.rating)}</span>{" "}
                    <span className="ml-1 text-gray-500">{r.user.name}</span>
                  </p>
                  <span className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
