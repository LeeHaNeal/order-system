import { redirect } from "next/navigation";
import TossCheckoutLauncher from "@/components/TossCheckoutLauncher";

/**
 * TossPaymentProvider.requestPayment() 가 사용자를 보내는 중간 페이지입니다.
 * 실제 결제창을 여는 주체는 브라우저의 토스 SDK이기 때문에, 여기서는
 * 서버에서 받은 주문 정보를 클라이언트 컴포넌트에 넘겨주기만 합니다.
 */
export default async function TossPayPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    orderNumber?: string;
    amount?: string;
    orderName?: string;
    customerName?: string;
    customerEmail?: string;
  }>;
}) {
  const { orderId, amount, orderName, customerName, customerEmail } = await searchParams;

  if (!orderId || !amount || !orderName || !customerName) {
    redirect(`/?error=${encodeURIComponent("잘못된 결제 요청입니다.")}`);
  }

  const clientKey = process.env.TOSS_CLIENT_KEY;
  if (!clientKey) {
    redirect(
      `/checkout/fail?${new URLSearchParams({
        orderId,
        message: "TOSS_CLIENT_KEY가 설정되지 않았습니다. 관리자에게 문의해주세요.",
      }).toString()}`
    );
  }

  return (
    <TossCheckoutLauncher
      clientKey={clientKey}
      orderId={orderId}
      amount={Number(amount)}
      orderName={orderName}
      customerName={customerName}
      customerEmail={customerEmail}
    />
  );
}
