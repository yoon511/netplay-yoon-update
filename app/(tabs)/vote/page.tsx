"use client";

export const dynamic = "force-dynamic";

import { db } from "@/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
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
   
async function handleApproveWaiter(poll: Poll) {
  if (!isAdmin) return;

  const ref = doc(db, "polls", poll.id);

  try {
    let promotedPerson: any = null;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("투표 문서가 없습니다.");

      const data = snap.data() as any;
      const participants = data.participants || [];
      const waitlist = data.waitlist || [];
      const capacity = data.capacity || 0;

      if (participants.length >= capacity) {
        throw new Error("정원이 이미 가득 찼습니다.");
      }
      if (waitlist.length === 0) {
        throw new Error("대기자가 없습니다.");
      }

      promotedPerson = waitlist[0];

      tx.update(ref, {
        participants: [...participants, promotedPerson],
        waitlist: waitlist.slice(1),
      });
    });

    // ✅ 여기서 바로 화면 상태 업데이트
    setPolls((prev) =>
      prev.map((p) =>
        p.id === poll.id
          ? {
              ...p,
              participants: [...p.participants, promotedPerson],
              waitlist: p.waitlist.slice(1),
            }
          : p
      )
    );

  } catch (err: any) {
    alert(err?.message || "승인 처리 중 오류가 발생했습니다.");
  }
}

async function handleRejectWaiter(poll: Poll) {
  if (!isAdmin) return;

  const ref = doc(db, "polls", poll.id);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("투표 문서가 없습니다.");

      const data = snap.data() as any;
      const waitlist = data.waitlist || [];

      if (waitlist.length === 0) {
        throw new Error("대기자가 없습니다.");
      }

      const rejected = waitlist[0];
      const name =
        typeof rejected === "string"
          ? rejected.split(":")[0]
          : rejected.name;

      const ok = confirm(`"${name}" 님을 대기에서 제거할까요?`);
      if (!ok) return;

      tx.update(ref, {
        waitlist: waitlist.slice(1),
      });
    });

    // ✅ 화면 즉시 반영
    setPolls((prev) =>
      prev.map((p) =>
        p.id === poll.id
          ? { ...p, waitlist: p.waitlist.slice(1) }
          : p
      )
    );
  } catch (err: any) {
    alert(err?.message || "거절 처리 중 오류가 발생했습니다.");
  }
}




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
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => {
            const participants = poll.participants || [];
            const waitlist = poll.waitlist || [];

            const canApprove =
              isAdmin &&
              waitlist.length > 0 &&
              participants.length < poll.capacity;

            const nextWaiterName =
              waitlist.length > 0
                ? typeof waitlist[0] === "string"
                  ? waitlist[0].split(":")[0]
                  : waitlist[0].name
                : "";

            return (
              <div
                key={poll.id}
                className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-shadow"
              >
                {/* ✅ 카드 정보만 링크 */}
                <Link href={`/vote/${poll.id}?${userQuery}`} className="block">
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
                </Link>

                {/* ✅ 관리자 승인 버튼: Link 밖 + 조건일 때만 보이기 */}
                {canApprove && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-sm mb-2 text-gray-700">
                      🕒 대기 1번: <b>{nextWaiterName}</b>
                    </p>

                    <div className="flex gap-2">
  <button
    onClick={() => handleApproveWaiter(poll)}
    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-bold"
  >
    ✔ 참석 승인
  </button>

  <button
    onClick={() => handleRejectWaiter(poll)}
    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-xl font-bold"
  >
    ✖ 거절
  </button>
</div>

                  </div>
                )}
              </div>
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




         
       

  ;
}

export default function VoteListPage() {
  return (
    <Suspense fallback={<div className="p-4 bg-[#FFF8F0] min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <VoteListContent />
    </Suspense>
  );
}

