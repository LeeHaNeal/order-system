import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

// picsum.photos는 seed 문자열마다 항상 같은 이미지를 안정적으로 반환하는
// 무료 더미 이미지 서비스입니다 (특정 unsplash 사진 ID를 하드코딩하는 것보다
// 링크가 깨질 위험이 훨씬 적어서 데모 데이터용으로 사용합니다).
function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/600/600`;
}

async function main() {
  // --- 계정 시드 ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "관리자",
      role: "ADMIN",
      passwordHash: hashPassword("admin1234"),
      cart: { create: {} },
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "홍길동",
      role: "USER",
      passwordHash: hashPassword("user1234"),
      cart: { create: {} },
    },
  });

  console.log(`계정 준비 완료: ${admin.email} / ${user.email}`);

  // --- 상품 시드 (카테고리별 3~4개, 총 26개) ---
  const products = [
    // 가전/디지털
    {
      name: "무선 이어폰 Pro",
      category: "가전/디지털",
      price: 129000,
      stock: 25,
      description: "액티브 노이즈 캔슬링을 지원하는 무선 이어폰입니다.",
      imageUrl: img("earbuds-pro"),
    },
    {
      name: "기계식 키보드",
      category: "가전/디지털",
      price: 89000,
      stock: 15,
      description: "청축 스위치를 사용한 텐키리스 기계식 키보드입니다.",
      imageUrl: img("mech-keyboard"),
    },
    {
      name: "4K 웹캠",
      category: "가전/디지털",
      price: 59000,
      stock: 12,
      description: "화상회의와 방송에 적합한 4K 해상도 웹캠입니다.",
      imageUrl: img("webcam-4k"),
    },
    {
      name: "보조배터리 20000mAh",
      category: "가전/디지털",
      price: 32000,
      stock: 40,
      description: "고속충전을 지원하는 대용량 보조배터리입니다.",
      imageUrl: img("power-bank"),
    },

    // 생활용품
    {
      name: "보온보냉 텀블러 500ml",
      category: "생활용품",
      price: 19800,
      stock: 60,
      description: "스테인리스 진공 단열로 보온/보냉이 오래 유지됩니다.",
      imageUrl: img("tumbler-500"),
    },
    {
      name: "구스다운 베개",
      category: "생활용품",
      price: 39000,
      stock: 0,
      description: "목 라인을 편안하게 잡아주는 구스다운 혼합 베개입니다.",
      imageUrl: img("goose-pillow"),
    },
    {
      name: "극세사 청소포 세트",
      category: "생활용품",
      price: 12900,
      stock: 80,
      description: "먼지와 물기를 동시에 잡아주는 극세사 청소포 30매 세트입니다.",
      imageUrl: img("cleaning-cloth"),
    },
    {
      name: "다용도 수납 정리함",
      category: "생활용품",
      price: 24500,
      stock: 30,
      description: "쌓아서 사용할 수 있는 모듈형 수납 정리함입니다.",
      imageUrl: img("storage-box"),
    },

    // 스포츠/레저
    {
      name: "프리미엄 요가매트",
      category: "스포츠/레저",
      price: 45000,
      stock: 3,
      description: "미끄럼 방지 처리된 6mm 두께의 요가매트입니다.",
      imageUrl: img("yoga-mat"),
    },
    {
      name: "캠핑 감성 랜턴",
      category: "스포츠/레저",
      price: 32000,
      stock: 18,
      description: "충전식 LED 캠핑 랜턴, 최대 12시간 사용 가능합니다.",
      imageUrl: img("camping-lantern"),
    },
    {
      name: "접이식 캠핑 테이블",
      category: "스포츠/레저",
      price: 68000,
      stock: 10,
      description: "가볍고 튼튼한 알루미늄 접이식 캠핑 테이블입니다.",
      imageUrl: img("camping-table"),
    },
    {
      name: "러닝 스포츠 양말 5족 세트",
      category: "스포츠/레저",
      price: 15900,
      stock: 50,
      description: "쿠셔닝이 강화된 러닝 전용 기능성 양말 5족 세트입니다.",
      imageUrl: img("running-socks"),
    },

    // 식품
    {
      name: "핸드드립 원두 세트",
      category: "식품",
      price: 24000,
      stock: 40,
      description: "산미와 바디감의 밸런스가 좋은 원두 3종 세트입니다.",
      imageUrl: img("coffee-beans"),
    },
    {
      name: "유기농 견과류 선물세트",
      category: "식품",
      price: 35000,
      stock: 20,
      description: "아몬드, 캐슈넛, 호두를 담은 유기농 견과류 선물세트입니다.",
      imageUrl: img("nuts-gift"),
    },
    {
      name: "제주 감귤 스낵",
      category: "식품",
      price: 8900,
      stock: 100,
      description: "제주산 감귤을 그대로 말려 만든 건조 스낵입니다.",
      imageUrl: img("citrus-snack"),
    },
    {
      name: "콜드브루 원액 4종 세트",
      category: "식품",
      price: 28000,
      stock: 25,
      description: "물이나 우유에 희석해 즐기는 콜드브루 원액 4종 세트입니다.",
      imageUrl: img("cold-brew"),
    },

    // 패션잡화
    {
      name: "핸드메이드 노트북 파우치",
      category: "패션잡화",
      price: 27500,
      stock: 22,
      description: "13-14인치 노트북에 맞는 방수 파우치입니다.",
      imageUrl: img("laptop-pouch"),
    },
    {
      name: "가죽 카드지갑",
      category: "패션잡화",
      price: 32000,
      stock: 18,
      description: "얇고 슬림한 천연가죽 카드지갑입니다.",
      imageUrl: img("card-wallet"),
    },
    {
      name: "캔버스 에코백",
      category: "패션잡화",
      price: 15000,
      stock: 45,
      description: "두꺼운 캔버스 원단으로 제작한 대용량 에코백입니다.",
      imageUrl: img("canvas-bag"),
    },
    {
      name: "니트 비니",
      category: "패션잡화",
      price: 12000,
      stock: 4,
      description: "가을·겨울용 울 혼방 니트 비니입니다.",
      imageUrl: img("knit-beanie"),
    },

    // 뷰티/헬스
    {
      name: "저자극 수분 크림",
      category: "뷰티/헬스",
      price: 26000,
      stock: 33,
      description: "민감성 피부도 사용 가능한 저자극 수분 크림입니다.",
      imageUrl: img("moisture-cream"),
    },
    {
      name: "비타민C 세럼",
      category: "뷰티/헬스",
      price: 22000,
      stock: 40,
      description: "피부 톤을 밝혀주는 고농축 비타민C 세럼입니다.",
      imageUrl: img("vitamin-serum"),
    },
    {
      name: "종합 비타민 (3개월분)",
      category: "뷰티/헬스",
      price: 18000,
      stock: 55,
      description: "하루 한 알로 챙기는 종합 비타민, 3개월 분량입니다.",
      imageUrl: img("multivitamin"),
    },

    // 홈/인테리어
    {
      name: "무드등 스탠드 조명",
      category: "홈/인테리어",
      price: 42000,
      stock: 14,
      description: "은은한 조도 조절이 가능한 우드 스탠드 무드등입니다.",
      imageUrl: img("mood-lamp"),
    },
    {
      name: "리넨 침구 세트 (퀸)",
      category: "홈/인테리어",
      price: 89000,
      stock: 8,
      description: "사계절 사용 가능한 워싱 리넨 침구 세트(퀸 사이즈)입니다.",
      imageUrl: img("linen-bedding"),
    },
    {
      name: "디퓨저 세트 (우드향)",
      category: "홈/인테리어",
      price: 29000,
      stock: 27,
      description: "은은한 우드 계열 향의 인테리어 디퓨저 세트입니다.",
      imageUrl: img("wood-diffuser"),
    },
  ];

  // name 에는 DB 유니크 제약이 없어 prisma의 upsert()를 바로 쓸 수 없으므로,
  // 이름으로 먼저 찾아서 있으면 최신 시드 데이터로 업데이트(이미지 URL 등 포함),
  // 없으면 새로 생성합니다. 이렇게 하면 `npm run db:seed`를 다시 실행해도
  // 항상 최신 더미데이터로 맞춰집니다.
  let created = 0;
  let updated = 0;
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: p });
      updated++;
    } else {
      await prisma.product.create({ data: p });
      created++;
    }
  }

  console.log(
    `상품 준비 완료: 총 ${products.length}개 (신규 ${created}개, 업데이트 ${updated}개)`
  );

  // --- 쿠폰 시드 ---
  const coupons = [
    {
      code: "WELCOME10",
      description: "신규 가입 축하 10% 할인",
      discountType: "PERCENT" as const,
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: 10000,
      isActive: true,
      expiresAt: null,
    },
    {
      code: "SUMMER5000",
      description: "5만원 이상 구매 시 5,000원 할인",
      discountType: "AMOUNT" as const,
      discountValue: 5000,
      minOrderAmount: 50000,
      maxDiscountAmount: null,
      isActive: true,
      expiresAt: null,
    },
    {
      code: "VIP20",
      description: "VIP 회원 20% 할인 (최대 3만원)",
      discountType: "PERCENT" as const,
      discountValue: 20,
      minOrderAmount: 100000,
      maxDiscountAmount: 30000,
      isActive: true,
      expiresAt: null,
    },
    {
      code: "EXPIRED2020",
      description: "기간 만료 테스트용 쿠폰",
      discountType: "AMOUNT" as const,
      discountValue: 3000,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      isActive: true,
      expiresAt: new Date("2020-01-01"),
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: c, create: c });
  }

  console.log(`쿠폰 준비 완료: 총 ${coupons.length}개 (WELCOME10 / SUMMER5000 / VIP20 / EXPIRED2020)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
