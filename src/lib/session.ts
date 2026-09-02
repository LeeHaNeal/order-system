import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

// NextAuth 같은 외부 라이브러리 없이, Node 내장 crypto(HMAC)로 서명한
// 쿠키 기반 세션을 직접 구현합니다. 토큰 형식: "<userId>.<만료시각ms>.<서명(hex)>"

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7일

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET 환경변수가 설정되지 않았거나 너무 짧습니다. .env 파일을 확인하세요."
    );
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function buildToken(userId: string, expiresAtMs: number): string {
  const payload = `${userId}.${expiresAtMs}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function parseToken(token: string): { userId: string; expiresAtMs: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, signature] = parts;
  const expiresAtMs = Number(expiresAtRaw);
  if (!userId || !expiresAtRaw || !signature || Number.isNaN(expiresAtMs)) return null;

  const expectedSignature = sign(`${userId}.${expiresAtRaw}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (Date.now() > expiresAtMs) return null;

  return { userId, expiresAtMs };
}

/** 로그인 성공 시 세션 쿠키를 발급합니다. Server Action / Route Handler 에서만 호출 가능합니다. */
export async function createSession(userId: string) {
  const expiresAtMs = Date.now() + MAX_AGE_SECONDS * 1000;
  const token = buildToken(userId, expiresAtMs);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** 로그아웃 시 세션 쿠키를 제거합니다. */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** 현재 요청의 세션에서 userId 를 반환합니다. 없거나 유효하지 않으면 null. */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const parsed = parseToken(token);
  return parsed?.userId ?? null;
}

/** 로그인한 사용자 정보를 DB에서 조회합니다. 비로그인 시 null. */
export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

/** 로그인이 필요한 페이지/액션에서 사용. 비로그인 시 /login 으로 리다이렉트합니다. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 관리자 전용 페이지/액션에서 사용. 비로그인/비관리자 시 리다이렉트합니다. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
