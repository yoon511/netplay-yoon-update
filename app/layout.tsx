"use client";

import "./globals.css";
import { useSearchParams, useRouter } from "next/navigation";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const params = useSearchParams();
  
  const query = params.toString(); // 사용자 정보 유지

  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-[#fdfbf6]">
        
        {/* 페이지 본문 */}
        <div className="flex-1 w-full max-w-3xl mx-auto">
          {children}
        </div>

        {/* 🔥 하단 고정 탭 네비게이션 */}
        {query && (
          <div className="h-16 bg-white border-t flex text-center">

            <button
              className="flex-1 text-gray-700 font-bold"
              onClick={() => router.push(`/vote?${query}`)}
            >
              투표
            </button>

            <button
              className="flex-1 text-gray-700 font-bold"
              onClick={() => router.push(`/board?${query}`)}
            >
              게임판
            </button>

            <button
              className="flex-1 text-gray-700 font-bold"
              onClick={() => router.push(`/ranking?${query}`)}
            >
              랭킹
            </button>
          </div>
        )}
      </body>
    </html>
  );
}
