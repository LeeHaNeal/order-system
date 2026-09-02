"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema, signupSchema } from "@/lib/validators";

export async function signup(formData: FormData): Promise<void> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/signup?error=${encodeURIComponent("이미 가입된 이메일입니다.")}`);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      cart: { create: {} },
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function login(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const { email, password } = parsed.data;
  const invalidMessage = encodeURIComponent("이메일 또는 비밀번호가 올바르지 않습니다.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect(`/login?error=${invalidMessage}`);
  }

  await createSession(user.id);

  const redirectTo = formData.get("redirectTo");
  redirect(typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
