"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";

type RankItem = {
  name: string;
  count: number;
};

export default function RankingPage() {
  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [month, setMonth] = useState(monthKey);

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

    const prev = ranking[index - 1];
    const curr = ranking[index];

    // 이전사람과 count 같으면 동일 등수
    if (prev.count === curr.count) {
      return getRank(index - 1);
    }

    // 다르면 index + 1이 등수
    return index + 1;
  }

  /** 🟦 배경색 설정 */
  const bgColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-200 border-yellow-400";
    if (rank === 2) return "bg-gray-200 border-gray-400";
    if (rank === 3) return "bg-orange-200 border-orange-400";
    return "bg-gray-100 border-gray-300";
  };

  return (
    <main className="p-4 pb-20 bg-gradient-to-br from-[#FFF7D6] to-[#FFEFAA] min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">

        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-600">
          🏆 월간 랭킹 ({month}) 🏆
        </h1>

        {/* 🔹 랭킹 없음 안내 */}
        {ranking.length === 0 && (
          <p className="text-center text-gray-500">
            이번 달 출석 데이터가 없습니다.
          </p>
        )}

        {/* 🔹 랭킹 목록 */}
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
                {/* 왼쪽: 등수 + 메달 + 이름 */}
                <div className="flex items-center gap-3 text-xl font-bold">
                  <span>{medal(rank)}</span>
                  <span>{rank}위</span>
                  <span className="ml-3">{item.name}</span>
                </div>

                {/* 오른쪽: 출석 횟수 */}
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
