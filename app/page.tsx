"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";

// 날짜 포맷
function formatKoreanDate(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

export default function Home() {
  const [polls, setPolls] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // 관리자
  const ADMIN_PASS = "yoon511";
  const [adminMode, setAdminMode] = useState(false);
  const [adminInput, setAdminInput] = useState("");

  // 🔥 localStorage 로드
  useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    const savedPass = localStorage.getItem("user_pass");

    if (savedName) setName(savedName);
    if (savedPass) setPassword(savedPass);
  }, []);

  // 🔥 localStorage 저장
  function saveUser() {
    if (!name || !password) return alert("이름/비밀번호 입력 필수");
    if (password.length !== 4) return alert("비밀번호는 숫자 4자리");

    localStorage.setItem("user_name", name);
    localStorage.setItem("user_pass", password);

    alert("저장되었습니다!");
  }

  // 🔥 실시간 모임 목록 로드 (+ 날짜순 정렬)
  useEffect(() => {
    const q = query(collection(db, "polls"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setPolls(arr);
    });

    return () => unsub();
  }, []);

  // 🔥 로그 기록
  async function addLog(type: string, pollId: string, userName: string) {
    const logsRef = collection(db, "polls", pollId, "logs");
    await addDoc(logsRef, {
      type,
      name: userName,
      time: Timestamp.now(),
    });
  }

  // 참가하기
  async function handleJoin(poll: any) {
    if (!name || !password) return alert("이름과 비밀번호를 입력하세요.");
    const ref = doc(db, "polls", poll.id);

    const participants = poll.participants || [];
    const waitlist = poll.waitlist || [];
    const user = { name, pass: password };

    if (participants.find((p: any) => p.name === name)) {
      return alert("이미 참여 중입니다.");
    }
    if (waitlist.find((w: any) => w.name === name)) {
      return alert("이미 대기 중입니다.");
    }

    if (participants.length < poll.capacity) {
      await updateDoc(ref, { participants: [...participants, user] });
      await addLog("join", poll.id, name);
      return;
    }

    await updateDoc(ref, { waitlist: [...waitlist, user] });
    await addLog("join", poll.id, name);
  }

  // 취소하기 (+ 팝업)
  async function confirmCancel(poll: any) {
    if (!confirm("정말 취소하시겠습니까?")) return;
    handleCancel(poll);
  }

  // 실제 취소 처리
  async function handleCancel(poll: any) {
    const ref = doc(db, "polls", poll.id);

    let participants = poll.participants || [];
    let waitlist = poll.waitlist || [];

    const inP = participants.find((p: any) => p.name === name && p.pass === password);
    const inW = waitlist.find((p: any) => p.name === name && p.pass === password);

    if (inP) {
      participants = participants.filter((p: any) => !(p.name === name && p.pass === password));

      // 승급
      if (waitlist.length > 0) {
        const next = waitlist[0];
        waitlist = waitlist.slice(1);
        participants.push(next);
        await addLog("promote", poll.id, next.name);
      }

      await updateDoc(ref, { participants, waitlist });
      await addLog("cancel", poll.id, name);
      return;
    }

    if (inW) {
      waitlist = waitlist.filter((p: any) => !(p.name === name && p.pass === password));
      await updateDoc(ref, { waitlist });
      await addLog("cancel", poll.id, name);
      return;
    }

    alert("참석 정보가 없습니다.");
  }

  // 관리자 로그인
  function loginAdmin() {
    if (adminInput === ADMIN_PASS) {
      setAdminMode(true);
      setAdminInput("");
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  }

  return (
    <main className="flex justify-center items-start min-h-screen bg-[#fdfbf6] p-6">
      <div className="w-full max-w-sm font-sans">

        {/* 로고 */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl font-bold text-red-400">Netplay 참석 투표 - 윤</span>
          <span className="text-2xl">🏸</span>
        </div>

        {/* 사용자 정보 입력 */}
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
          <div className="font-semibold mb-1 text-sm">사용자 정보 (한번 저장하면 자동 적용)</div>

          <input
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-xl mb-2"
          />
          <input
            placeholder="비밀번호 4자리"
            maxLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-xl mb-4"
          />

          <button
            onClick={saveUser}
            className="w-full bg-blue-300 hover:bg-blue-400 text-white py-2 rounded-xl"
          >
            저장하기
          </button>
        </div>

        {/* 🔥 모임 리스트 (모든 기능 포함!) */}
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="bg-white rounded-2xl shadow mb-6 p-4"
          >
            {/* 제목 */}
            <div className="text-lg font-semibold mb-1">{poll.title}</div>

            {/* 날짜 추가됨 */}
            <div className="text-sm mb-1">📅 {formatKoreanDate(poll.date)}</div>

            <div className="text-sm mb-1">
              🕒 {poll.time} · 💰 {poll.fee}
            </div>

            <div className="text-sm text-gray-700">{poll.location}</div>

            <div className="text-xs text-gray-600 mt-1 mb-3">
              정원 {poll.capacity}명 중 {poll.participants?.length || 0}명 참여
            </div>

            {/* 참가/취소 버튼 항상 보임 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleJoin(poll)}
                className="flex-1 bg-red-300 hover:bg-red-400 text-white py-2 rounded-full"
              >
                참가하기
              </button>
              <button
                onClick={() => confirmCancel(poll)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-full"
              >
                취소하기
              </button>
            </div>

            {/* 참여자 */}
            <Expandable title={`참여자 (${poll.participants?.length || 0})`}>
              {(poll.participants || []).map((p: any, idx: number) => (
                <li key={idx}>{p.name}</li>
              ))}
            </Expandable>

            {/* 대기자 */}
            <Expandable title={`대기자 (${poll.waitlist?.length || 0})`}>
              {(poll.waitlist || []).map((w: any, idx: number) => (
                <li key={idx}>대기 {idx + 1}. {w.name}</li>
              ))}
            </Expandable>
          </div>
        ))}

        {/* 관리자 */}
        <div className="bg-white p-4 rounded-2xl shadow mt-6">
          {!adminMode ? (
            <>
              <input
                placeholder="관리자 비밀번호"
                type="password"
                className="w-full p-2 border rounded-xl mb-2"
                value={adminInput}
                onChange={(e) => setAdminInput(e.target.value)}
              />

              <button
                onClick={loginAdmin}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-xl"
              >
                관리자 모드 열기
              </button>
            </>
          ) : (
            <div className="text-sm text-gray-700">관리자 모드 활성화됨 ✔</div>
          )}
        </div>
      </div>
    </main>
  );
}

// 접힘 UI
function Expandable({ title, children }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-sm font-semibold mb-1"
      >
        {title}
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="text-sm pl-5 list-disc bg-gray-50 p-3 rounded-xl shadow-inner">
          {children}
        </ul>
      )}
    </div>
  );
}
