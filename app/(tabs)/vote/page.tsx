"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/firebase";

import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  orderBy,
  query,
} from "firebase/firestore";

type Poll = {
  id: string;
  title?: string;
  date: string;
  time: string;
  location: string;
  feeNormal: number;
  feeGuest: number;
  capacity: number;
  participants?: string[];
  waitlist?: string[];
};

export default function VoteHome() {
  const router = useRouter();
  const params = useSearchParams();

  // 로그인 정보 (쿼리스트링에서 가져오기)
  const user = {
    name: params.get("name") ?? "",
    grade: params.get("grade") ?? "",
    gender: params.get("gender") ?? "",
    guest: params.get("guest") === "true",
    pin: params.get("pin") ?? "",
  };
  const isAdmin = params.get("admin") === "true";

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  // 투표 목록 불러오기
  async function loadPolls() {
    const q = query(collection(db, "polls"), orderBy("date", "asc"));
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as Poll[];
    setPolls(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPolls();
  }, []);

  

  // 상세 페이지 이동 (로그인 정보 유지)
  function goDetail(pollId: string) {
    const query = new URLSearchParams({
      name: user.name,
      grade: user.grade,
      gender: user.gender,
      guest: String(user.guest),
      pin: user.pin,
      admin: String(isAdmin),
    }).toString();

    router.push(`/vote/${pollId}?${query}`);
  }

  if (loading) return <div className="p-4">불러오는 중...</div>;

  return (
    <main className="p-4 pb-20 min-h-screen bg-[#FFF8F0]">
      <div className="max-w-xl mx-auto">

        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          🗳️ Netplay 참석 투표
        </h1>

       
{isAdmin && (
  <button
    className="w-full py-3 bg-red-400 text-white rounded-xl mb-4 font-bold"
    onClick={() => {
      const query = new URLSearchParams({
        name: user.name,
        grade: user.grade,
        gender: user.gender,
        guest: String(user.guest),
        pin: user.pin,
        admin: String(isAdmin),
      }).toString();
      
      router.push(`/vote/new?${query}`);
    }}
  >
    ➕ 새로운 모임 투표 만들기
  </button>
)}




        {polls.length === 0 && (
          <div className="text-center text-gray-500">
            생성된 투표가 없습니다.
          </div>
        )}

        {polls.map((p) => (
          <button
            key={p.id}
            onClick={() => goDetail(p.id)}
            className="w-full text-left p-4 bg-white rounded-xl shadow mb-3 border"
          >
            <div className="font-bold text-lg">
              {p.title || `${p.date} 모임`}
            </div>
            <div className="text-sm text-gray-700 mt-1">
              📅 {p.date} · 🕒 {p.time}
            </div>
            <div className="text-sm text-gray-700">
              📍 {p.location}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              정원 {p.capacity}명 / 현재 {p.participants?.length ?? 0}명 참석
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
