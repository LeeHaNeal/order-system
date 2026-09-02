import Link from "next/link";
import type { Product } from "@prisma/client";
import { formatKRW } from "@/lib/format";
import { toggleWishlist } from "@/actions/wishlist";

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 14; // 14일 이내 등록 상품은 NEW 배지

export default function ProductCard({
  product,
  isWishlisted = false,
  showWishlistButton = false,
  rating,
}: {
  product: Product;
  isWishlisted?: boolean;
  showWishlistButton?: boolean;
  rating?: { avg: number; count: number };
}) {
  const soldOut = product.stock <= 0;
  const isNew = Date.now() - new Date(product.createdAt).getTime() < NEW_WINDOW_MS;

  return (
    <div className="group relative flex flex-col">
      <Link href={`/products/${product.id}`} className="flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
          )}

          {isNew && !soldOut && (
            <span className="badge absolute left-2 top-2 bg-gray-900 text-white">NEW</span>
          )}

          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="badge bg-white text-gray-900">품절</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-0.5">
          <span className="text-xs font-medium text-gray-400">{product.category}</span>
          <h3 className="line-clamp-2 text-sm text-gray-800 group-hover:text-black">
            {product.name}
          </h3>
          <p className="mt-1 text-base font-bold text-accent-600">{formatKRW(product.price)}</p>
          {rating && rating.count > 0 && (
            <p className="text-xs text-gray-400">
              <span className="text-amber-500">★</span> {rating.avg.toFixed(1)} ({rating.count})
            </p>
          )}
        </div>
      </Link>

      {showWishlistButton && (
        <form action={toggleWishlist} className="absolute right-2 top-2">
          <input type="hidden" name="productId" value={product.id} />
          <button
            type="submit"
            aria-label={isWishlisted ? "찜 해제" : "찜하기"}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-base shadow-sm transition-colors ${
              isWishlisted
                ? "bg-accent-600 text-white"
                : "bg-white/90 text-gray-500 hover:text-accent-600"
            }`}
          >
            {isWishlisted ? "♥" : "♡"}
          </button>
        </form>
      )}
    </div>
  );
}
