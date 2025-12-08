"use client";
export const dynamic = "force-dynamic";


import { useSearchParams, usePathname, useRouter } from "next/navigation";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const pathname = usePathname();   // ← ★ 이게 없어서 오류났던 것!
  const router = useRouter();

  const query = params.toString();

  return (
    <div className="pb-20 min-h-screen">
      {children}

      {/* 하단 탭바 */}
      <nav className="h-16 bg-white border-t flex justify-around items-center fixed bottom-0 left-0 w-full shadow-md">

        {/* 투표 */}
        <button
          onClick={() => router.push(`/vote?${query}`)}
          className={`flex-1 py-2 rounded-xl mx-1 ${
            pathname.startsWith("/vote")
              ? "bg-red-300 text-white font-bold"
              : "bg-red-100 text-red-500"
          }`}
        >
          🗳️투표🗳️
        </button>

        {/* 게임판 */}
        <button
          onClick={() => router.push(`/board?${query}`)}
          className={`flex-1 py-2 rounded-xl mx-1 ${
            pathname.startsWith("/board")
              ? "bg-blue-300 text-white font-bold"
              : "bg-blue-100 text-blue-500"
          }`}
        >
          🏸게임판🏸
        </button>

        {/* 랭킹 */}
        <button
          onClick={() => router.push(`/ranking?${query}`)}
          className={`flex-1 py-2 rounded-xl mx-1 ${
            pathname.startsWith("/ranking")
              ? "bg-yellow-300 text-white font-bold"
              : "bg-yellow-100 text-yellow-600"
          }`}
        >
          🏆랭킹🏆
        </button>

      </nav>
    </div>
  );
}
