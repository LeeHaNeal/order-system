"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { reviewSchema } from "@/lib/validators";

/** 리뷰 작성/수정. 상품 하나당 사용자 한 명은 리뷰 1개만 가질 수 있어 upsert로 처리합니다. */
export async function submitReview(formData: FormData): Promise<void> {
  const user = await requireUser();
  const productId = String(formData.get("productId") ?? "");

  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    redirect(`/products/${productId}?error=${encodeURIComponent(message)}`);
  }

  await prisma.review.upsert({
    where: { productId_userId: { productId, userId: user.id } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment },
    create: {
      productId,
      userId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  redirect(`/products/${productId}?reviewed=1`);
}

export async function deleteReview(formData: FormData): Promise<void> {
  const user = await requireUser();
  const reviewId = String(formData.get("reviewId") ?? "");
  const productId = String(formData.get("productId") ?? "");

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== user.id) {
    redirect(`/products/${productId}?error=${encodeURIComponent("리뷰를 찾을 수 없습니다.")}`);
  }

  await prisma.review.delete({ where: { id: reviewId } });

  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  redirect(`/products/${productId}`);
}
