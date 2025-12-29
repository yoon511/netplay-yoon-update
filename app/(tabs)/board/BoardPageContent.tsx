"use client";

import { rtdb } from "@/firebase";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";


import {
  onValue,
  ref,
  off,
  runTransaction
} from "firebase/database";


import { ChevronDown, ChevronUp, Clock, Plus, RotateCcw, Users, X } from "lucide-react";

type Player = {
  id: number;
  name: string;
  grade: string;
  gender: string;
  guest: boolean;
  pin: string;
  playCount: number;
};

type Court = {
  id: number;
  players: Player[];
  startTime: number | null;

  sessionId: number | null;        // 게임 고유 ID
  countedSessionId: number | null; // 참여횟수 처리 완료된 게임 ID
};



export default function BoardPageContent() {
  const params = useSearchParams();

  const user = {
    name: params.get("name") ?? "",
    grade: params.get("grade") ?? "",
    gender: params.get("gender") ?? "",
    guest: params.get("guest") === "true",
    pin: params.get("pin") ?? "",
  };

  const isAdmin = params.get("admin") === "true";

  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([
  { id: 1, players: [], startTime: null, sessionId: null, countedSessionId: null },
  { id: 2, players: [], startTime: null, sessionId: null, countedSessionId: null },
  { id: 3, players: [], startTime: null, sessionId: null, countedSessionId: null },
]);

  const [waitingQueues, setWaitingQueues] = useState<number[][]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminBox, setShowAdminBox] = useState(false);
  const [showPlayersList, setShowPlayersList] = useState(true);

  const [currentTime, setCurrentTime] = useState(Date.now());

  /** 시간 흐름 */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /** Firebase RTDB 구독 */
  useEffect(() => {
  const pRef = ref(rtdb, "players");
  const cRef = ref(rtdb, "courts");
  const wRef = ref(rtdb, "waitingQueues");

  onValue(pRef, (snap) => {
    const data = snap.val();
    if (!data) return setPlayers([]);
    const arr = Array.isArray(data) ? data : Object.values(data);
    setPlayers(arr.filter(Boolean));
  });

  onValue(cRef, (snap) => {
  const data = snap.val();
  if (!data) return;

  const arr = Array.isArray(data) ? data : Object.values(data);

  setCourts(
    arr.map((c: any, i) => ({
      id: c.id ?? i + 1,
      players: Array.isArray(c.players) ? c.players.filter(Boolean) : [],
      startTime: typeof c.startTime === "number" ? c.startTime : null,

      // ✅ 게임 단위 식별
      sessionId:
        typeof c.sessionId === "number" ? c.sessionId : null,

      // ✅ 이 게임이 이미 카운트 되었는지 여부
      countedSessionId:
        typeof c.countedSessionId === "number"
          ? c.countedSessionId
          : null,
    }))
  );
});


  onValue(wRef, (snap) => {
    const data = snap.val();
    if (!data) return setWaitingQueues([]);
    const arr = Array.isArray(data) ? data : Object.values(data);
    setWaitingQueues(arr.map((q: any) => Array.isArray(q) ? q : []));
  });

  return () => {
    off(pRef);
    off(cRef);
    off(wRef);
  };
}, []);


  /** 저장 함수 */
 /** =========================
 *  ✅ RTDB 트랜잭션 기반 저장 (충돌 방지)
 *  - 배열 전체 set 금지
 *  - 관리자 2명/참가자 다수 동시操作 안전
 *  ========================= */

const txPlayers = async (mutate: (arr: Player[]) => Player[]) => {
  await runTransaction(ref(rtdb, "players"), (cur) => {
    const arr: Player[] = Array.isArray(cur) ? cur.filter(Boolean) : [];
    return mutate(arr);
  });
};

const txWaiting = async (mutate: (arr: number[][]) => number[][]) => {
  await runTransaction(ref(rtdb, "waitingQueues"), (cur) => {
    const arr: number[][] = Array.isArray(cur)
      ? cur.map((q) => (Array.isArray(q) ? q.filter((x) => typeof x === "number") : [])).filter(Boolean)
      : [];
    return mutate(arr);
  });
};

