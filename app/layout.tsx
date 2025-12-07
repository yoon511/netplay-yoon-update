import "./globals.css";

export const metadata = {
  title: "Netplay 참석 투표 - 윤 🏸",
  description: "배드민턴 Netplay 참석 투표 페이지",
  openGraph: {
    title: "Netplay 참석 투표 - 윤 🏸",
    description: "배드민턴 모임 참석 투표 시스템",
    url: "https://your-domain.com", // 배포 후 변경
    siteName: "Netplay 참석 투표",
    images: [
      {
        url: "/og-image.png", // 원한다면 디자인해 줄게!
        width: 1200,
        height: 630,
        alt: "Netplay 참석 투표",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
