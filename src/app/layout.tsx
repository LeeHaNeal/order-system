import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "올마켓 - 결제 연동 주문 시스템 데모",
  description: "상품 주문과 결제(mock)를 처리하는 데모 쇼핑몰입니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 실제 국내 서비스에서 가장 널리 쓰이는 한글 웹폰트(Pretendard) */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        <Header />
        <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