const txCourt = async (courtIndex: number, mutate: (c: Court) => Court) => {
  await runTransaction(ref(rtdb, `courts/${courtIndex}`), (cur) => {
    const base: Court =
  cur && typeof cur === "object"
    ? {
        id: cur.id ?? courtIndex + 1,
        players: Array.isArray(cur.players) ? cur.players.filter(Boolean) : [],
        startTime: typeof cur.startTime === "number" ? cur.startTime : null,
        sessionId: typeof cur.sessionId === "number" ? cur.sessionId : null,
        countedSessionId:
          typeof cur.countedSessionId === "number" ? cur.countedSessionId : null,
      }
    : {
        id: courtIndex + 1,
        players: [],
        startTime: null,
        sessionId: null,
        countedSessionId: null,
      };

    return mutate(base);
  });
};


  /** 참가 버튼 */
  const addPlayer = () => {
    if (!user.name || !user.pin) {
      alert("사용자 정보 오류! 처음 화면에서 로그인해주세요.");
      return;
    }

    const exist = players.find((p) => p.name === user.name && p.pin === user.pin);
    if (exist) return alert("이미 참가 중입니다!");

    const newP: Player = {
      id: Date.now(),
      name: user.name,
      grade: user.grade,
      gender: user.gender,
      guest: user.guest,
      pin: user.pin,
      playCount: 0,
    };
    txPlayers((arr) => {
  const exist = arr.find((p) => p.name === user.name && p.pin === user.pin);
  if (exist) return arr;
  return [...arr, newP];
});
  };

  /** 관리자 임의 추가 */
  const adminAddPlayer = () => {
    const name = (document.getElementById("admName") as HTMLInputElement).value.trim();
    const gender = (document.getElementById("admGender") as HTMLSelectElement).value;
    const grade = (document.getElementById("admGrade") as HTMLSelectElement).value;
    const guest = (document.getElementById("admGuest") as HTMLInputElement).checked;

    if (!name) return alert("이름을 입력하세요.");

    const newPlayer: Player = {
      id: Date.now(),
      name,
      grade,
      gender,
      guest,
      pin: "",
      playCount: 0,
    };

    txPlayers((arr) => {
  if (arr.some((p) => p.name === name && p.guest === guest)) return arr;
  return [...arr, newPlayer];
});

alert("추가되었습니다!");


  };

  /** 안전 구조 */
  const safeCourts = useMemo(() => {
    return courts.map((c) => ({
      ...c,
      players: c.players.filter(Boolean),
    }));
  }, [courts]);

  const safeWaitingQueues = useMemo(() => {
    const cleaned = waitingQueues.filter((q) => Array.isArray(q));
    if (cleaned.length === 0) cleaned.push([]);
    return cleaned.map((q) => q.slice(0, 4));
  }, [waitingQueues]);

  const playersInCourts = useMemo(() => {
    return new Set(
      safeCourts.flatMap((c) => c.players.map((p) => p.id))
    );
  }, [safeCourts]);

  /** 삭제 모달 */
  const openDeleteModal = (p: Player) => {
    if (!isAdmin && !(p.name === user.name && p.pin === user.pin)) {
      return alert("삭제 권한이 없습니다.");
    }
    setDeleteTarget(p);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const p = deleteTarget;
    const newSelected = selectedPlayers.filter((x) => x !== p.id);

    txPlayers((arr) => arr.filter((x) => x.id !== p.id));
txWaiting((arr) => arr.map((q) => q.filter((x) => x !== p.id)));
// 🔥 코트에 있던 경우도 제거
safeCourts.forEach((court, idx) => {
  if (court.players.some((x) => x.id === p.id)) {
    txCourt(idx, (c) => ({
  ...c,
  players: c.players.filter((x) => x.id !== p.id),
  // 혹시 게임 중이었다면 카운트 상태는 그대로 유지
  sessionId: c.sessionId,
  countedSessionId: c.countedSessionId,
}));
  }
});

    setSelectedPlayers(newSelected);
    setDeleteTarget(null);
    setShowDeleteModal(false);
  };

  /** 선택 토글 */
  const toggleSelect = (id: number) => {
    if (!isAdmin) return;
    if (selectedPlayers.includes(id))
      setSelectedPlayers(selectedPlayers.filter((x) => x !== id));
    else {
      if (selectedPlayers.length >= 4) return alert("4명까지 선택 가능");
      setSelectedPlayers([...selectedPlayers, id]);
    }
  };

  /** 대기열 생성 */
  const moveToNewQueue = () => {
    if (!isAdmin) return;
    if (selectedPlayers.length === 0) return alert("선택 없음");
    if (selectedPlayers.length > 4) return alert("4명 제한");

    txWaiting((arr) => {
  const used = new Set(arr.flat());
  const filtered = selectedPlayers.filter((id) => !used.has(id));
  if (filtered.length === 0) return arr;
  return [...arr, filtered.slice(0, 4)];
});

setSelectedPlayers([]);


  };

  /** 대기열 추가 */
  const addToQueue = (idx: number) => {
  if (!isAdmin) return;

  txWaiting((arr) => {
    const base = Array.isArray(arr[idx]) ? arr[idx] : [];

    // ✅ 이미 다른 대기열에 들어간 사람은 추가 금지
    const used = new Set(arr.flat());
    const incoming = selectedPlayers.filter(
      (id) => !base.includes(id) && !used.has(id)
    );

    if (base.length + incoming.length > 4) return arr;

    const next = [...arr];
    next[idx] = [...base, ...incoming].slice(0, 4);
    return next;
  });

  setSelectedPlayers([]);
};


  /** 대기열 삭제 */
  const removeFromQueue = (id: number, idx: number) => {
  if (!isAdmin) return;

  txWaiting((arr) => {
    const next = [...arr];
    if (!Array.isArray(next[idx])) return arr;
    next[idx] = next[idx].filter((x) => x !== id);
    return next;
  });
};


  /** 코트 배정 */
