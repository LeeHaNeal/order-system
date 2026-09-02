# 결제 연동 주문 시스템 (올마켓)

Next.js 15(App Router) + PostgreSQL + Prisma로 만든 이커머스 주문 시스템입니다.
실제 PG사 결제 흐름 전체(요청 → 결제창 → 승인/실패 콜백)를 그대로 재현했고,
mock 결제 provider와 실제 토스페이먼츠 연동을 `.env` 설정 하나로 전환할 수 있도록 설계했습니다.

## 배포 (Live Demo)

**🔗 https://ohmarket-store.vercel.app**

Vercel(Next.js 앱) + Neon(Serverless PostgreSQL) 조합으로 실제 배포되어 있고,
운영 환경에서 실제 토스페이먼츠 테스트 결제까지 정상 동작을 확인했습니다.

| 역할 | 이메일 | 비밀번호 |
|---|---|---|
| 관리자 | admin@example.com | admin1234 |
| 일반회원 | user@example.com | user1234 |

로그인 → 상품 담기 → 주문/결제(토스 테스트 결제창, 임의의 카드번호로 테스트 가능) →
주문내역 확인까지 전체 흐름을 데모에서 바로 체험할 수 있습니다. 관리자 계정으로
로그인하면 상단 메뉴에 "관리자"가 나타나며, 대시보드/상품관리/주문관리를 확인할 수 있습니다.

## 주요 기능

- **상품/장바구니**: 상품 목록(검색/카테고리 필터), 상품 상세, 장바구니 담기/수량변경/삭제
- **주문/결제**: 배송정보 입력 → 주문 생성 → 결제창 → 성공/실패 콜백 → 주문 상태 반영, 재고 차감
- **회원**: 회원가입/로그인/로그아웃 (자체 구현한 서명 쿠키 세션, 외부 인증 라이브러리 없음)
- **주문내역**: 로그인한 사용자의 주문 목록/상세, 주문 취소(배송 시작 전까지)
- **관리자 페이지**: 대시보드(매출/상태별 건수/재고부족), 상품 CRUD, 주문 목록/상세, 주문 상태 변경(+재고 자동 복구)

## 기술 스택

- Next.js 15 (App Router, Server Actions, Route Handlers)
- TypeScript
- PostgreSQL + Prisma ORM (배포 환경: Neon Serverless Postgres)
- Tailwind CSS
- 인증: 자체 구현 (Node `crypto`의 scrypt로 비밀번호 해시, HMAC 서명 쿠키로 세션)
- 결제: Provider 인터페이스 기반 자체 구현 (mock PG + 실제 토스페이먼츠 연동, `src/lib/payment`)
- 배포: Vercel (GitHub 연동 자동 배포) + Neon (Serverless Postgres)

## 폴더 구조

```
prisma/
  schema.prisma        # User/Product/Cart/Order/Payment 등 데이터 모델
  migrations/          # Prisma 마이그레이션 히스토리
  seed.ts              # 관리자/테스트 계정 + 샘플 상품 시드
src/
  lib/
    db.ts              # Prisma Client 싱글턴
    session.ts         # 쿠키 세션 발급/검증, requireUser/requireAdmin
    password.ts        # 비밀번호 해시/검증
    payment/           # 결제 Provider 인터페이스 + mock/toss 구현
    validators.ts       # zod 입력 검증 스키마
  actions/             # Server Actions (auth/cart/orders/admin)
  app/
    page.tsx           # 홈(상품 목록)
    products/[id]/     # 상품 상세
    cart/               # 장바구니
    checkout/           # 주문서 작성 + 결제 성공/실패 콜백(route.ts)
    pay/mock/, pay/toss/ # 결제창 (mock 시뮬레이션 / 토스 SDK 위젯)
    orders/             # 내 주문내역
    login/, signup/     # 로그인/회원가입
    admin/               # 관리자 대시보드/상품관리/주문관리
```

## 로컬에서 실행하기

### 0. 요구사항

