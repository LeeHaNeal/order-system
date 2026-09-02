// 결제 Provider 공통 인터페이스.
// 지금은 MockPaymentProvider 만 존재하지만, 실제 PG(토스페이먼츠 등)를 붙일 때는
// 이 인터페이스를 구현하는 새 클래스를 추가하고 index.ts 에서 교체하기만 하면 됩니다.
// (자세한 내용은 프로젝트 루트 README.md의 "실제 PG 연동으로 교체하기" 참고)

export interface PaymentRequestInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  orderName: string; // PG 결제창에 표시될 주문명 (예: "무선 이어폰 외 2건")
  customerName: string;
  customerEmail?: string;
}

export interface PaymentRequestResult {
  /** PG사가 발급하는 이 결제 건의 고유 식별자 */
  paymentKey: string;
  /** 사용자를 이동시켜야 하는 결제 진행 화면 URL (실제 PG는 SDK 팝업을 쓰기도 합니다) */
  checkoutUrl: string;
}

export interface PaymentConfirmInput {
  paymentKey: string;
  orderId: string;
  /** 클라이언트에서 넘어온 결제 금액. 서버에 저장된 주문 금액과 반드시 대조해야 합니다. */
  amount: number;
}

export interface PaymentConfirmResult {
  success: boolean;
  method?: string;
  approvedAt?: Date;
  failReason?: string;
  /** PG 응답 원문(mock 에서는 시뮬레이션된 응답)을 그대로 저장해두기 위한 필드 */
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult>;
  confirmPayment(input: PaymentConfirmInput): Promise<PaymentConfirmResult>;
}
