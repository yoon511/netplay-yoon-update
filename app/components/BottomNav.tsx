"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const params = useSearchParams();
  
  const query = params.toString(); // 사용자 정보 유지

  if (!query) return null;

  return (
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
  );
}

