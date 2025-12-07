"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../firebase";

import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";

// 날짜 포맷 함수
function formatKoreanDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

// 지난 모임 숨김 처리
function isPastPoll(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

export default function PollPage() {
  const { id } = useParams();

  const [poll, setPoll] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // 사용자 자동 입력
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // 관리자
  const ADMIN_PASS = "yoon511";
  const [adminMode, setAdminMode] = useState(false);
  const [adminInput, setAdminInput] = useState("");

  // ────────────────────────────────
  // 🔥 localStorage에서 사용자 정보 자동 로드
  // ────────────────────────────────
  useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    const savedPass = localStorage.getItem("user_pass");
    if (savedName) setName(savedName);
    if (savedPass) setPassword(savedPass);
  }, []);

  // ────────────────────────────────
  // 🔥 Firestore 실시간 구독 (poll + logs)
  // ────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const pollRef = doc(db, "polls", id as string);
    const unsubPoll = onSnapshot(pollRef, (snap) => {
      if (snap.exists()) setPoll({ id: snap.id, ...snap.data() });
    });

    const logsRef = collection(db, "polls", id as string, "logs");
    const q = query(logsRef, orderBy("time", "desc"));
    const unsubLogs = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setLogs(arr);
    });

    return () => {
      unsubPoll();
      unsubLogs();
    };
  }, [id]);

  // ────────────────────────────────
  // 🔥 로그 추가 함수
  // ────────────────────────────────
  async function addLog(type: string, userName: string) {
    const logsRef = collection(db, "polls", poll.id, "logs");
    await addDoc(logsRef, {
      type,
      name: userName,
      time: Timestamp.now(),
    });
  }

  // ────────────────────────────────
  // 🔔 관리자 실시간 알림
  // ────────────────────────────────
  useEffect(() => {
    if (!adminMode) return;
    if (!logs.length) return;

    const latest = logs[0];
    alert(
      `${latest.name} 님이 ${
        latest.type === "join"
          ? "참여"
          : latest.type === "cancel"
          ? "취소"
          : latest.type === "promote"
          ? "승급"
          : "강제 삭제됨"
      } 했습니다.`
    );
  }, [logs, adminMode]);

  // 로딩
  if (!poll)
    return (
      <main className="flex justify-center items-center h-screen text-gray-500">
        불러오는 중...
      </main>
    );

  // 지난 모임 숨김 처리
  if (isPastPoll(poll.date)) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-[#fdfbf6]">
        <div className="text-lg text-gray-500 font-semibold">이 모임은 종료되었습니다.</div>
      </main>
    );
  }

  // ────────────────────────────────
  // 🔥 참가하기
  // ────────────────────────────────
  async function handleJoin() {
    if (!name || !password)
      return alert("이름과 비밀번호를 입력하세요.");

    if (password.length !== 4 || !/^\d+$/.test(password))
      return alert("비밀번호는 숫자 4자리여야 합니다.");

    const ref = doc(db, "polls", poll.id);
    const user = { name, pass: password };

    const participants = poll.participants || [];
    const waitlist = poll.waitlist || [];

    // 정원 미달 -> 바로 참가
    if (participants.length < poll.capacity) {
      await updateDoc(ref, {
        participants: [...participants, user],
      });
      await addLog("join", name);
      return;
    }

    // 정원 초과 -> 대기 등록
    await updateDoc(ref, {
      waitlist: [...waitlist, user],
    });
    await addLog("join", name);
  }

  // ────────────────────────────────
  // 🔥 취소하기
  // ────────────────────────────────
  async function handleCancel() {
    if (!name || !password)
      return alert("이름과 비밀번호를 입력하세요.");

    const ref = doc(db, "polls", poll.id);
    let participants = poll.participants || [];
    let waitlist = poll.waitlist || [];

    // 참가자 취소
    const inP = participants.find((p: any) => p.name === name && p.pass === password);

    if (inP) {
      participants = participants.filter((p: any) => !(p.name === name && p.pass === password));
      await addLog("cancel", name);

      // 대기자 승급
      if (waitlist.length > 0) {
        const next = waitlist[0];
        waitlist = waitlist.slice(1);
        participants.push(next);
        await addLog("promote", next.name);
      }

      await updateDoc(ref, { participants, waitlist });
      return;
    }

    // 대기자 취소
    const inW = waitlist.find((w: any) => w.name === name && w.pass === password);
    if (inW) {
      waitlist = waitlist.filter((w: any) => !(w.name === name && w.pass === password));
      await updateDoc(ref, { waitlist });
      await addLog("cancel", name);
      return;
    }

    alert("이름 또는 비밀번호가 일치하지 않습니다.");
  }

  // ────────────────────────────────
  // 🔐 관리자 로그인
  // ────────────────────────────────
  function loginAdmin() {
    if (adminInput === ADMIN_PASS) {
      setAdminMode(true);
      setAdminInput("");
    } else {
      alert("관리자 비밀번호 오류");
    }
  }

  // 🔥 관리자 강제 삭제
  async function forceRemove(user: any, type: "participant" | "waitlist") {
    if (!confirm(`정말 '${user.name}' 님을 삭제할까요?`)) return;

    const ref = doc(db, "polls", poll.id);
    let participants = poll.participants || [];
    let waitlist = poll.waitlist || [];

    if (type === "participant") {
      participants = participants.filter((p: any) => p !== user);
    } else {
      waitlist = waitlist.filter((w: any) => w !== user);
    }

    await updateDoc(ref, { participants, waitlist });
    await addLog("force-remove", user.name);
  }

  // ────────────────────────────────
  // UI
  // ────────────────────────────────
  return (
    <main className="flex justify-center items-start min-h-screen bg-[#fdfbf6] p-6">
      <div className="w-full max-w-sm font-sans">

        {/* 로고 */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl font-bold text-red-400">Netplay 참석 투표 - 윤</span>
          <span className="text-2xl">🏸</span>
        </div>

        {/* 모임 정보 */}
        <div className="bg-[#dff6ec] rounded-2xl p-4 mb-4">
          <div className="text-lg font-semibold">{poll.title}</div>
          <div className="text-sm">📅 {formatKoreanDate(poll.date)}</div>
          <div className="text-sm">🕒 {poll.time} · 💰 {poll.fee}</div>
          <div className="text-sm text-gray-700">{poll.location}</div>
          <div className="text-xs mt-2">
            정원 {poll.capacity}명 중 {poll.participants?.length || 0}명 참여
          </div>
        </div>

        {/* 참가 / 취소 버튼 (페이지 상단 고정 위치) */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleJoin}
            className="flex-1 bg-red-300 hover:bg-red-400 text-white py-2 rounded-full"
          >
            참가하기
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-full"
          >
            취소하기
          </button>
        </div>

        {/* 이름 / PW (자동 입력됨) */}
        <div className="bg-white p-4 rounded-xl shadow-inner mb-4">
          <input
            value={name}
            readOnly
            className="w-full p-2 border rounded-xl mb-2 bg-gray-100"
            placeholder="이름"
          />
          <input
            value={password}
            readOnly
            className="w-full p-2 border rounded-xl bg-gray-100"
            placeholder="비밀번호"
          />
          <div className="text-xs text-gray-500 mt-2">홈 화면에서 수정 가능합니다.</div>
        </div>

        {/* 참여자 */}
        <Section title="참여자" count={poll.participants?.length || 0}>
          {(poll.participants || []).map((p: any, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{p.name}</span>

              {adminMode && (
                <button
                  onClick={() => forceRemove(p, "participant")}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  강제삭제
                </button>
              )}
            </li>
          ))}
        </Section>

        {/* 대기자 */}
        <Section title="대기자" count={poll.waitlist?.length || 0}>
          {(poll.waitlist || []).map((w: any, idx) => (
            <li key={idx} className="flex justify-between">
              <span>대기 {idx + 1}. {w.name}</span>

              {adminMode && (
                <button
                  onClick={() => forceRemove(w, "waitlist")}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  강제삭제
                </button>
              )}
            </li>
          ))}
        </Section>

        {/* 관리자 */}
        <div className="bg-white p-3 rounded-xl shadow-md mt-6">
          {!adminMode ? (
            <>
              <input
                type="password"
                placeholder="관리자 비밀번호"
                className="w-full p-2 border rounded-xl mb-2"
                value={adminInput}
                onChange={(e) => setAdminInput(e.target.value)}
              />

              <button
                onClick={loginAdmin}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl"
              >
                관리자 모드 열기
              </button>
            </>
          ) : (
            <>
              <div className="font-bold mb-3 text-sm">🔐 관리자 모드</div>

              {/* 로그 기록 */}
              <div className="text-sm">
                <div className="font-semibold mb-2">📘 로그 기록</div>

                <div className="max-h-40 overflow-y-auto bg-white p-3 rounded-xl shadow-inner text-xs">
                  {logs.length === 0 && <div>로그 없음</div>}

                  {logs.map((log, idx) => (
                    <div
                      key={idx}
                      className="mb-1"
                      style={{
                        color:
                          log.type === "join"
                            ? "#000"
                            : log.type === "cancel"
                            ? "red"
                            : log.type === "promote"
                            ? "blue"
                            : "purple",
                      }}
                    >
                      {new Date(log.time.toDate()).toLocaleString()} —{" "}
                      {log.name} 님{" "}
                      {log.type === "join"
                        ? "참여"
                        : log.type === "cancel"
                        ? "취소"
                        : log.type === "promote"
                        ? "승급"
                        : "강제 삭제됨"}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// 접힘 컴포넌트
function Section({ title, count, children }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-sm font-semibold mb-2"
      >
        {title} ({count})
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="text-sm pl-5 list-disc bg-white rounded-xl p-3 shadow-inner">
          {children}
        </ul>
      )}
    </div>
  );
}
