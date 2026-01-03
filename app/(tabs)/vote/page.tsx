"use client";

export const dynamic = "force-dynamic";

import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";


type Poll = {
  id: string;
  title?: string;
  date: string;
  time: string;
  location: string;
  fee: string;
  capacity: number;
  participants: any[];
  waitlist: any[];
};

function VoteListContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const user = {
    name: params.get("name") ?? "",
    grade: params.get("grade") ?? "",
    gender: params.get("gender") ?? "",
    guest: params.get("guest") === "true",
    pin: params.get("pin") ?? "",
  };

  const isAdmin = params.get("admin") === "true";

  const userQuery = new URLSearchParams({
    name: user.name,
    grade: user.grade,
    gender: user.gender,
    guest: String(user.guest),
    pin: user.pin,
    admin: String(isAdmin),
  }).toString();

  useEffect(() => {
    async function loadPolls() {
      try {
        const snap = await getDocs(collection(db, "polls"));
        const pollsList = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Poll[];
        
        // 모임 날짜 기준으로 정렬 (가까운 날짜가 위로)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        pollsList.sort((a, b) => {
          // 날짜 문자열을 Date 객체로 변환
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          
          // 날짜가 유효하지 않으면 맨 아래로
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          // 오늘 날짜와의 차이 계산
          const diffA = Math.abs(dateA.getTime() - today.getTime());
          const diffB = Math.abs(dateB.getTime() - today.getTime());
          
          // 가까운 날짜가 위로 오도록 정렬
          return diffA - diffB;
        });
        
        setPolls(pollsList);
      } catch (error) {
        console.error("투표 목록 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPolls();
  }, []);

  if (loading) {
    return (
      <main className="p-4 bg-[#FFF8F0] min-h-screen flex items-center justify-center">
        <div className="text-center">불러오는 중…</div>
      </main>
    );
  }

  return (
    <main className="p-4 pb-20 bg-[#FFF8F0] min-h-screen">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          넷플레이 참석 투표 목록 🗳️
        </h1>

        {isAdmin && (
          <Link href={`/vote/new?${userQuery}`}>
            <button className="w-full bg-red-500 text-white py-3 rounded-xl font-bold mb-4">
              ➕ 새 투표 만들기
            </button>
          </Link>
        )}

        {polls.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-gray-500">등록된 투표가 없습니다.</p>
            {isAdmin && (
              <Link href={`/vote/new?${userQuery}`}>
                <button className="mt-4 bg-red-500 text-white py-2 px-4 rounded-xl">
                  첫 투표 만들기
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((poll) => {
              const participants = poll.participants || [];
              const waitlist = poll.waitlist || [];
              const total = participants.length + waitlist.length;

              return (
                <Link
                  key={poll.id}
                  href={`/vote/${poll.id}?${userQuery}`}
                  className="block"
                >
                  <div className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-bold text-red-500">
                        {poll.title || `${poll.date} 넷플레이 모임`}
                      </h2>
                      <span className="text-sm text-gray-500">
                        {participants.length}/{poll.capacity}명
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📅 {poll.date}</p>
                      <p>🕒 {poll.time}</p>
                      <p>📍 {poll.location}</p>
                      {poll.fee && <p>💰 {poll.fee}</p>}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 bg-red-100 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-600">참석</div>
                        <div className="font-bold text-red-600">
                          {participants.length}명
                        </div>
                      </div>
                      {waitlist.length > 0 && (
                        <div className="flex-1 bg-yellow-100 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-600">대기</div>
                          <div className="font-bold text-yellow-600">
                            {waitlist.length}명
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
                <div className="mt-8">
         
           
<Link
  href={`/calendar?${userQuery}`}
  className="
    w-full mt-6
    flex items-center justify-center gap-2
    rounded-2xl
    bg-[#E8F6F1]
    py-4
    text-lg font-semibold text-[#2F4F4F]
    shadow-sm
    hover:bg-[#DDF2EA]
    transition
  "
>
  <MapPinIcon className="w-6 h-6 text-[#3CB371]" />
  지난 모임 기록 캘린더
</Link>




         
        </div>

      </div>
    </main>
  );
}

export default function VoteListPage() {
  return (
    <Suspense fallback={<div className="p-4 bg-[#FFF8F0] min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <VoteListContent />
    </Suspense>
  );
}

