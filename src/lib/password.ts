import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// bcrypt 등의 외부 패키지 없이 Node.js 내장 crypto(scrypt)만으로
// 비밀번호를 안전하게 해싱/검증합니다.
// 저장 형식: "<salt(hex)>:<hash(hex)>"

const KEY_LENGTH = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedBuffer = scryptSync(plain, salt, KEY_LENGTH);

  if (hashBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, suppliedBuffer);
}
