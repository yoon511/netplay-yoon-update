"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";

export default function TabsBar() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const query = params.toString();

  return (
    <nav className="h-16 bg-white border-t flex justify-around items-center fixed bottom-0 left-0 w-full shadow-md">

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
  );
}