const assignToCourt = async (courtId: number, idx: number) => {
  if (!isAdmin) return;

  const q = safeWaitingQueues[idx];
  if (q.length !== 4) return alert("4명일 때만 가능");

  const assigned = players.filter((p) => q.includes(p.id));
  const courtIndex = safeCourts.findIndex((c) => c.id === courtId);
  if (courtIndex === -1) return;
 
  const newSessionId = Date.now();

  let success = false;
  await runTransaction(ref(rtdb, `courts/${courtIndex}`), (cur) => {
    // ✅ 이미 게임 중이면 절대 덮어쓰지 않음 (관리자 충돌 방지)
    if (cur && Array.isArray(cur.players) && cur.players.length > 0) return cur;

    success = true;
    return {
      id: courtId,
      players: assigned,
      startTime: Date.now(),
      sessionId: newSessionId,
      countedSessionId: null,
    };
  });

  if (!success) {
    alert("다른 관리자가 먼저 코트에 배정했어요. 화면을 확인해주세요.");
    return;
  }

  // ✅ 대기열 비우기 (최신 DB 기준)
  await txWaiting((arr) => {
    const next = [...arr];
    const live = Array.isArray(next[idx]) ? next[idx] : [];
    if (live.length !== 4) return arr;
    next[idx] = [];
    return next;
  });
};



  /** 코트 비우기 */
 const endGameAndCount = async (courtId: number) => {
  if (!isAdmin) return;

  const courtIndex = safeCourts.findIndex((c) => c.id === courtId);
  if (courtIndex === -1) return;

  const court = safeCourts[courtIndex];
  if (!court.players || court.players.length === 0) return;

  if (!confirm("정말 게임이 정상 종료되었나요?\n참여 횟수가 추가됩니다.")) {
    return;
  }

  // 🔒 중복 방지
  if (court.countedSessionId === court.sessionId) {
    alert("이미 카운트된 게임입니다.");
    return;
  }

  const playerIds = court.players.map((p) => p.id);
  const idSet = new Set(playerIds);

  // ✅ 1) 참여 횟수 +1
  await txPlayers((arr) =>
    arr.map((p) =>
      idSet.has(p.id)
        ? { ...p, playCount: (p.playCount ?? 0) + 1 }
        : p
    )
  );

  // ✅ 2) 코트 정리 + countedSessionId 기록
  await txCourt(courtIndex, (c) => ({
    ...c,
    players: [],
    startTime: null,
    countedSessionId: c.sessionId,
    sessionId: null,
  }));
};

