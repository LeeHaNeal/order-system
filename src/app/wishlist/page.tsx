import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import ProductCard from "@/components/ProductCard";

export default async function WishlistPage() {
  const user = await requireUser();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">찜한 상품</h1>

      {items.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          아직 찜한 상품이 없습니다.
          <div className="mt-4">
            <Link href="/" className="btn-primary">
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              product={item.product}
              isWishlisted
              showWishlistButton
            />
          ))}
        </div>
      )}
    </div>
  );
}