- Node.js 18.18 이상
- PostgreSQL (로컬 설치 또는 아래 docker-compose 사용)

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env`의 `DATABASE_URL`을 실제 PostgreSQL 접속 정보로 맞추고, `SESSION_SECRET`은
`openssl rand -hex 32` 등으로 생성한 임의의 긴 문자열로 바꿔주세요.

PostgreSQL이 로컬에 없다면 docker-compose로 바로 띄울 수 있습니다.

```bash
docker compose up -d
```

(docker-compose.yml은 `.env.example`과 동일한 계정/DB명으로 postgres:16 컨테이너를 띄웁니다.)

### 3. 데이터베이스 마이그레이션 + 시드

```bash
npx prisma migrate dev
npm run db:seed
```

시드가 끝나면 위의 관리자/일반회원 테스트 계정을 바로 사용할 수 있습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 접속해서 위 흐름대로 테스트해보세요. 기본 `PAYMENT_PROVIDER`는
`mock`이라 PG 계정 없이도 "결제 성공/실패" 버튼으로 바로 흐름을 확인할 수 있습니다.

## 결제 공통 흐름 (mock / toss 공통)

두 provider 모두 아래와 같은 동일한 흐름(요청 → 결제창 → 성공/실패 콜백 → 승인)을
따르도록 설계했습니다.

1. `/checkout`에서 주문서를 제출하면 `createOrderFromCart` 서버 액션이 `Order`(상태
   `PENDING_PAYMENT`)와 `Payment`(상태 `READY`)를 생성하고, `paymentProvider.requestPayment()`를
   호출해 `paymentKey`와 결제창 URL을 받아옵니다.
2. 사용자를 결제창(mock에서는 `/pay/mock`, 실제 PG라면 PG가 제공하는 결제창)으로 보냅니다.
3. 결제창에서 성공/실패를 선택하면, 실제 PG와 동일하게 **성공 URL** 또는 **실패 URL**로
   리다이렉트됩니다. (`/checkout/success`, `/checkout/fail` — 둘 다 Route Handler)
4. 성공 URL 핸들러는 클라이언트가 보낸 금액과 서버의 주문 금액이 일치하는지 검증한 뒤
   `paymentProvider.confirmPayment()`를 호출해 최종 승인 처리를 하고, 주문 상태를 `PAID`로
   바꾸며 재고를 차감합니다. 실패 URL 핸들러는 별도 승인 호출 없이 바로 `FAILED` 처리합니다.
5. 이후 관리자가 `/admin/orders`에서 `PREPARING → SHIPPING → DELIVERED` 등으로 상태를
   갱신합니다. `CANCELLED`로 변경하면 결제완료 이후였던 경우 재고를 자동으로 복구합니다.

## 실제 PG(토스페이먼츠) 연동

`PaymentProvider` 인터페이스(`src/lib/payment/types.ts`) 뒤에 `MockPaymentProvider`와
`TossPaymentProvider`(`src/lib/payment/tossProvider.ts`) 둘 다 구현되어 있고,
`.env`(또는 배포 환경변수)의 `PAYMENT_PROVIDER` 값으로 전환합니다. 나머지 코드(서버 액션,
콜백 라우트)는 provider가 뭐든 동일하게 동작합니다. 위 데모 사이트는 실제로 `toss` 모드로
배포되어 토스페이먼츠 테스트 결제창까지 정상 동작을 확인했습니다.

- **mock** (`PAYMENT_PROVIDER="mock"`, 로컬 기본값): `/pay/mock`이 결제창을 흉내내고,
  "성공/실패" 버튼으로 직접 시뮬레이션합니다. PG 계정 없이 전체 흐름을 테스트할 때 사용합니다.
- **toss** (`PAYMENT_PROVIDER="toss"`): 실제 토스페이먼츠 결제창(테스트 모드)으로 이동합니다.
  1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com)에서 "API 개별 연동
     키"(일반결제) 섹션의 테스트 클라이언트 키(`test_ck_...`)/시크릿 키(`test_sk_...`)를
     발급받아 `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`에 넣습니다.
  2. `PAYMENT_PROVIDER`를 `"toss"`로 바꿉니다.
  3. 결제를 진행하면 실제 토스 결제창(테스트 모드)으로 이동합니다. 테스트 카드번호는 토스
     개발자센터 문서를 참고하세요(임의의 카드번호로 테스트 가능하며 실제 승인/청구는 발생하지 않습니다).

동작 방식: `TossPaymentProvider.requestPayment()`는 (mock과 달리) 진짜 결제창을 직접 열
수 없습니다 — 토스는 브라우저의 위젯 SDK가 결제창을 띄우는 구조라서, 대신 사용자를
중간 페이지 `/pay/toss`로 보내고, 그 페이지의 클라이언트 컴포넌트
(`TossCheckoutLauncher`)가 토스 SDK를 불러와 실제 결제창을 띄웁니다. 결제가 끝나면
토스가 `successUrl`/`failUrl`(`/checkout/success`, `/checkout/fail`)로 리다이렉트하고,
`successUrl` 핸들러가 토스 서버의 `POST /v1/payments/confirm`을 `TOSS_SECRET_KEY`로
Basic 인증 호출해 최종 승인 처리를 합니다.

## 배포 방법 (Vercel + Neon)

1. GitHub 저장소를 Vercel에 Import
2. Vercel Storage(Marketplace)에서 Neon Postgres 생성 (Auth 기능은 사용하지 않으므로 꺼도 됨)
3. Neon이 제공하는 연결 문자열을 Vercel 프로젝트 환경변수에 등록
   - `DATABASE_URL`: pooled 연결 문자열 (`-pooler` 포함, pgbouncer 경유)
   - `DIRECT_URL`: unpooled 연결 문자열 (마이그레이션 전용, Prisma `directUrl`)
   - `SESSION_SECRET`, `PAYMENT_PROVIDER`, (toss 사용 시) `TOSS_CLIENT_KEY`/`TOSS_SECRET_KEY`
4. 로컬(또는 CI)에서 프로덕션 DB를 대상으로 마이그레이션 + 시드 실행
   ```bash
   DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy
   DATABASE_URL="..." npx tsx prisma/seed.ts
   ```
5. Vercel에서 Deploy/Redeploy

## 알려진 제한사항 (데모 단순화 지점)

- 재고는 "주문 생성 시점"이 아니라 "결제 승인 시점"에 차감합니다. 트래픽이 많은
  서비스라면 주문 생성 시 재고를 임시로 잡아두는(hold) 로직이 필요합니다.
- 동시 주문에 대한 재고 차감 동시성 제어(비관적 락 등)는 구현하지 않았습니다.
- 상품 이미지는 업로드가 아니라 URL 입력 방식입니다.
- 목록 페이지에 커서/오프셋 페이지네이션이 없습니다(관리자 주문 목록은 최근 100건만 표시).
- 비밀번호 재설정, 이메일 인증 등은 포함되어 있지 않습니다.
