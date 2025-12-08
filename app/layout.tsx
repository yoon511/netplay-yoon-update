"use client";

import "./globals.css";
import { Suspense } from "react";
import BottomNav from "./components/BottomNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-[#fdfbf6]">
        {/* 페이지 전체 래퍼 */}
        <div className="flex-1 w-full max-w-3xl mx-auto">
          {children}
        </div>

        {/* 🔥 하단 고정 탭 네비게이션 */}
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
