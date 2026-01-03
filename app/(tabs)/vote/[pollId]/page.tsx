"use client";

import { db } from "@/firebase";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import ModalConfirm from "../components/ModalConfirm";

type LogType =
  | "join"
  | "cancel"
  | "promote"
  | "admin_remove"
  | "admin_add";

type Poll = {
  date: string;
  time: string;
  location: string;
  fee: string;
  capacity: number;
  participants: any[];
  waitlist: any[];
  logs?: { type: LogType; name: string; time: string }[];
};

export default function VoteDetailPage() {
  const { pollId } = useParams();
  const params = useSearchParams();
  const router = useRouter();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    attend: false,
    wait: false,
    logs: false,
  });

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    date: "",
    time: "",
    location: "",
    fee: "",
    capacity: "",
  });

  const [showCancelModal, setShowCancelModal] = useState(false);

  const user = {
    name: params.get("name") ?? "",
    pin: params.get("pin") ?? "",
    grade: params.get("grade") ?? "",
    gender: params.get("gender") ?? "",
    guest: params.get("guest") === "true",
  };

  const isAdmin = params.get("admin") === "true";

  /** 🔥 투표 데이터 불러오기 */
  async function loadPoll() {
    const ref = doc(db, "polls", pollId as string);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data() as any;
      setPoll({
        ...data,
        participants: data.participants || [],
        waitlist: data.waitlist || [],
        logs: data.logs || [],
      });

      setEditForm({
        date: data.date,
        time: data.time,
        location: data.location,
        fee: data.fee,
        capacity: String(data.capacity),
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPoll();
  }, []);

  if (loading) return <div className="p-4">불러오는 중…</div>;
  if (!poll) return <div className="p-4">투표 정보를 찾을 수 없습니다.</div>;

  const participants = poll.participants || [];
  const waitlist = poll.waitlist || [];

  const logs = [...(poll.logs || [])].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  /** 🔥 사용자 식별자 생성 (이름:pin 형식) */
  function getUserIdentifier(name: string, pin: string): string {
    return pin ? `${name}:${pin}` : name;
  }

  /** 🔥 사용자 식별자 비교 (기존 데이터 호환성 유지) */
  function matchesUser(entry: string | any, name: string, pin: string): boolean {
    const entryName = typeof entry === "string" ? entry.split(":")[0] : entry.name;
    const entryPin = typeof entry === "string" && entry.includes(":") ? entry.split(":")[1] : (entry.pin || "");
    
    // 이름이 같고, pin이 둘 다 있으면 pin도 비교
    if (entryName === name) {
      if (pin && entryPin) {
        return entryPin === pin;
      }
      // pin이 없는 경우 (기존 데이터)는 이름만으로 매칭
      return true;
    }
    return false;
  }

  /** 🔥 로그 추가 */
  async function pushLog(type: LogType, name: string) {
    await updateDoc(doc(db, "polls", pollId as string), {
      logs: arrayUnion({
        type,
        name,
        time: new Date().toISOString(),
      }),
    });
  }

  /** 🔥 참석하기 */
  async function handleJoin() {
    if (!user.name) return alert("로그인이 필요합니다.");
    if (!user.pin) return alert("PIN이 필요합니다.");

    const ref = doc(db, "polls", pollId as string);

    const userIdentifier = getUserIdentifier(user.name, user.pin);
    
    // 이름과 pin을 모두 확인하여 중복 체크
    const alreadyP = participants.some((p) => matchesUser(p, user.name, user.pin));
    const alreadyW = waitlist.some((w) => matchesUser(w, user.name, user.pin));

    if (alreadyP) return alert("이미 참석 중입니다.");
    if (alreadyW) return alert("이미 대기 중입니다.");

    let newP = [...participants];
    let newW = [...waitlist];

    if (newP.length < poll!.capacity) {
      newP.push(userIdentifier);
    } else {
      newW.push(userIdentifier);
    }

    await updateDoc(ref, { participants: newP, waitlist: newW });
    await pushLog("join", user.name);
    loadPoll();
  }

  /** 🔥 취소 모달 열기 */
  function openCancelModal() {
    if (!user.name) return alert("로그인 오류");
    setShowCancelModal(true);
  }

  /** 🔥 취소 처리 */
  async function handleCancel() {
    setShowCancelModal(false);

    if (!user.pin) return alert("PIN이 필요합니다.");

    const ref = doc(db, "polls", pollId as string);

    let newP = [...participants];
    let newW = [...waitlist];

    // 이름과 pin을 모두 확인하여 본인인지 확인
    const inP = newP.findIndex((p) => matchesUser(p, user.name, user.pin)) !== -1;
    const inW = newW.findIndex((w) => matchesUser(w, user.name, user.pin)) !== -1;

    if (!inP && !inW) return alert("참석/대기 기록 없음");

    if (inP) {
      const pIndex = newP.findIndex((p) => matchesUser(p, user.name, user.pin));
      if (pIndex !== -1) {
        newP = newP.filter((_, idx) => idx !== pIndex);
        if (newW.length > 0) {
          const next = newW[0];
          newW = newW.slice(1);
          newP.push(next);
          const nextName = typeof next === "string" ? next.split(":")[0] : next.name;
          await pushLog("promote", nextName);
        }
      }
    }
    if (inW) {
      const wIndex = newW.findIndex((w) => matchesUser(w, user.name, user.pin));
      if (wIndex !== -1) {
        newW = newW.filter((_, idx) => idx !== wIndex);
      }
    }

    await updateDoc(ref, { participants: newP, waitlist: newW });
    await pushLog("cancel", user.name);
    loadPoll();
  }

  /** 🔥 관리자 강제 삭제 */
   /** 🔥 관리자 강제 삭제 */
  async function adminForceRemove(
  
    target: any,
    type: "participant" | "waitlist"
  ) {
    if (!isAdmin) return alert("관리자만 가능");

    const name =
      typeof target === "string"
        ? target.includes(":")
          ? target.split(":")[0]
          : target
        : target.name;

    const ok = confirm(`"${name}" 님을 삭제할까요?`);
    if (!ok) return;

    const ref = doc(db, "polls", pollId as string);

    let newP = [...participants];
    let newW = [...waitlist];

    if (type === "participant") {
      // ✅ 문자열/이름:pin/객체 전부 대응해서 실제로 삭제
      newP = newP.filter((p) => !matchesUser(p, name, ""));

      if (newW.length > 0) {
        const next = newW[0];
        newW = newW.slice(1);
        newP.push(next);

        const nextName =
          typeof next === "string" ? next.split(":")[0] : next.name;

        await pushLog("promote", nextName);
      }
    } else {
      // (현재 UI엔 대기자 제거 버튼 없지만, 함수는 안전하게 맞춰둠)
      newW = newW.filter((w) => !matchesUser(w, name, ""));
    }
/** 🔥 관리자: 참석자 게스트 토글 */


    await updateDoc(ref, { participants: newP, waitlist: newW });
    await pushLog("admin_remove", name);
    loadPoll();
  }

/** 🔥 관리자: 참석자 게스트 토글 */
/** 🔥 관리자: 참석자 게스트 토글 */
async function toggleGuest(target: any) {
  if (!isAdmin) return;

  const ref = doc(db, "polls", pollId as string);

  const newParticipants = participants.map((p) => {
    // 문자열 (이름:pin or 이름) → 게스트 객체
    if (typeof p === "string" && p === target) {
      const nameOnly = p.includes(":") ? p.split(":")[0] : p;
      return { name: nameOnly, guest: true };
    }

    // 객체 → 일반 참석자로 되돌리기
    if (typeof p === "object" && p.name === target.name) {
      return p.guest ? p.name : p;
    }

    return p;
  });

  await updateDoc(ref, { participants: newParticipants });
  loadPoll();
}


  /** 🔥 관리자 직접 인원 추가 (게스트 체크 가능) */
  async function adminAddPerson(
    name: string,
    to: "participant" | "waitlist",
    guest: boolean
  ) {
    if (!isAdmin) return alert("관리자만 가능");
    if (!name) return alert("이름을 입력하세요.");

    const ref = doc(db, "polls", pollId as string);

    let newP = [...participants];
    let newW = [...waitlist];

    if (newP.includes(name) || newW.includes(name))
      return alert("이미 포함된 이름입니다.");

    const person = guest ? { name, guest: true } : name;

    if (to === "participant") {
      if (newP.length >= poll!.capacity) return alert("정원이 가득 찼습니다.");
      newP.push(person);
    } else {
      newW.push(person);
    }

    await updateDoc(ref, { participants: newP, waitlist: newW });
    await pushLog("admin_add", name);
    loadPoll();
  }
  /** 🔥 투표 삭제 전 meetings 기록 저장 */
  async function archivePollBeforeDelete() {
    if (!poll) {
      console.log("❌ poll 없음");
      return;
    }

    console.log("🔥 archivePollBeforeDelete 실행", poll);

    try {
      const attendees = (poll.participants || []).map((p: any) => {
        if (typeof p === "string") {
          return {
            name: p.includes(":") ? p.split(":")[0] : p,
            guest: false,
          };
        }
        return {
          name: p.name,
          guest: !!p.guest,
        };
      });

      await addDoc(collection(db, "meetings"), {
        dateKey: poll.date, // 🔑 달력 점 기준
        date: poll.date,
        time: poll.time,
        location: poll.location,
        fee: poll.fee,
        pollId: pollId,
        attendees,
        createdAt: Timestamp.now(),
      });

      console.log("✅ meetings 저장 성공");
    } catch (err) {
      console.error("❌ meetings 저장 실패", err);
      alert("meetings 저장 실패 (콘솔 확인)");
    }
  }

 

  /** 🔥 투표 삭제 */
  async function deletePoll() {
    console.log("🔥 deletePoll 클릭됨");
  if (!isAdmin) return alert("관리자만 가능");

  const ok = confirm("이 투표를 완전히 삭제할까요?");
  if (!ok) return;

  // ✅ 1️⃣ 먼저 기록 저장
  await archivePollBeforeDelete();

  // ✅ 2️⃣ 그 다음 투표 삭제
  await deleteDoc(doc(db, "polls", pollId as string));

  alert("삭제되었습니다.");

  const userQuery = new URLSearchParams({
    name: user.name,
    pin: user.pin,
    grade: user.grade,
    gender: user.gender,
    guest: String(user.guest),
    admin: String(isAdmin),
  }).toString();

  router.push(`/vote?${userQuery}`);
}

/** 🔥 정원 변경 시 참석/대기 자동 재정렬 */
function rebalanceByCapacity(
  participants: any[],
  waitlist: any[],
  capacity: number
) {
  // 1) 참석 + 대기 전부 합치기 (순서 유지)
  const all = [...participants, ...waitlist];

  // 2) 앞에서 capacity명은 참석, 나머지는 대기
  const newParticipants = all.slice(0, capacity);
  const newWaitlist = all.slice(capacity);

  return {
    newParticipants,
    newWaitlist,
  };
}

  /** 🔧 정보 수정 저장 */
  /** 🔧 정보 수정 저장 */
async function saveEdit() {
  const ref = doc(db, "polls", pollId as string);

  const newCapacity = Number(editForm.capacity);

  // 🔥 정원 기준으로 참석/대기 재정렬
  const { newParticipants, newWaitlist } = rebalanceByCapacity(
    participants,
    waitlist,
    newCapacity
  );

  await updateDoc(ref, {
    date: editForm.date,
    time: editForm.time,
    location: editForm.location,
    fee: editForm.fee,
    capacity: newCapacity,

    // ✅ 여기 추가됨
    participants: newParticipants,
    waitlist: newWaitlist,
  });

  alert("정원 변경에 따라 참석/대기가 자동 조정되었습니다.");
  setEditMode(false);
  loadPoll();
}


  /** 🔥 출석 반영 → 랭킹 반영 */
  async function applyAttendance() {
    if (!isAdmin) return alert("관리자만 가능합니다.");
    if (!poll) return alert("투표 정보를 불러오지 못했습니다.");

    const pollDate = poll.date;

    const boxes = document.querySelectorAll(".att-check:checked");
    const selectedNames = Array.from(boxes).map(
      (el: any) => el.dataset.name
    );

    if (selectedNames.length === 0)
      return alert("선택된 인원이 없습니다.");

    for (const name of selectedNames) {
      const qSnap = await getDocs(
        query(
          collection(db, "participationLogs"),
          where("userId", "==", name),
          where("date", "==", pollDate)
        )
      );
      if (!qSnap.empty) continue;

      // 🔍 참석자 목록에서 해당 사람 찾기
const participant = participants.find((p) => {
  if (typeof p === "string") return p === name || p.startsWith(name + ":");
  return p.name === name;
});

// ❌ 게스트면 아예 반영 안 함
if (typeof participant !== "string" && participant?.guest === true) {
  continue;
}

await addDoc(collection(db, "participationLogs"), {
  userId: name,
  date: pollDate,
  pollId,
  guest: typeof participant !== "string" ? !!participant.guest : false,
  createdAt: Timestamp.now(),
});
    }

    alert("랭킹 반영 완료!");
  }

  /** 🔥 출석 취소 → 랭킹 반영 취소 */
  async function cancelAttendance() {
    if (!isAdmin) return alert("관리자만 가능합니다.");
    if (!poll) return alert("투표 정보를 불러오지 못했습니다.");

    const pollDate = poll.date;

    const boxes = document.querySelectorAll(".att-check:checked");
    const selectedNames = Array.from(boxes).map(
      (el: any) => el.dataset.name
    );

    if (selectedNames.length === 0)
      return alert("선택된 인원이 없습니다.");

    for (const name of selectedNames) {
      const qSnap = await getDocs(
        query(
          collection(db, "participationLogs"),
          where("userId", "==", name),
          where("date", "==", pollDate)
        )
      );

      for (const d of qSnap.docs) {
        await deleteDoc(d.ref);
      }
    }

    alert("랭킹 반영 취소 완료!");
  }

  /** 파스텔 버튼 헬퍼 */
  const pastelButton = (color: string) =>
    `w-full py-3 rounded-xl font-bold text-white ${color}`;

  /** 로그 색상 */
  function logColor(type: LogType) {
    return {
      join: "text-black",
      cancel: "text-red-500",
      promote: "text-blue-500",
      admin_remove: "text-green-600",
      admin_add: "text-purple-500",
    }[type];
  }

  const safeKey = (item: any, idx: number) =>
    typeof item === "string" ? item + "_" + idx : item?.name + "_" + idx;

  /** --------------------------- UI --------------------------- */

  return (
    <main className="p-4 pb-20 bg-[#FFF8F0] min-h-screen">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6">
<Link
  href={`/vote?${new URLSearchParams({
    name: user.name,
    pin: user.pin,
    grade: user.grade,
    gender: user.gender,
    guest: String(user.guest),
    admin: String(isAdmin),
  }).toString()}`}
  className="mb-4 inline-flex items-center gap-1
             text-sm text-gray-600 hover:text-gray-900"
>
  ← 투표 목록으로
</Link>


        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Netplay 참석 투표 🗳️
        </h1>

        {/* 모임 정보 */}
        {!editMode ? (
          <div className="bg-red-100 p-4 rounded-xl text-sm mb-4 border">
            <p className="font-bold">📅 날짜</p>
            <p className="mb-2">{poll.date}</p>

            <p className="font-bold">🕒 시간</p>
            <p className="mb-2">{poll.time}</p>

            <p className="font-bold">📍 장소</p>
            <p className="mb-2">{poll.location}</p>

            <p className="font-bold">💰 비용</p>
            <p className="mb-2">{poll.fee}</p>

            <p className="font-bold">👥 인원</p>
            <p>정원 {poll.capacity}명 / 현재 참석 {participants.length}명</p>
          </div>
        ) : (
          <div className="bg-red-50 p-4 rounded-xl mb-4 border space-y-2 text-sm">

            <input
              className="w-full p-2 border rounded"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              placeholder="날짜"
            />

            <input
              className="w-full p-2 border rounded"
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              placeholder="시간"
            />

            <input
              className="w-full p-2 border rounded"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              placeholder="장소"
            />

            <input
              className="w-full p-2 border rounded"
              value={editForm.fee}
              onChange={(e) => setEditForm({ ...editForm, fee: e.target.value })}
              placeholder="비용"
            />

            <input
              className="w-full p-2 border rounded"
              value={editForm.capacity}
              onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
              placeholder="정원"
            />

            <button
              onClick={saveEdit}
              className="w-full bg-red-400 text-white py-2 rounded mt-2"
            >
              저장하기
            </button>
          </div>
        )}

        {/* 내 정보 */}
        <div className="bg-gray-50 p-3 rounded-xl border mb-4 text-sm">
          <p><b>이름:</b> {user.name}</p>
          <p><b>급수:</b> {user.grade}</p>
          <p><b>성별:</b> {user.gender}</p>
          {user.guest && <p className="text-red-500 text-xs mt-1">게스트</p>}
        </div>

        {/* 참석 / 취소 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleJoin}
            className="bg-red-400 text-white py-3 rounded-xl font-bold"
          >
            참석하기
          </button>
          <button
            onClick={openCancelModal}
            className="bg-gray-400 text-white py-3 rounded-xl font-bold"
          >
            취소하기
          </button>
        </div>

        {/* 관리자 버튼 */}
        {isAdmin && (
          <>
            <button
              onClick={() => setEditMode(!editMode)}
              className="w-full py-2 bg-yellow-200 hover:bg-yellow-300 rounded-xl font-bold mb-2"
            >
              {editMode ? "수정 종료" : "✏ 정보 수정"}
            </button>

            <button
              onClick={deletePoll}
              className="w-full py-2 bg-red-300 hover:bg-red-400 text-white rounded-xl font-bold"
            >
              ❌ 투표 삭제
            </button>

            <Link href="/vote/new">
              <button className="w-full py-2 bg-blue-300 hover:bg-blue-400 text-white rounded-xl font-bold mt-2">
                ➕ 새 투표 만들기
              </button>
            </Link>
          </>
        )}

        {/* 관리자 인원 추가 (게스트 체크 포함) */}
        {isAdmin && (
          <div className="p-3 bg-blue-50 rounded-xl mb-4">
            <input
              id="adminAdd"
              placeholder="추가할 이름"
              className="p-2 border rounded w-full mb-2"
            />

            <label className="flex items-center gap-2 text-sm mb-3">
              <input type="checkbox" id="adminAddGuest" />
              게스트 여부
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const name = (document.getElementById("adminAdd") as HTMLInputElement).value;
                  const guest = (document.getElementById("adminAddGuest") as HTMLInputElement).checked;
                  adminAddPerson(name, "participant", guest);
                }}
                className="bg-green-300 hover:bg-green-400 text-white rounded p-2"
              >
                참석 + 추가
              </button>

              <button
                onClick={() => {
                  const name = (document.getElementById("adminAdd") as HTMLInputElement).value;
                  const guest = (document.getElementById("adminAddGuest") as HTMLInputElement).checked;
                  adminAddPerson(name, "waitlist", guest);
                }}
                className="bg-yellow-300 hover:bg-yellow-400 text-white rounded p-2"
              >
                대기 + 추가
              </button>
            </div>
          </div>
        )}

        {/* 참석자 목록 */}
        <div className="mb-3">
          <button
            className="w-full flex justify-between items-center bg-red-100 p-3 rounded-xl text-sm font-bold"
            onClick={() => setExpanded((s) => ({ ...s, attend: !s.attend }))}
          >
            참석자 ({participants.length})
            <span>{expanded.attend ? "▲" : "▼"}</span>
          </button>

          {expanded.attend && (
            <div className="bg-red-50 p-3 border rounded-b-xl">
              {/* 전체 선택 / 해제 */}
              {isAdmin && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() =>
                      document.querySelectorAll(".att-check").forEach((el: any) => (el.checked = true))
                    }
                    className="flex-1 bg-green-200 hover:bg-green-300 text-white py-2 rounded-xl"
                  >
                    ✔ 전체 선택
                  </button>

                  <button
                    onClick={() =>
                      document.querySelectorAll(".att-check").forEach((el: any) => (el.checked = false))
                    }
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-white py-2 rounded-xl"
                  >
                    ❌ 전체 해제
                  </button>
                </div>
              )}

              {participants.map((n, idx) => {
                const name = typeof n === "string" 
                  ? (n.includes(":") ? n.split(":")[0] : n)
                  : n.name;
                const isGuest = typeof n !== "string" && n.guest;

                return (
                  <div
                    key={safeKey(n, idx)}
                    className="flex justify-between border-b py-1 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <input
                          type="checkbox"
                          className="att-check"
                          data-name={name}
                        />
                      )}
                      {name}
                      {isGuest && (
                        <span className="text-xs text-red-400">(게스트)</span>
                      )}
                    </div>

                    {isAdmin && (
  <div className="flex gap-2">
    <button
      onClick={() => adminForceRemove(n, "participant")}
      className="text-red-500 text-xs"
    >
      제거
    </button>

    <button
      onClick={() => toggleGuest(n)}
      className="text-blue-500 text-xs"
    >
      {isGuest ? "게스트 해제" : "게스트로"}
    </button>
  </div>
)}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 랭킹 반영 / 취소 버튼 */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={applyAttendance}
              className={pastelButton("bg-green-300 hover:bg-green-400")}
            >
              ✔ 랭킹 반영
            </button>

            <button
              onClick={cancelAttendance}
              className={pastelButton("bg-red-300 hover:bg-red-400")}
            >
              ❌ 랭킹 반영 취소
            </button>
          </div>
        )}

        {/* 대기자 */}
        <div className="mb-3 mt-4">
          <button
            className="w-full flex justify-between items-center bg-yellow-100 p-3 rounded-xl text-sm font-bold"
            onClick={() => setExpanded((s) => ({ ...s, wait: !s.wait }))}
          >
            대기자 ({waitlist.length})
            <span>{expanded.wait ? "▲" : "▼"}</span>
          </button>

          {expanded.wait && (
            <div className="bg-yellow-50 p-3 border rounded-b-xl">
              {waitlist.map((n, idx) => {
                const name = typeof n === "string" 
                  ? (n.includes(":") ? n.split(":")[0] : n)
                  : n.name;
                const isGuest = typeof n !== "string" && n.guest;

                return (
                  <div
                    key={safeKey(n, idx)}
                    className="flex justify-between border-b py-1 text-sm"
                  >
                    <div>
                      대기 {idx + 1}. {name}{" "}
                      {isGuest && (
                        <span className="text-xs text-red-400">(게스트)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 로그 */}
        {isAdmin && (
          <div className="mt-4">
            <button
              className="w-full flex justify-between items-center bg-gray-100 p-3 rounded-xl text-sm font-bold"
              onClick={() => setExpanded((s) => ({ ...s, logs: !s.logs }))}
            >
              변경 로그 ({logs.length})
              <span>{expanded.logs ? "▲" : "▼"}</span>
            </button>

            {expanded.logs && (
              <div className="bg-gray-50 p-3 border rounded-b-xl max-h-64 overflow-y-auto text-xs space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className={logColor(log.type)}>
                    ● [{log.type}] {log.name} —{" "}
                    {new Date(log.time).toLocaleString("ko-KR")}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ModalConfirm
        open={showCancelModal}
        title="정말 취소하시겠습니까?"
        message="취소하면 대기자가 자동으로 참여할 수 있습니다."
        onCancel={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
      />
    </main>
  );
}

