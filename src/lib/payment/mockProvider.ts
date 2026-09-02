import { randomUUID } from "crypto";
import type {
  PaymentConfirmInput,
  PaymentConfirmResult,
  PaymentProvider,
  PaymentRequestInput,
  PaymentRequestResult,
} from "./types";

/**
 * 실제 PG사 없이 결제 흐름을 그대로 재현하는 mock provider.
 *
 * 실제 토스페이먼츠 연동 흐름과 최대한 비슷하게 설계했습니다:
 *  1) requestPayment(): 결제창 진입 전, 결제 건을 생성하고 결제창 URL을 돌려줍니다.
 *     (실제로는 PG SDK가 팝업/리다이렉트를 처리하지만, mock에서는 우리 자체
 *      /pay/mock 페이지를 "PG 결제창"으로 흉내냅니다.)
 *  2) 사용자가 결제창(=/pay/mock)에서 "성공"을 선택하면 successUrl 로,
 *     "실패"를 선택하면 failUrl 로 리다이렉트됩니다. (실제 PG와 동일한 패턴)
 *  3) successUrl 핸들러가 confirmPayment() 를 호출해 최종 승인 처리를 합니다.
 *     failUrl 로 온 경우에는 confirmPayment 호출 없이 바로 실패 처리합니다.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const paymentKey = `mock_${randomUUID()}`;

    const params = new URLSearchParams({
      orderId: input.orderId,
      paymentKey,
      amount: String(input.amount),
      orderName: input.orderName,
    });

    return {
      paymentKey,
      checkoutUrl: `/pay/mock?${params.toString()}`,
    };
  }

  async confirmPayment(input: PaymentConfirmInput): Promise<PaymentConfirmResult> {
    // mock 결제창에서 이미 "성공"을 선택했을 때만 이 함수가 호출되므로
    // 여기서는 실제 PG 서버가 최종 승인 응답을 주는 것을 흉내냅니다.
    const method = Math.random() > 0.5 ? "카드" : "간편결제";
    const approvedAt = new Date();

    return {
      success: true,
      method,
      approvedAt,
      raw: {
        mock: true,
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        totalAmount: input.amount,
        method,
        status: "DONE",
        approvedAt: approvedAt.toISOString(),
        receipt: {
          url: `https://mock-pg.example.com/receipts/${input.paymentKey}`,
        },
      },
    };
  }
}
