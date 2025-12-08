"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";


type RankItem = {
  name: string;
  grade: string;
  count: number;
};

export default function RankingPage() {
  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [ranking, setRanking] = useState<RankItem[]>([]);

  useEffect(() => {
    loadRanking();
  }, []);

  /** 🔥 월간 랭킹 불러오기 */
  async function loadRanking() {
    try {
      // ✔ days 컬렉션 불러오기
      const daysRef = collection(db, "attendance", monthKey, "days");
      const daysSnap = await getDocs(daysRef);

      const counts: Record<string, { grade: string; count: number }> = {};

      // 각 날짜 처리
      for (const day of daysSnap.docs) {
        // ✔ players 컬렉션 불러오기
        const playersRef = collection(
          db,
          "attendance",
          monthKey,
          "days",
          day.id,
          "players"
        );

        const peopleSnap = await getDocs(playersRef);

        peopleSnap.forEach((doc) => {
          const d = doc.data();
          if (d.guest) return; // 게스트 제외

          if (!counts[d.name]) {
            counts[d.name] = {
              grade: d.grade,
              count: 1,
            };
          } else {
            counts[d.name].count += 1;
          }
        });
      }

      // 정렬 및 배열로 변환
      const list = Object.entries(counts)
        .map(([name, data]) => ({
          name,
          grade: data.grade,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count);

      setRanking(list);
    } catch (err) {
      console.error(err);
    }
  }

  /** 메달 표시 */
  const medal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🎾";
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
                <div className="text-sm text-gray-600">{item.grade}</div>
                <div className="text-sm font-semibold">
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
