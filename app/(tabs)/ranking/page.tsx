"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";

type RankItem = {
  name: string;
  count: number;
};

export default function RankingPage() {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
  const minMonth = "2025-11"; // 🔥 이전달은 여기보다 작아지면 안됨

  const [month, setMonth] = useState(currentMonth);
  const [ranking, setRanking] = useState<RankItem[]>([]);

  useEffect(() => {
    loadRanking(month);
  }, [month]);

  /** 🔥 월간 랭킹 불러오기 */
  async function loadRanking(targetMonth: string) {
    try {
      const q = query(
        collection(db, "participationLogs"),
        where("date", ">=", `${targetMonth}-01`),
        where("date", "<=", `${targetMonth}-31`)
      );

      const snap = await getDocs(q);

      const counts: Record<string, number> = {};

      snap.forEach((doc) => {
        const data = doc.data();
        if (!counts[data.userId]) counts[data.userId] = 1;
        else counts[data.userId] += 1;
      });

      const list = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setRanking(list);
    } catch (err) {
      console.error(err);
    }
  }

  /** 🏅 메달 표시 */
  const medal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🎾";
  };

  /** 🟨 공동 등수 계산 */
  function getRank(index: number) {
    if (index === 0) return 1;
    if (ranking[index].count === ranking[index - 1].count)
      return getRank(index - 1);
    return index + 1;
  }

  /** 🟦 배경색 */
  const bgColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-200 border-yellow-400";
    if (rank === 2) return "bg-gray-200 border-gray-400";
    if (rank === 3) return "bg-orange-200 border-orange-400";
    return "bg-gray-100 border-gray-300";
  };

  /** 🔥 월 이동 함수 */
  function moveMonth(offset: number) {
    const [y, m] = month.split("-").map(Number);
    const newDate = new Date(y, m - 1 + offset, 1);
    const newMonth = newDate.toISOString().slice(0, 7);

    // 🔥 미래 금지
    if (newMonth > currentMonth) return;

    // 🔥 2025-11 이전 금지
    if (newMonth < minMonth) return;

    setMonth(newMonth);
  }

  return (
    <main className="p-4 pb-20 bg-gradient-to-br from-[#FFF7D6] to-[#FFEFAA] min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* 🔹 이전달 / 다음달 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => moveMonth(-1)}
            disabled={month === minMonth}
            className={`px-4 py-2 rounded-lg font-semibold ${
              month === minMonth
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            ◀ 이전달
          </button>

          <h1 className="text-3xl font-bold text-center text-yellow-600">
            {month} 월간 랭킹
          </h1>

          <button
            onClick={() => moveMonth(1)}
            disabled={month === currentMonth}
            className={`px-4 py-2 rounded-lg font-semibold ${
              month === currentMonth
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            다음달 ▶
          </button>
        </div>

        {/* 랭킹 없음 안내 */}
        {ranking.length === 0 && (
          <p className="text-center text-gray-500 mb-4">
            이 달의 출석 데이터가 없습니다.
          </p>
        )}

        {/* 랭킹 리스트 */}
        <div className="space-y-3">
          {ranking.map((item, idx) => {
            const rank = getRank(idx);

            return (
              <div
                key={idx}
                className={`flex justify-between items-center p-4 rounded-xl border ${bgColor(
                  rank
                )}`}
              >
                <div className="flex items-center gap-3 text-xl font-bold">
                  <span>{medal(rank)}</span>
                  <span>{rank}위</span>
                  <span className="ml-3">{item.name}</span>
                </div>

                <div className="text-right text-lg font-semibold text-gray-700">
                  {item.count}회 출석
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
