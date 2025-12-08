"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function MenuPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const name = params.get("name") ?? "";
  const grade = params.get("grade") ?? "";
  const gender = params.get("gender") ?? "";
  const guest = params.get("guest") ?? "";
  const pin = params.get("pin") ?? "";
  const admin = params.get("admin") ?? "";

  const userQuery = `name=${name}&grade=${grade}&gender=${gender}&guest=${guest}&pin=${pin}&admin=${admin}`;

  return (
    <main className="flex justify-center items-center min-h-screen bg-[#fdfbf6] p-6">
      <div className="w-full max-w-sm font-sans text-center">

        <h1 className="text-xl font-bold mb-8 text-red-400">
          Netplay 메뉴 🏸
        </h1>

        {/* 참석 투표 */}
        <button
          className="w-full bg-red-300 hover:bg-red-400 text-white py-3 rounded-2xl mb-4 text-lg"
          onClick={() => router.push(`/vote?${userQuery}`)}
        >
          🗳️넷플레이 참석 투표🗳️
        </button>

        {/* 게임판 */}
        <button
          className="w-full bg-blue-300 hover:bg-blue-400 text-white py-3 rounded-2xl mb-4 text-lg"
          onClick={() => router.push(`/board?${userQuery}`)}
        >
          🏸넷플레이 게임판🏸
        </button>

        {/* 월간 랭킹 — 파스텔 노랑으로 변경 */}
        <button
          className="w-full bg-[#FFF1A8] hover:bg-[#FFE98A] text-[#8A6D00] py-3 rounded-2xl mb-4 text-lg font-semibold"
          onClick={() => router.push(`/ranking?${userQuery}`)}
        >
          🏆월간 랭킹🏆
        </button>

      </div>
    </main>
  );
}

