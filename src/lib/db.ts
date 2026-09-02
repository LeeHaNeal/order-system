import { PrismaClient } from "@prisma/client";

// Next.js 개발 모드에서 hot-reload 될 때마다 PrismaClient 가 새로 생성되어
// DB 커넥션이 계속 쌓이는 것을 방지하기 위한 표준 싱글턴 패턴입니다.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
