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

  useEffect(() => {
    loadRanking();
  }, []);

  /** 🔥 월간 랭킹 불러오기 (participationLogs 기반) */
  async function loadRanking() {
    try {
      const q = query(
        collection(db, "participationLogs"),
        where("date", ">=", `${monthKey}-01`),
        where("date", "<=", `${monthKey}-31`)
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

  /** 🟨 배경색 설정 */
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
          🏆 월간 랭킹 ({monthKey}) 🏆
        </h1>

        {ranking.length === 0 && (
          <p className="text-center text-gray-500">
            이번 달 출석 데이터가 없습니다.
          </p>
        )}

        <div className="space-y-3">
          {ranking.map((item, i) => (
            <div
              key={i}
              className={`flex justify-between items-center p-4 rounded-xl border ${bgColor(
                i + 1
              )}`}
            >
              {/* 왼쪽: 순위 + 메달 */}
              <div className="flex items-center gap-3 text-lg font-bold">
                <span>{medal(i + 1)}</span>
                <span>{i + 1}위</span>
              </div>

              {/* 오른쪽: 이름 + 출석 횟수 */}
              <div className="text-right">
                <div className="font-bold">{item.name}</div>
                <div className="text-sm font-semibold text-gray-700">
                  {item.count}회 출석
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
