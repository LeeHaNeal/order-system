import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // 실제 쇼핑몰들이 많이 쓰는 무채색 톤(블랙 계열)의 포인트 컬러.
        // 버튼/링크/활성 탭 등에 사용하고, 가격은 별도로 accent(레드)를 씁니다.
        brand: {
          50: "#f5f5f5",
          100: "#e9e9ea",
          200: "#d3d3d5",
          300: "#a8a8ac",
          400: "#6f6f76",
          500: "#3f3f46",
          600: "#1c1c1f",
          700: "#141416",
          800: "#0d0d0f",
          900: "#000000",
        },
        accent: {
          50: "#fff1f0",
          100: "#ffe1de",
          400: "#ff5c4d",
          500: "#f8372a",
          600: "#e0211c",
          700: "#b8181a",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
