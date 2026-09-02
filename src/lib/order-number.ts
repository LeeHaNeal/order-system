import { randomBytes } from "crypto";

/** "ORD-20260902-9F3A2B" 형태의 사람이 읽을 수 있는 주문번호를 생성합니다. */
export function generateOrderNumber(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}
