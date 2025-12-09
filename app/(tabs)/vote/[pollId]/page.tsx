"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import Link from "next/link";

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  collection,
  Timestamp,
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

  /** 🔥 로그 푸시 */
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

    const ref = doc(db, "polls", pollId as string);

    const alreadyP = participants.includes(user.name);
    const alreadyW = waitlist.includes(user.name);

    if (alreadyP) return alert("이미 참석 중입니다.");
    if (alreadyW) return alert("이미 대기 중입니다.");

    let newP = [...participants];
    let newW = [...waitlist];

    if (newP.length < poll!.capacity) {
      newP.push(user.name);
    } else {
      newW.push(user.name);
    }

    await updateDoc(ref, { participants: newP, waitlist: newW });
    await pushLog("join", user.name);
    loadPoll();
  }

  /** 🔥 취소 모달 */
  function openCancelModal() {
    if (!user.name) return alert("로그인 오류");
    setShowCancelModal(true);
  }

  /** 🔥 취소 처리 */
  async function handleCancel() {
    setShowCancelModal(false);

    const ref = doc(db, "polls", pollId as string);

    let newP = [...participants];
    let newW = [...waitlist];

    const inP = newP.includes(user.name);
    const inW = newW.includes(user.name);

    if (!inP && !inW) return alert("참석/대기 기록 없음");

    if (inP) {
      newP = newP.filter((n) => n !== user.name);
      if (newW.length > 0) {
        const next = newW[0];
        newW = newW.slice(1);
        newP.push(next);
        await pushLog("promote", next);
      }
    }
    if (inW) newW = newW.filter((n) => n !== user.name);

    await updateDoc(ref, { participants: newP, waitlist: newW });
    await pushLog("cancel", user.name);
    loadPoll();
  }

  /** 🔥 관리자 인원 삭제 */
  async function adminForceRemove(name: string, type: "participant" | "waitlist") {
    if (!isAdmin) return alert("관리자만 가능");

    const ok = confirm(`"${name}" 님을 삭제할까요?`);
    if (!ok) return;

    const ref = doc(db, "polls", pollId as string);

    let newP = [...participants];
    let newW = [...waitlist];

    if (type === "participant") {
      newP = newP.filter((n) => n !== name);
      if (newW.length > 0) {
        const next = newW[0];
        newW = newW.slice(1);
        newP.push(next);
        await pushLog("promote", next);
      }
    } else {
      newW = newW.filter((n) => n !== name);
    }

    await updateDoc(ref, { participants: newP, waitlist: newW });
    await pushLog("admin_remove", name);
    loadPoll();
  }

  /** 🔥 관리자 인원 추가 */
  async function adminAddPerson(name: string, to: "participant" | "waitlist") {
    if (!isAdmin) return alert("관리자만 가능");
    if (!name) return alert("이름을 입력하세요.");

    const ref = doc(db, "polls", pollId as string);

    let newP = [...participants];
    let newW = [...waitlist];

    if (newP.includes(name) || newW.includes(name))
      return alert("이미 포함된 이름입니다.");

    if (to === "participant") {
      if (newP.length >= poll!.capacity) return alert("정원이 가득 찼습니다.");
      newP.push(name);
    } else {
      newW.push(name);
    }

    await updateDoc(ref, { participants: newP, waitlist: newW });
    await pushLog("admin_add", name);
    loadPoll();
  }

  /** 🔥 투표 삭제 */
  async function deletePoll() {
    if (!isAdmin) return alert("관리자만 가능");

    const ok = confirm("이 투표를 완전히 삭제할까요?");
    if (!ok) return;

    await deleteDoc(doc(db, "polls", pollId as string));

    alert("삭제되었습니다.");
    window.location.href = "/";
  }

  /** 🔧 정보 수정 저장 */
  async function saveEdit() {
    const ref = doc(db, "polls", pollId as string);

    await updateDoc(ref, {
      date: editForm.date,
      time: editForm.time,
      location: editForm.location,
      fee: editForm.fee,
      capacity: Number(editForm.capacity),
    });

    alert("수정 완료!");
    setEditMode(false);
    loadPoll();
  }

  /** 🔥 출석 반영 */
  async function applyAttendance() {
    if (!isAdmin) return alert("관리자만 가능합니다.");

    const today = new Date().toISOString().split("T")[0];

    const boxes = document.querySelectorAll(".att-check:checked");
    const selectedNames = Array.from(boxes).map(
      (el: any) => el.dataset.name
    );

    if (selectedNames.length === 0)
      return alert("선택된 인원이 없습니다.");

    for (const name of selectedNames) {
      const q = query(
        collection(db, "participationLogs"),
        where("userId", "==", name),
        where("date", "==", today)
      );
      const snap = await getDocs(q);
      if (!snap.empty) continue;

      await addDoc(collection(db, "participationLogs"), {
        userId: name,
        date: today,
        createdAt: Timestamp.now(),
      });
    }

    alert("출석 반영 완료!");
  }

  /** 🔥 출석 취소 */
  async function cancelAttendance() {
    if (!isAdmin) return alert("관리자만 가능합니다.");

    const today = new Date().toISOString().split("T")[0];

    const boxes = document.querySelectorAll(".att-check:checked");
    const selectedNames = Array.from(boxes).map(
      (el: any) => el.dataset.name
    );

    if (selectedNames.length === 0)
      return alert("선택된 인원이 없습니다.");

    for (const name of selectedNames) {
      const q = query(
        collection(db, "participationLogs"),
        where("userId", "==", name),
        where("date", "==", today)
      );
      const snap = await getDocs(q);

      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }
    }

    alert("출석 취소 완료!");
  }

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
              className="w-full py-2 bg-yellow-300 rounded-xl font-bold mb-2"
            >
              {editMode ? "수정 종료" : "✏ 정보 수정"}
            </button>

            <button
              onClick={deletePoll}
              className="w-full py-2 bg-red-600 text-white rounded-xl font-bold"
            >
              ❌ 투표 삭제
            </button>

            <Link href="/vote/new">
              <button className="w-full py-2 bg-blue-500 text-white rounded-xl font-bold mt-2">
                ➕ 새 투표 만들기
              </button>
            </Link>
          </>
        )}

        {/* 관리자 인원 추가 */}
        {isAdmin && (
          <div className="p-3 bg-blue-50 rounded-xl mb-4">
            <input
              id="adminAdd"
              placeholder="추가할 이름"
              className="p-2 border rounded w-full mb-2"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const name = (document.getElementById("adminAdd") as HTMLInputElement).value;
                  adminAddPerson(name, "participant");
                }}
                className="bg-green-600 text-white rounded p-2"
              >
                참석 + 추가
              </button>

              <button
                onClick={() => {
                  const name = (document.getElementById("adminAdd") as HTMLInputElement).value;
                  adminAddPerson(name, "waitlist");
                }}
                className="bg-yellow-600 text-white rounded p-2"
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

      {/* 🔥 전체 선택 / 해제 버튼 */}
      {isAdmin && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              document.querySelectorAll(".att-check").forEach((el: any) => {
                el.checked = true;
              });
            }}
            className="flex-1 bg-green-500 text-white py-2 rounded-xl"
          >
            ✔ 전체 선택
          </button>

          <button
            onClick={() => {
              document.querySelectorAll(".att-check").forEach((el: any) => {
                el.checked = false;
              });
            }}
            className="flex-1 bg-gray-500 text-white py-2 rounded-xl"
          >
            ❌ 전체 해제
          </button>
        </div>
      )}

      {/* 🔥 참가자 리스트 */}
      {participants.map((n, idx) => {
        const name = typeof n === "string" ? n : n.name;
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
            </div>

            {isAdmin && (
              <button
                onClick={() => adminForceRemove(name, "participant")}
                className="text-red-500 text-xs"
              >
                제거
              </button>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>


        {/* 출석 반영 & 취소 버튼 */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={applyAttendance}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold"
            >
              ✔ 출석 반영
            </button>

            <button
              onClick={cancelAttendance}
              className="w-full bg-gray-700 text-white py-3 rounded-xl font-bold"
            >
              ❌ 출석 취소
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
                const name = typeof n === "string" ? n : n.name;
                return (
                  <div
                    key={safeKey(n, idx)}
                    className="flex justify-between border-b py-1 text-sm"
                  >
                    대기 {idx + 1}. {name}
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
                    ● [{log.type}] {log.name} — {new Date(log.time).toLocaleString("ko-KR")}
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
