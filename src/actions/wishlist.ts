"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** 찜하기 토글: 이미 찜한 상품이면 해제, 아니면 추가합니다. */
export async function toggleWishlist(formData: FormData): Promise<void> {
  const user = await requireUser();
  const productId = String(formData.get("productId") ?? "");
  const redirectTo = formData.get("redirectTo");

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  }

  revalidatePath("/");
  revalidatePath("/wishlist");
  revalidatePath(`/products/${productId}`);

  if (typeof redirectTo === "string" && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }
}
