import Link from "next/link";
import { login } from "@/actions/auth";
import Toast from "@/components/Toast";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">로그인</h1>

      <Toast type="error" message={error} />

      <form action={login} className="card space-y-4 p-6">
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

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
          <input id="password" name="password" type="password" required className="input" />
        </div>

        <button type="submit" className="btn-primary w-full">
          로그인
        </button>

        <p className="text-center text-sm text-gray-500">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-brand-600 hover:underline">
            회원가입
          </Link>
        </p>
      </form>

      <p className="mt-4 text-center text-xs text-gray-400">
        테스트 계정: admin@example.com / admin1234 (관리자), user@example.com / user1234 (일반회원)
      </p>
    </div>
  );
}
