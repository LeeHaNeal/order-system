import { prisma } from "@/lib/db";

export type RatingInfo = { avg: number; count: number };

/** 상품 ID별 평균 평점/리뷰 수를 한 번의 쿼리로 가져옵니다. */
export async function getRatingMap(productIds?: string[]): Promise<Map<string, RatingInfo>> {
  const rows = await prisma.review.groupBy({
    by: ["productId"],
    where: productIds ? { productId: { in: productIds } } : undefined,
    _avg: { rating: true },
    _count: { rating: true },
  });

  const map = new Map<string, RatingInfo>();
  for (const row of rows) {
    map.set(row.productId, { avg: row._avg.rating ?? 0, count: row._count.rating });
  }
  return map;
}
