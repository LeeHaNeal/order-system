import type { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mockProvider";
import { TossPaymentProvider } from "./tossProvider";

export * from "./types";

// PAYMENT_PROVIDER 환경변수로 provider 를 교체합니다. (.env 의 PAYMENT_PROVIDER="mock" | "toss")
function createProvider(): PaymentProvider {
  const providerName = process.env.PAYMENT_PROVIDER ?? "mock";

  switch (providerName) {
    case "mock":
      return new MockPaymentProvider();
    case "toss":
      return new TossPaymentProvider();
    default:
      throw new Error(`알 수 없는 PAYMENT_PROVIDER 입니다: ${providerName}`);
  }
}

export const paymentProvider: PaymentProvider = createProvider();
