import { randomUUID } from "crypto";
import type {
  PaymentConfirmInput,
  PaymentConfirmResult,
  PaymentProvider,
  PaymentRequestInput,
  PaymentRequestResult,
} from "./types";

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

/**
 * 실제 토스페이먼츠 연동 provider.
 *
 * mock과 다른 점 하나: 토스는 결제 요청 자체를 "브라우저의 위젯 SDK"가 수행합니다.
 * 즉 서버(requestPayment)는 실제 결제창을 열 수 없고, 대신 우리 서비스의 중간 페이지
 * (`/pay/toss`)로 사용자를 보내면 그 페이지의 클라이언트 컴포넌트가 토스 SDK를 불러와
 * `requestPayment()`를 호출해 진짜 토스 결제창으로 이동시킵니다.
 *
 * 그래서 이 시점에는 토스가 발급하는 진짜 paymentKey를 아직 알 수 없습니다.
 * 토스가 결제 승인 후 successUrl(`/checkout/success`)로 리다이렉트할 때 진짜
 * paymentKey를 쿼리로 알려주며, 그 라우트에서 우리 DB에 저장해둔 임시 paymentKey를
 * 진짜 값으로 갱신한 뒤 confirmPayment()를 호출합니다.
 */
export class TossPaymentProvider implements PaymentProvider {
  readonly name = "toss";

  async requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const pendingPaymentKey = `toss_pending_${randomUUID()}`;

    const params = new URLSearchParams({
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      amount: String(input.amount),
      orderName: input.orderName,
      customerName: input.customerName,
    });
    if (input.customerEmail) params.set("customerEmail", input.customerEmail);

    return {
      paymentKey: pendingPaymentKey,
      checkoutUrl: `/pay/toss?${params.toString()}`,
    };
  }

  async confirmPayment(input: PaymentConfirmInput): Promise<PaymentConfirmResult> {
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요."
      );
    }

    const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: input.amount,
      }),
    });

    const data: Record<string, unknown> = await response.json();

    if (!response.ok) {
      return {
        success: false,
        failReason:
          (typeof data.message === "string" && data.message) || "토스페이먼츠 결제 승인에 실패했습니다.",
        raw: data,
      };
    }

    return {
      success: true,
      method: typeof data.method === "string" ? data.method : undefined,
      approvedAt: typeof data.approvedAt === "string" ? new Date(data.approvedAt) : new Date(),
      raw: data,
    };
  }
}
