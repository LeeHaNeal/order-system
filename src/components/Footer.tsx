export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-gray-900">
              올마켓<span className="text-accent-600">.</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              필요한 모든 것을, 합리적인 가격으로.
              <br />
              올마켓 데모 쇼핑몰입니다.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-900">고객센터</p>
            <p className="text-2xl font-bold text-gray-900">1588-0000</p>
            <p className="mt-1 text-xs text-gray-500">평일 09:00 - 18:00 (주말·공휴일 휴무)</p>
            <p className="mt-1 text-xs text-gray-500">점심시간 12:30 - 13:30</p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-900">안내</p>
            <ul className="space-y-1.5 text-sm text-gray-500">
              <li>이용약관</li>
              <li>개인정보처리방침</li>
              <li>배송/교환/환불 안내</li>
              <li>자주 묻는 질문</li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-900">회사 정보</p>
            <ul className="space-y-1 text-xs leading-relaxed text-gray-500">
              <li>(주)올마켓 데모 · 대표 홍길동</li>
              <li>서울특별시 강남구 테헤란로 123</li>
              <li>사업자등록번호 000-00-00000</li>
              <li>통신판매업신고 제2026-서울강남-0000호</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-gray-100 pt-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 올마켓. All rights reserved.</p>
          <p>이 사이트는 결제(PG) 연동 데모를 위한 mock 쇼핑몰이며, 실제 결제가 발생하지 않습니다.</p>
        </div>
      </div>
    </footer>
  );
}
