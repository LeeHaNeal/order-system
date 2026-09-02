"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

const STYLES: Record<ToastType, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-gray-900",
};

/**
 * 서버 컴포넌트에서 넘어온 성공/실패 메시지(주로 redirect 쿼리스트링)를
 * 화면 고정 위치에 뜨는 토스트로 보여주고 일정 시간 후 자동으로 사라지게 합니다.
 * message가 없으면 아무것도 렌더링하지 않습니다.
 */
export default function Toast({
  message,
  type = "info",
  duration = 3500,
}: {
  message?: string | null;
  type?: ToastType;
  duration?: number;
}) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return;
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, duration]);

  if (!message || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:justify-end sm:px-4">
      <div
        role="status"
        className={`animate-toast-in pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${STYLES[type]}`}
      >
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 text-white/80 hover:text-white"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
