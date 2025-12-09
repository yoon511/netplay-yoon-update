"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";

type RankItem = {
  name: string;
  count: number;
};

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankItem[]>([]);

  useEffect(() => {
    loadRanking();
  }, []);

  /** 🔥 participationLogs 기반 월간 랭킹 */
  async function loadRanking() {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const start = `${month}-01`;
    const end = `${month}-31`;

    const q = query(
      collection(db, "participationLogs"),
      where("date", ">=", start),
      where("date", "<=", end)
    );

    const snap = await getDocs(q);

    const counts: Record<string, number> = {};

    snap.forEach((doc) => {
      const d = doc.data();
      const name = d.userId;
      counts[name] = (counts[name] || 0) + 1;
    });

    const list = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setRanking(list);
  }

  const medal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🎾";
  };

  const monthKey = new Date().toISOString().slice(0, 7);

  return (
    <main className="p-4 pb-20 bg-gradient-to-br from-[#FFF7D6] to-[#FFEFAA] min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-600">
          🏆 월간 랭킹 ({monthKey}) 🏆
        </h1>

        {ranking.length === 0 && (
          <p className="text-center text-gray-500">이번 달 출석 데이터가 없습니다.</p>
        )}

        <div className="space-y-3">
          {ranking.map((item, i) => (
            <div
              key={i}
              className={`
                flex justify-between items-center p-4 rounded-xl border
                ${i === 0 ? "bg-yellow-200 border-yellow-400" : ""}
                ${i === 1 ? "bg-gray-200 border-gray-400" : ""}
                ${i === 2 ? "bg-orange-200 border-orange-400" : ""}
                ${i > 2 ? "bg-gray-100 border-gray-300" : ""}
              `}
            >
              <div className="flex items-center gap-3 text-lg font-bold">
                <span>{medal(i + 1)}</span>
                <span>{i + 1}위</span>
              </div>

              <div className="text-right">
                <div className="font-bold">{item.name}</div>
                <div className="text-sm font-semibold">{item.count}회 출석</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
