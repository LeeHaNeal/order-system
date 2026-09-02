import Link from "next/link";
import { signup } from "@/actions/auth";
import Toast from "@/components/Toast";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">회원가입</h1>

      <Toast type="error" message={error} />

      <form action={signup} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="name">
            이름
          </label>
          <input id="name" name="name" required className="input" />
        </div>

        <div>
          <label className="label" htmlFor="email">
            이메일
          </label>
          <input id="email" name="email" type="email" required className="input" />
        </div>

        <div>
          <label className="label" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="input"
          />
          <p className="mt-1 text-xs text-gray-400">8자 이상 입력해주세요.</p>
        </div>

        <button type="submit" className="btn-primary w-full">
          회원가입
        </button>

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
