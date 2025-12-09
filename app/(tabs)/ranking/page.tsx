"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";

type RankItem = {
  name: string;
  count: number;
};

export default function RankingPage() {
  // 오늘 기준
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // 🔥 최소 허용 월 (여기 수정하면 한계 변경 가능)
  const minYear = 2025;
  const minMonth = 11;

  // 현재 페이지 기본 상태: 이번 달
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const [ranking, setRanking] = useState<RankItem[]>([]);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    loadRanking();
  }, [year, month]);

  /** 🔥 월간 랭킹 불러오기 */
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
        const d = doc.data();
        if (!counts[d.userId]) counts[d.userId] = 1;
        else counts[d.userId] += 1;
      });

      const list = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setRanking(list);
    } catch (err) {
      console.error(err);
    }
  }

  /** ◀ 이전달 */
  function prevMonth() {
    // 🔥 최소 월 도달하면 더 못 내려감
    if (year === minYear && month === minMonth) return;

    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }

  /** ▶ 다음달 (현재 달까지만 가능) */
  function nextMonth() {
    // 🔥 현재 달보다 미래는 불가
    if (year > currentYear) return;
    if (year === currentYear && month >= currentMonth) return;

    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }

  /** 메달 */
  const medal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🎾";
  };

  /** 배경색 */
  const bgColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-200 border-yellow-400";
    if (rank === 2) return "bg-gray-200 border-gray-400";
    if (rank === 3) return "bg-orange-200 border-orange-400";
    return "bg-gray-100 border-gray-300";
  };

  return (
    <main className="p-4 pb-20 bg-gradient-to-br from-[#FFF7D6] to-[#FFEFAA] min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* 🔥 월 이동 버튼 */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className={`px-4 py-2 rounded-xl font-bold ${
              year === minYear && month === minMonth
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200"
            }`}
            disabled={year === minYear && month === minMonth}
          >
            ◀ 이전달
          </button>

          <div className="text-xl font-extrabold text-yellow-700">
            {year}년 {month}월
          </div>

          <button
            onClick={nextMonth}
            className={`px-4 py-2 rounded-xl font-bold ${
              year === currentYear && month >= currentMonth
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200"
            }`}
            disabled={year === currentYear && month >= currentMonth}
          >
            다음달 ▶
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-600">
          🏆 월간 랭킹 🏆
        </h1>

        {ranking.length === 0 && (
          <p className="text-center text-gray-500">출석 데이터가 없습니다.</p>
        )}

        <div className="space-y-3">
          {ranking.map((item, i) => (
            <div
              key={i}
              className={`flex justify-between items-center p-4 rounded-xl border ${bgColor(
                i + 1
              )}`}
            >
              {/* 왼쪽: 순위 + 메달 + 이름 */}
              <div className="flex items-center gap-3 text-lg font-bold">
                <span>{medal(i + 1)}</span>
                <span>{i + 1}위</span>
                <span>{item.name}</span>
              </div>

              {/* 오른쪽: 출석 횟수 */}
              <div className="text-right text-sm font-semibold text-gray-700">
                {item.count}회 출석
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
