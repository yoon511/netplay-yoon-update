import "./globals.css";
import { Suspense } from "react";
import BottomNav from "./components/BottomNav";

export const metadata = {
  title: "Netplay Badminton",
  description: "네트플레이 배드민턴 출석 · 투표 · 랭킹 시스템",
  openGraph: {
    title: "Netplay Badminton",
    description: "출석 · 투표 · 랭킹 자동화 시스템",
    url: "https://netplay-yoon-update.vercel.app/",
    siteName: "Netplay Badminton",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-[#fdfbf6]">
        <div className="flex-1 w-full max-w-3xl mx-auto">
          {children}
        </div>

        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