const forceClearCourt = async (courtId: number) => {
  if (!isAdmin) return;

  const courtIndex = safeCourts.findIndex((c) => c.id === courtId);
  if (courtIndex === -1) return;

  if (!confirm("강제로 코트를 비웁니다.\n게임 횟수는 추가되지 않습니다.")) {
    return;
  }

  await txCourt(courtIndex, (c) => ({
    ...c,
    players: [],
    startTime: null,
    sessionId: null,
    countedSessionId: null,
  }));
};


  /** 경과 시간 표시 */
  const elapsed = (startTime: number | null) => {
    if (!startTime) return "00:00";
    const diff = Math.floor((currentTime - startTime) / 1000);
    const m = String(Math.floor(diff / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  /** UI */
  return (
    <main className="p-4 pb-20 bg-gradient-to-br from-[#E9F4FF] to-[#D6E8FF] min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 items-center">
            <Users className="w-8 h-8 text-[#7DB9FF]" />
            <h1 className="text-2xl font-bold">넷플레이 게임판</h1>
          </div>

          {isAdmin && (
  <button
    onClick={async () => {
      if (!confirm("전체 초기화?")) return;

      await runTransaction(ref(rtdb, "players"), () => []);
      await runTransaction(ref(rtdb, "waitingQueues"), () => []);
      setSelectedPlayers([]);

      await Promise.all(
  [0, 1, 2].map((idx) =>
    txCourt(idx, (c) => ({
      ...c,
      players: [],
      startTime: null,
      sessionId: null,
      countedSessionId: null,
    }))
  )
);

    }}
    className="bg-red-300 text-white px-4 py-2 rounded-xl flex items-center gap-2"
  >
    <RotateCcw className="w-4 h-4" /> 초기화
  </button>
)}

        </div>

        {/* 참가하기 */}
        <button
          onClick={addPlayer}
          className="w-full py-3 bg-[#7DB9FF] text-white rounded-xl font-bold mb-6 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> 참가하기
        </button>

        {/* 관리자 추가 */}
        {isAdmin && (
          <>
            <button
              onClick={() => setShowAdminBox(!showAdminBox)}
              className="w-full py-2 bg-yellow-300 rounded-xl font-bold mb-4"
            >
              {showAdminBox ? "▲ 관리자 추가 닫기" : "▼ 관리자: 사람 추가"}
            </button>

            {showAdminBox && (
              <div className="bg-yellow-100 p-4 rounded-xl border mb-4">
                <input id="admName" className="w-full border p-2 rounded mb-2" placeholder="이름" />
                <select id="admGender" className="w-full border p-2 rounded mb-2">
                  <option>남</option>
                  <option>여</option>
                </select>
                <select id="admGrade" className="w-full border p-2 rounded mb-2">
                  <option>A조</option>
                  <option>B조</option>
                  <option>C조</option>
                  <option>D조</option>
                  <option>E조</option>
                </select>
                <label className="flex items-center gap-2 mb-3 text-sm">
                  <input id="admGuest" type="checkbox" /> 게스트 여부
                </label>
                <button
                  onClick={adminAddPlayer}
                  className="w-full py-2 bg-blue-400 text-white rounded-xl font-bold"
                >
                  추가
                </button>
              </div>
            )}
          </>
        )}

        {/* 참가자 목록 */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg">전체 참가자 ({players.length})</h2>
          <button
            onClick={() => setShowPlayersList(!showPlayersList)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
          >
            {showPlayersList ? (
              <>
                <span className="text-sm">접기</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span className="text-sm">펼치기</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {showPlayersList && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {players.map((p) => {
            const isWaiting = safeWaitingQueues.some((q) => q.includes(p.id));
            const isSel = selectedPlayers.includes(p.id);

            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border relative cursor-pointer
  ${p.gender === "남"
    ? "bg-blue-100 border-blue-300"
    : "bg-pink-100 border-pink-300"}
  ${isSel ? "ring-4 ring-yellow-200" : ""}
  ${isWaiting ? "opacity-40" : ""}
  ${playersInCourts.has(p.id)
    ? "border-red-300 ring-2 ring-red-200"
    : ""}
`}

                onClick={() => !isWaiting && isAdmin && toggleSelect(p.id)}
              >
                {(isAdmin || (p.name === user.name && p.pin === user.pin)) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(p);
                    }}
                    className="absolute top-2 right-2 bg-red-400 text-white p-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                <div className="font-bold">{p.name} {p.guest && "(게스트)"}</div>
                <div className="text-sm">{p.grade}</div>
                <div className="text-xs mt-1">참여: {p.playCount}회</div>

                {playersInCourts.has(p.id) && (
                  <div className="absolute top-1 left-1 bg-black bg-opacity-40 text-white text-xs px-2 rounded">
                    플레이 중
                  </div>
                )}
                {isWaiting && (
                  <div className="absolute top-1 left-1 bg-yellow-400 text-white text-xs px-2 rounded">
                    대기 중
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {/* 선택된 인원 → 새 대기 */}
        {isAdmin && selectedPlayers.length > 0 && (
          <button
            onClick={moveToNewQueue}
            className="w-full py-2 mb-6 bg-yellow-300 rounded-xl font-bold"
          >
            새 대기 생성 ({selectedPlayers.length}명)
          </button>
        )}

        {/* 대기열 */}
        <h2 className="font-bold text-lg mb-3">대기 현황</h2>

        {safeWaitingQueues.map((q, idx) => (
          <div key={idx} className="bg-yellow-100 p-4 rounded-xl border mb-3">
            <div className="flex justify-between mb-2">
              <span className="font-bold">대기 {idx + 1}</span>
              <span>{q.length}/4명</span>
            </div>

            {isAdmin && selectedPlayers.length > 0 && q.length < 4 && (
              <button
                className="w-full py-2 bg-yellow-300 rounded-xl mb-2"
                onClick={() => addToQueue(idx)}
              >
                선택된 인원 추가
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {q.map((id) => {
                const p = players.find((x) => x.id === id);
                if (!p) return null;

                return (
                  <div
                    key={id}
                    className={`p-2 rounded text-sm font-bold border
  ${p.gender === "남" ? "bg-blue-200" : "bg-pink-200"}
  ${playersInCourts.has(p.id)
    ? "border-red-600 ring-2 ring-red-300"
    : "border-transparent"}
  relative`}

                  >
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(id, idx);
                        }}
                        className="absolute top-1 right-1 text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {p.name} ({p.grade})
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 코트 */}
        <h2 className="font-bold text-lg mb-3">코트 현황</h2>

        {safeCourts.map((court) => (
          <div
  key={court.id}
  className={`p-4 rounded-xl border mb-3 transition
    ${court.players.length > 0
      ? "border-red-400 ring-4 ring-red-200 bg-red-50"
      : "border-blue-300 bg-blue-100"}
  `}
>
            <div className="flex justify-between mb-2">
              <span className="font-bold">코트 {court.id}</span>
              {court.startTime && (
                <span className="font-mono text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {elapsed(court.startTime)}
                </span>
              )}
            </div>

            {court.players.length === 0 ? (
              <div>
                <div className="text-center text-sm mb-2">빈 코트</div>
                <div className="flex gap-2">
                  {safeWaitingQueues.map((q, idx) => (
                    <button
                      key={idx}
                      disabled={!isAdmin || q.length !== 4}
                      onClick={() => assignToCourt(court.id, idx)}
                      className={`flex-1 py-2 rounded-xl font-bold ${
                        isAdmin && q.length === 4
                          ? "bg-blue-400 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      대기 {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {court.players.map((p) => (
                    <div
                      key={p.id}
                      className={`p-2 rounded text-sm font-bold border
  ${p.gender === "남" ? "bg-blue-200" : "bg-pink-200"}
  ${playersInCourts.has(p.id)
    ? "border-red-400 ring-2 ring-red-300"
    : "border-transparent"}
`}

                    >
                      {p.name} ({p.grade})
                    </div>
                  ))}
                </div>
{isAdmin && (
  <div className="flex gap-2">
    <button
      onClick={() => endGameAndCount(court.id)}
      className="flex-1 py-2 bg-emerald-200 text-emerald-900 rounded-xl font-bold hover:bg-emerald-300 transition"
    >
      게임 종료
      <br />
      (횟수 추가)
    </button>

    <button
      onClick={() => forceClearCourt(court.id)}
      className="flex-1 py-2 bg-rose-200 text-rose-900 rounded-xl font-bold hover:bg-rose-300 transition"
    >
      코트 비우기
    </button>
  </div>
)}

                
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 삭제 모달 */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-72">
            <h2 className="font-bold text-center mb-3">정말 삭제할까요?</h2>
            <p className="text-center text-sm mb-4">{deleteTarget.name} 님 제거</p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 bg-gray-200 rounded-xl"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-400 text-white rounded-xl"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

