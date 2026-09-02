/** 숫자를 "12,000원" 형태로 표시합니다. */
export function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** Date 를 "2026.09.02 14:30" 형태로 표시합니다. */
export function formatDateTime(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "결제대기",
  PAID: "결제완료",
  FAILED: "결제실패",
  PREPARING: "상품준비중",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  FAILED: "bg-red-100 text-red-800",
  PREPARING: "bg-purple-100 text-purple-800",
  SHIPPING: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export function orderStatusColor(status: string): string {
  return ORDER_STATUS_COLOR[status] ?? "bg-gray-100 text-gray-700";
}
