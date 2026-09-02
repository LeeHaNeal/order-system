import { createCoupon } from "@/actions/admin";
import Toast from "@/components/Toast";

export default async function NewCouponPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-lg font-semibold">쿠폰 등록</h2>
      <Toast type="error" message={error} />

      <form action={createCoupon} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="code">
            쿠폰 코드
          </label>
          <input
            id="code"
            name="code"
            required
            placeholder="예: WELCOME10"
            className="input font-mono uppercase"
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            설명 (선택)
          </label>
          <input id="description" name="description" placeholder="예: 신규 가입 축하 쿠폰" className="input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="discountType">
              할인 방식
            </label>
            <select id="discountType" name="discountType" defaultValue="PERCENT" className="input">
              <option value="PERCENT">정률 (%)</option>
              <option value="AMOUNT">정액 (원)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="discountValue">
              할인 값
            </label>
            <input
              id="discountValue"
              name="discountValue"
              type="number"
              min={1}
              required
              placeholder="예: 10"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="minOrderAmount">
              최소 주문 금액
            </label>
            <input
              id="minOrderAmount"
              name="minOrderAmount"
              type="number"
              min={0}
              defaultValue={0}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="maxDiscountAmount">
              최대 할인 금액 (선택)
            </label>
            <input
              id="maxDiscountAmount"
              name="maxDiscountAmount"
              type="number"
              min={0}
              placeholder="정률 쿠폰의 상한선"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="expiresAt">
            만료일 (선택)
          </label>
          <input id="expiresAt" name="expiresAt" type="date" className="input" />
        </div>

        <div className="flex items-center gap-2">
          <input id="isActive" name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
          <label htmlFor="isActive" className="label mb-0">
            즉시 사용 가능하도록 활성화
          </label>
        </div>

        <button type="submit" className="btn-primary w-full">
          쿠폰 등록
        </button>
      </form>
    </div>
  );
}
