import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  email: z.string().trim().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const checkoutSchema = z.object({
  receiverName: z.string().trim().min(1, "받으실 분 성함을 입력해주세요.").max(50),
  receiverPhone: z
    .string()
    .trim()
    .min(9, "연락처를 정확히 입력해주세요.")
    .max(20),
  receiverAddr: z.string().trim().min(1, "배송지 주소를 입력해주세요.").max(200),
  memo: z.string().trim().max(200).optional().default(""),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(30)
    .optional()
    .or(z.literal(""))
    .default(""),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "별점을 선택해주세요.").max(5),
  comment: z.string().trim().max(1000).optional().default(""),
});

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "쿠폰 코드는 3자 이상이어야 합니다.")
    .max(30),
  description: z.string().trim().max(200).optional().default(""),
  discountType: z.enum(["PERCENT", "AMOUNT"]),
  discountValue: z.coerce.number().int().min(1, "할인 값을 입력해주세요."),
  minOrderAmount: z.coerce.number().int().min(0).optional().default(0),
  maxDiscountAmount: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === undefined ? null : v)),
  isActive: z.coerce.boolean().optional().default(true),
  expiresAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? new Date(v) : null)),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "상품명을 입력해주세요.").max(100),
  description: z.string().trim().max(2000).optional().default(""),
  category: z.string().trim().min(1, "카테고리를 입력해주세요.").max(30),
  price: z.coerce.number().int().min(0, "가격은 0 이상이어야 합니다."),
  stock: z.coerce.number().int().min(0, "재고는 0 이상이어야 합니다."),
  imageUrl: z
    .string()
    .trim()
    .url("올바른 URL 형식이 아닙니다.")
    .optional()
    .or(z.literal(""))
    .default(""),
  isActive: z.coerce.boolean().optional().default(true),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
