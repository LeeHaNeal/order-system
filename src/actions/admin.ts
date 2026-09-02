"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { couponSchema, productSchema } from "@/lib/validators";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * 관리자가 업로드한 이미지 파일을 public/uploads 에 저장하고
 * 브라우저에서 바로 접근 가능한 경로("/uploads/xxx.jpg")를 반환합니다.
 * 실제 운영 환경이라면 S3 등 오브젝트 스토리지에 저장해야 하지만,
 * 데모/로컬 개발 목적상 파일시스템에 직접 저장합니다.
 */
async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("이미지 파일(jpg, png, webp, gif)만 업로드할 수 있습니다.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("이미지 파일은 5MB 이하만 업로드할 수 있습니다.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || `.${file.type.split("/")[1] ?? "jpg"}`;
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}

/** 이전에 업로드된 로컬 이미지(/uploads/...)라면 디스크에서도 삭제합니다. */
async function deleteUploadedImageIfLocal(imageUrl: string | null): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", imageUrl));
  } catch {
    // 파일이 이미 없으면 무시합니다.
  }
}

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "FAILED",
  "PREPARING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
];

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    imageUrl: formData.get("imageUrl"),
    isActive: formData.get("isActive") === "on",
  });
}

export async function createProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = parseProductForm(formData);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    redirect(`/admin/products/new?error=${encodeURIComponent(message)}`);
  }

  let imageUrl = parsed.data.imageUrl || null;
  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imageUrl = await saveUploadedImage(imageFile);
    } catch (e) {
      const message = e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.";
      redirect(`/admin/products/new?error=${encodeURIComponent(message)}`);
    }
  }

  await prisma.product.create({
    data: {
      ...parsed.data,
      imageUrl,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const parsed = parseProductForm(formData);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    redirect(`/admin/products/${productId}/edit?error=${encodeURIComponent(message)}`);
  }

  const existingProduct = await prisma.product.findUnique({ where: { id: productId } });

  let imageUrl = parsed.data.imageUrl || null;
  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imageUrl = await saveUploadedImage(imageFile);
      await deleteUploadedImageIfLocal(existingProduct?.imageUrl ?? null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.";
      redirect(`/admin/products/${productId}/edit?error=${encodeURIComponent(message)}`);
    }
  } else if (!parsed.data.imageUrl && existingProduct?.imageUrl) {
    // 이미지 URL을 비워서 제출한 경우: 업로드했던 로컬 파일이면 정리합니다.
    await deleteUploadedImageIfLocal(existingProduct.imageUrl);
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      ...parsed.data,
      imageUrl,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  redirect("/admin/products");
}

/**
 * 상품을 삭제합니다. 단, 이미 주문에 포함된 적이 있는 상품은
 * 주문 내역의 무결성을 위해 실제로 삭제하지 않고 "판매중지"로 전환합니다.
 */
export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");

  const existingProduct = await prisma.product.findUnique({ where: { id: productId } });

  try {
    await prisma.product.delete({ where: { id: productId } });
    await deleteUploadedImageIfLocal(existingProduct?.imageUrl ?? null);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    } else {
      throw error;
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const nextStatus = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 200);

  if (!ORDER_STATUSES.includes(nextStatus as OrderStatus)) {
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent("올바르지 않은 상태값입니다.")}`);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) {
    redirect(`/admin/orders?error=${encodeURIComponent("주문을 찾을 수 없습니다.")}`);
  }

  await prisma.$transaction(async (tx) => {
    // 취소 처리 시, 이미 결제/준비 단계였다면 재고를 복구합니다.
    if (
      nextStatus === "CANCELLED" &&
      (order.status === "PAID" || order.status === "PREPARING") &&
      order.status !== "CANCELLED"
    ) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status: nextStatus as OrderStatus } });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: nextStatus as OrderStatus,
        note: note || "관리자 상태 변경",
      },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}

function parseCouponForm(formData: FormData) {
  return couponSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minOrderAmount: formData.get("minOrderAmount"),
    maxDiscountAmount: formData.get("maxDiscountAmount"),
    isActive: formData.get("isActive") === "on",
    expiresAt: formData.get("expiresAt"),
  });
}

export async function createCoupon(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = parseCouponForm(formData);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    redirect(`/admin/coupons/new?error=${encodeURIComponent(message)}`);
  }

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    redirect(`/admin/coupons/new?error=${encodeURIComponent("이미 존재하는 쿠폰 코드입니다.")}`);
  }

  await prisma.coupon.create({ data: parsed.data });

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

/** 쿠폰 활성/비활성을 토글합니다. */
export async function toggleCoupon(formData: FormData): Promise<void> {
  await requireAdmin();
  const couponId = String(formData.get("couponId") ?? "");

  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) {
    redirect(`/admin/coupons?error=${encodeURIComponent("쿠폰을 찾을 수 없습니다.")}`);
  }

  await prisma.coupon.update({ where: { id: couponId }, data: { isActive: !coupon.isActive } });

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

/** 쿠폰을 삭제합니다. 이미 사용된 쿠폰(주문에 연결됨)은 삭제 대신 비활성화합니다. */
export async function deleteCoupon(formData: FormData): Promise<void> {
  await requireAdmin();
  const couponId = String(formData.get("couponId") ?? "");

  try {
    await prisma.coupon.delete({ where: { id: couponId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      await prisma.coupon.update({ where: { id: couponId }, data: { isActive: false } });
    } else {
      throw error;
    }
  }

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}
