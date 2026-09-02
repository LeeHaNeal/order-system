"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (
        method: string,
        options: {
          amount: number;
          orderId: string;
          orderName: string;
          customerName: string;
          customerEmail?: string;
          successUrl: string;
          failUrl: string;
        }
      ) => Promise<void>;
    };
  }
}

const TOSS_SDK_URL = "https://js.tosspayments.com/v1/payment";

/**
 * 서버(TossPaymentProvider.requestPayment)가 만들어준 `/pay/toss` 중간 페이지에서
 * 렌더링되는 클라이언트 컴포넌트입니다. 마운트되자마자 토스 SDK를 불러와
 * 실제 토스 결제창(카드 선택 등)으로 사용자를 이동시킵니다.
 */
export default function TossCheckoutLauncher({
  clientKey,
  orderId,
  amount,
  orderName,
  customerName,
  customerEmail,
}: {
  clientKey: string;
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function launch() {
      if (cancelled || !window.TossPayments) return;

      const origin = window.location.origin;
      const tossPayments = window.TossPayments(clientKey);

      tossPayments
        .requestPayment("카드", {
          amount,
          orderId,
          orderName,
          customerName,
          customerEmail,
          successUrl: `${origin}/checkout/success`,
          failUrl: `${origin}/checkout/fail`,
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          // 사용자가 결제창을 닫거나(취소) 오류가 발생한 경우.
          // 토스가 직접 failUrl로 보내주지 않는 케이스이므로 우리가 직접 이동시켜줍니다.
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : "결제가 취소되었습니다.";
          window.location.href = `${origin}/checkout/fail?${new URLSearchParams({
            orderId,
            message,
          }).toString()}`;
        });
    }

    if (window.TossPayments) {
      launch();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TOSS_SDK_URL}"]`
    );
    const script = existingScript ?? document.createElement("script");
    script.src = TOSS_SDK_URL;
    script.addEventListener("load", launch);
    script.addEventListener("error", () => {
      if (!cancelled) setError("결제 모듈을 불러오지 못했습니다. 네트워크 상태를 확인해주세요.");
    });
    if (!existingScript) document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", launch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientKey, orderId, amount, orderName, customerName, customerEmail]);

  return (
    <div className="mx-auto max-w-sm py-24 text-center">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <p className="text-sm text-gray-500">토스페이먼츠 결제창으로 이동하고 있습니다...</p>
        </>
      )}
    </div>
  );
}
