"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

async function getOrCreateCartId(userId: string): Promise<string> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return cart.id;
}

export async function addToCart(formData: FormData): Promise<void> {
  const user = await requireUser();
  const productId = String(formData.get("productId") ?? "");
  const requestedQty = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    redirect(`/products/${productId}?error=${encodeURIComponent("판매중인 상품이 아닙니다.")}`);
  }

  if (product.stock < 1) {
    redirect(`/products/${productId}?error=${encodeURIComponent("품절된 상품입니다.")}`);
  }

  const cartId = await getOrCreateCartId(user.id);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });

  const newQuantity = Math.min(product.stock, (existing?.quantity ?? 0) + requestedQty);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: newQuantity },
    create: { cartId, productId, quantity: newQuantity },
  });

  revalidatePath("/cart");
  redirect("/cart");
}

export async function updateCartItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Math.max(0, Number(formData.get("quantity") ?? 0) || 0);

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });

  if (!item || item.cart.userId !== user.id) {
    redirect(`/cart?error=${encodeURIComponent("장바구니 항목을 찾을 수 없습니다.")}`);
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const clamped = Math.min(quantity, item.product.stock);
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: clamped } });
  }

  revalidatePath("/cart");
}

export async function removeCartItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== user.id) {
    redirect(`/cart?error=${encodeURIComponent("장바구니 항목을 찾을 수 없습니다.")}`);
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/cart");
}
