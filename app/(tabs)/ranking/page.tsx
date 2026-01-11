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
  const currentMonth = today.toISOString().slice(0, 7); // ex: 2025-12
  const minMonth = "2025-11";

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

  // ❌ 게스트는 랭킹에서 제외
  if (data.guest === true) return;

  if (!counts[data.userId]) {
    counts[data.userId] = 1;
  } else {
    counts[data.userId] += 1;
  }
});


      const list = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setRanking(list);
    } catch (err) {
      console.error(err);
    }
  }

  /** 🟨 공동 등수 계산 (공동 1등 다음은 2등) */
function getRank(index: number) {
  const currCount = ranking[index].count;

  // 나보다 점수가 높은 "서로 다른 점수" 개수 세기
  const higherCounts = new Set(
    ranking
      .slice(0, index)
      .map((item) => item.count)
      .filter((count) => count > currCount)
  );

  return higherCounts.size + 1;
}


  /** 🏅 메달 표시 */
  const medal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🏸";
  };

  /** 🟦 배경색 */
  const bgColor = (rank: number) => {
  if (rank === 1)
    return `
      bg-yellow-100
      border
      border-yellow-300
      shadow-md
      shadow-yellow-200/70
    `;


 if (rank === 2)
  return `
    bg-[#EEF2F7]
    border border-[#CBD5E1]
    shadow-sm
  `;
if (rank === 3)
  return `
    bg-[#FFE8D6]
    border border-[#F3B99B]
  `;
 
   if (rank === 4)
    return `
      bg-[#F7F8F4]
      border border-[#E2E6D8]
    `;

  // ➖ 5위 (4위보다 아주 살짝 연함)
  if (rank === 5)
    return `
      bg-[#FAFBF8]
      border border-[#E6EBDF]
    `;

  // ➖➖ 6위 이상 (거의 같은데 더 연함)
  return `
    bg-[#FDFEFC]
    border border-[#EBEFE5]
  `;
};



  /** 🔥 달 변경 함수 */
  function changeMonth(offset: number) {
    const [y, m] = month.split("-").map(Number);

    let newY = y;
    let newM = m + offset;

    if (newM === 0) {
      newM = 12;
      newY -= 1;
    }
    if (newM === 13) {
      newM = 1;
      newY += 1;
    }

    const newMonth = `${newY}-${String(newM).padStart(2, "0")}`;

    if (newMonth < minMonth) return;
    if (newMonth > currentMonth) return;

    setMonth(newMonth);
  }

  return (
  <main className="p-4 pb-20 bg-gradient-to-br from-[#FFF7D6] to-[#FFEFAA] min-h-screen">
    <div className="max-w-2xl mx-auto">

      {/* 🏆 노란 배경 위 헤더 */}
      <div className="mb-4 px-2">
        <h1 className="text-2xl font-bold text-yellow-700 mb-1 pl-3">
             넷플레이 월간 참석 랭킹 🏆
        </h1>
        <p className="text-sm text-gray-800 opacity-80 pl-3">
          랭킹 1위에게는 소소한 혜택이 제공될 예정입니다 🙂
        </p>
      </div>

      {/* ⬇️ 흰 카드 시작 */}
      <div className="bg-white rounded-2xl shadow p-6">
        

        {/* 🔥 달 이동 버튼 */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => changeMonth(-1)}
            disabled={month === minMonth}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-40"
          >
            ◀ 이전달
          </button>

          <h1 className="text-xl font-bold text-yellow-600">{month}</h1>

          <button
            onClick={() => changeMonth(1)}
            disabled={month === currentMonth}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-40"
          >
            다음달 ▶
          </button>
        </div>

        {/* 랭킹없는 경우 */}
        {ranking.length === 0 && (
          <p className="text-center text-gray-500 mt-4">출석 데이터가 없습니다.</p>
        )}

        {/* 🔥 랭킹 목록 */}
        <div className="space-y-3 mt-4">
          {ranking.map((item, idx) => {
            const rank = getRank(idx);

            return (
              <div
                key={idx}
                className={`flex justify-between items-center p-4 rounded-xl border ${bgColor(rank)}`}
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

            </div> {/* 흰 카드 끝 */}
            </div>   {/* max-w-2xl */}
    </main>
  );
}


