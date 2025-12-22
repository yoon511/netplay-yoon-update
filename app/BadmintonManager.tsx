"use client";

import { onValue, ref, set, runTransaction } from "firebase/database";
import { Clock, Plus, RotateCcw, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { db, rtdb } from "../firebase";
import { setDoc, doc } from "firebase/firestore";

// =========================
// 타입
// =========================
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
  counted?: boolean;
};

export default function BadmintonManager({
  user,
  isAdmin,
}: {
  user: {
    name: string;
    grade: string;
    gender: string;
    guest: boolean;
    pin: string;
  };
  isAdmin: boolean;
}) {
  // =========================
  // 상태
  // =========================
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([
    { id: 1, players: [], startTime: null, counted: false },
    { id: 2, players: [], startTime: null, counted: false },
    { id: 3, players: [], startTime: null, counted: false },
  ]);
  const [waitingQueues, setWaitingQueues] = useState<number[][]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 삭제 모달
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 🔥 관리자 추가 UI 토글
  const [showAdminAddBox, setShowAdminAddBox] = useState(false);

  // =========================
  // 시간 업데이트
  // =========================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // =========================
  // Firebase 실시간 불러오기
  // =========================
  useEffect(() => {
    const playersRef = ref(rtdb, "players");
    const courtsRef = ref(rtdb, "courts");
    const waitingRef = ref(rtdb, "waitingQueues");

    // 참가자
    const unsubPlayers = onValue(playersRef, (snap) => {
      const data = snap.val();
      if (!data) return setPlayers([]);

      const arr = Array.isArray(data) ? data : Object.values(data);
      setPlayers(
        arr.filter(Boolean).map((p: any) => ({
          id: p.id,
          name: p.name,
          grade: p.grade,
          gender: p.gender,
          guest: p.guest ?? false,
          pin: p.pin ?? "",
          playCount: p.playCount ?? 0,
        }))
      );
    });

    // 코트
    const unsubCourts =onValue(courtsRef, (snap) => {
      const data = snap.val();
      if (!data)
        return setCourts([
          { id: 1, players: [], startTime: null, counted: false },
          { id: 2, players: [], startTime: null, counted: false },
          { id: 3, players: [], startTime: null, counted: false },
        ]);

      const arr = Array.isArray(data) ? data : Object.values(data);
      setCourts(
        arr.map((c: any, i: number) => ({
          id: c.id ?? i + 1,
          players: Array.isArray(c.players) ? c.players.filter(Boolean) : [],
          startTime: typeof c.startTime === "number" ? c.startTime : null,
          counted: !!c.counted,
        }))
      );
    });

    // 대기열
    const unsubWaiting =onValue(waitingRef, (snap) => {
      const data = snap.val();
      if (!data) return setWaitingQueues([]);
      const arr = Array.isArray(data) ? data : Object.values(data);

      setWaitingQueues(
        arr.map((q: any) =>
          Array.isArray(q) ? q.filter((id) => typeof id === "number") : []
        )
      );
    });
   return () => {
    unsubPlayers();
    unsubCourts();
    unsubWaiting();
  };
}, []);

  // =========================
  // 저장 함수
  // =========================
  const savePlayers = (list: Player[]) => {
  set(ref(rtdb, "players"), list);
};


  

const saveSingleCourt = (courtId: number, court: Court) => {
  // courtId는 1,2,3 이고, 배열 인덱스는 0,1,2
  set(ref(rtdb, `courts/${courtId - 1}`), court);
};



  const saveWaiting = (list: number[][]) => {
  set(ref(rtdb, "waitingQueues"), list);
};


  // =========================
  // 참가하기 (사용자 자동 등록)
  // =========================
  const addPlayer = () => {
    if (!user.name || !user.pin) {
      return alert("사용자 정보 오류! 처음 화면에서 다시 접속해주세요.");
    }

    const exists = players.find(
      (p) => p.name === user.name && p.pin === user.pin
    );
    if (exists) return alert("이미 참가자 목록에 있습니다.");

    const newPlayer: Player = {
      id: Date.now(),
      name: user.name,
      grade: user.grade,
      gender: user.gender,
      guest: user.guest,
      pin: user.pin,
      playCount: 0,
    };

    savePlayers([...players, newPlayer]);
  };

  // =========================
  // 🔥 관리자 임의 추가 기능 (토글)
  // =========================
  const handleAdminAddPlayer = () => {
    const nameInput = document.getElementById("admName") as HTMLInputElement;
    const genderInput = document.getElementById("admGender") as HTMLSelectElement;
    const gradeInput = document.getElementById("admGrade") as HTMLSelectElement;
    const guestInput = document.getElementById("admGuest") as HTMLInputElement;

    const name = nameInput.value.trim();
    const gender = genderInput.value;
    const grade = gradeInput.value;
    const guest = guestInput.checked;

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

    savePlayers([...players, newPlayer]);

    nameInput.value = "";
    guestInput.checked = false;

    alert("추가되었습니다!");
  };
  // =========================
  // 안전한 구조들 Memo
  // =========================
  const safeCourts = useMemo(() => {
    return courts.map((c, i) => ({
      id: c.id ?? i + 1,
      players: Array.isArray(c.players) ? c.players.filter(Boolean) : [],
      startTime: typeof c.startTime === "number" ? c.startTime : null,
      counted: !!c.counted,
    }));
  }, [courts]);

  const safeWaitingQueues = useMemo(() => {
    const cleaned = waitingQueues.filter((q) => Array.isArray(q));
    if (cleaned.length === 0) cleaned.push([]);
    return cleaned.map((q) => q.slice(0, 4)); // 최대 4명
  }, [waitingQueues]);

  const playersInCourts = useMemo(() => {
    return new Set(
      safeCourts.flatMap((c) =>
        c.players.length ? c.players.map((p) => p.id) : []
      )
    );
  }, [safeCourts]);

  // =========================
  // 삭제 모달
  // =========================
  const openDeleteModal = (p: Player) => {
    const isSelf = p.name === user.name && p.pin === user.pin;
    if (!isAdmin && !isSelf) return alert("삭제 권한이 없습니다.");
    setDeleteTarget(p);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const isSelf = target.name === user.name && target.pin === user.pin;

    if (!isAdmin && !isSelf) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    // players에서 제거
    const updatedPlayers = players.filter((p) => p.id !== target.id);

    // 대기열에서 제거
    const updatedQueues = safeWaitingQueues.map((q) =>
      q.filter((id) => id !== target.id)
    );

    // 선택목록에서도 제거
    const updatedSelected = selectedPlayers.filter((id) => id !== target.id);

    savePlayers(updatedPlayers);
    saveWaiting(updatedQueues);
    setSelectedPlayers(updatedSelected);

    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // =========================
  // 선택 토글 (관리자)
  // =========================
  const togglePlayerSelection = (id: number) => {
    if (!isAdmin) return;
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter((x) => x !== id));
    } else {
      if (selectedPlayers.length >= 4) {
        alert("최대 4명까지 선택 가능합니다.");
        return;
      }
      setSelectedPlayers([...selectedPlayers, id]);
    }
  };

  // =========================
  // 대기열 관련
  // =========================
  const moveToNewWaitingQueue = () => {
    if (!isAdmin) return;
    if (selectedPlayers.length === 0) return alert("선택된 사용자가 없습니다.");
    if (selectedPlayers.length > 4) return alert("대기는 4명까지");

    const newQueues = [...safeWaitingQueues, selectedPlayers];
    saveWaiting(newQueues);
    setSelectedPlayers([]);
  };

  const addSelectedToQueue = (qIndex: number) => {
    if (!isAdmin) return;
    if (selectedPlayers.length === 0) return alert("선택된 사용자가 없습니다.");

    const cur = safeWaitingQueues[qIndex];
    const incoming = selectedPlayers.filter((id) => !cur.includes(id));

    if (cur.length + incoming.length > 4) return alert("대기는 4명까지입니다.");

    const newQueues = [...safeWaitingQueues];
    newQueues[qIndex] = [...cur, ...incoming];

    saveWaiting(newQueues);
    setSelectedPlayers([]);
  };

  const removeFromWaitingQueue = (id: number, qIndex: number) => {
    if (!isAdmin) return;
    const newQ = [...safeWaitingQueues];
    newQ[qIndex] = newQ[qIndex].filter((x) => x !== id);
    saveWaiting(newQ);
  };

  // =========================
  // 코트 배정
  // =========================
  const assignToCourt = (courtId: number, qIndex: number) => {
    if (!isAdmin) return;

    const queue = safeWaitingQueues[qIndex];
    if (!queue || queue.length !== 4)
      return alert("게임 시작은 4명일 때만 가능합니다.");

    const selected = players.filter((p) => queue.includes(p.id));

    saveSingleCourt(courtId, {
  id: courtId,
  players: selected,
  startTime: Date.now(),
  counted: false,
});


    // 대기열 비우기
    runTransaction(ref(rtdb, "waitingQueues"), (current) => {
  const arr = Array.isArray(current) ? current : [];
  if (!arr[qIndex] || arr[qIndex].length !== 4) {
    // 누군가가 먼저 가져갔거나 상태가 바뀜 → 취소
    return current;
  }
  const next = [...arr];
  next[qIndex] = [];
  return next;
});
  };

  // =========================
  // 코트 비우기
  // =========================
  const clearCourt = (courtId: number) => {
    if (!isAdmin) return;

    saveSingleCourt(courtId, {
  id: courtId,
  players: [],
  startTime: null,
  counted: false,
});

  };

  // =========================
  // 경과시간 표기
  // =========================
  const getElapsedTime = (start: number | null) => {
    if (!start) return "00:00";
    const diff = Math.floor((Date.now() - start) / 1000);
    const m = String(Math.floor(diff / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // =========================
  // UI 렌더링
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F4FF] to-[#D6E8FF] p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-6">

        {/* 🔵 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3 items-center">
            <Users className="w-8 h-8 text-[#7DB9FF]" />
            <h1 className="text-3xl font-bold text-[#333333]">
              넷플레이 게임판 - 윤
            </h1>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (confirm("전체 초기화하시겠습니까?")) {
                  savePlayers([]);
                  set(ref(rtdb, "courts"), [
  { id: 1, players: [], startTime: null, counted: false },
  { id: 2, players: [], startTime: null, counted: false },
  { id: 3, players: [], startTime: null, counted: false },
]);

                  saveWaiting([]);
                  setSelectedPlayers([]);
                }
              }}
              className="px-4 py-2 bg-[#FFB2B2] text-white rounded-lg flex gap-2 items-center"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
          )}
        </div>

        {/* 🟦 참가하기 버튼 */}
        <div className="mb-6">
          <button
            onClick={addPlayer}
            className="w-full py-3 bg-[#7DB9FF] text-white rounded-xl font-bold flex gap-2 justify-center items-center"
          >
            <Plus className="w-5 h-5" />
            참가하기
          </button>
        </div>

        {/* 🟨 관리자: 사람 추가 토글 버튼 */}
        {isAdmin && (
          <div className="mb-4">
            <button
              onClick={() => setShowAdminAddBox(!showAdminAddBox)}
              className="w-full py-2 rounded-xl font-bold bg-[#FFE27A] text-[#333333]"
            >
              {showAdminAddBox ? "▲ 관리자 추가 닫기" : "▼ 관리자: 사람 추가하기"}
            </button>

            {showAdminAddBox && (
              <div className="mt-3 bg-[#FFF9DB] p-4 rounded-xl border border-[#FFE9A6]">
                <input
                  id="admName"
                  placeholder="이름"
                  className="w-full p-2 border rounded-lg mb-2"
                />
                <select
                  id="admGender"
                  className="w-full p-2 border rounded-lg mb-2"
                >
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
                <select
                  id="admGrade"
                  className="w-full p-2 border rounded-lg mb-2"
                >
                  <option>A조</option>
                  <option>B조</option>
                  <option>C조</option>
                  <option>D조</option>
                  <option>E조</option>
                </select>

                <label className="flex items-center gap-2 mb-3 text-sm">
                  <input id="admGuest" type="checkbox" />
                  게스트 여부
                </label>

                <button
                  onClick={handleAdminAddPlayer}
                  className="w-full bg-[#7DB9FF] text-white py-2 rounded-lg font-bold"
                >
                  추가하기
                </button>
              </div>
            )}
          </div>
        )}
        {/* ============================
            전체 참가자 리스트
        ============================ */}
        <h2 className="font-bold text-lg mb-3 text-[#333333]">
          전체 참가자 ({players.length}명)
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {players.map((p) => {
            const isWaiting = safeWaitingQueues.some((q) => q.includes(p.id));
            const isSelected = selectedPlayers.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() =>
                  isAdmin && !isWaiting && togglePlayerSelection(p.id)
                }
                className={`
                  p-4 rounded-xl border relative transition
                  ${
                    p.gender === "남"
                      ? "bg-[#D9EDFF] border-[#A7D8FF]"
                      : "bg-[#FFE7EE] border-[#FFD2E1]"
                  }
                  ${isSelected ? "ring-4 ring-[#FFF7B2]" : ""}
                  ${isWaiting ? "opacity-40" : ""}
                `}
              >
                {/* 삭제버튼 */}
                {(isAdmin || (p.name === user.name && p.pin === user.pin)) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(p);
                    }}
                    className="absolute top-2 right-2 bg-[#FF8A8A] text-white p-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                <div className="font-bold text-[#333]">
                  {p.name} {p.guest && "(게스트)"}
                </div>
                <div className="text-sm font-semibold text-[#333]">{p.grade}</div>
                <div className="text-xs mt-1 font-semibold text-[#333]">
                  참여: {p.playCount}회
                </div>

                {playersInCourts.has(p.id) && (
                  <div className="absolute top-1 left-1 bg-black bg-opacity-40 text-white text-xs px-2 py-0.5 rounded">
                    플레이 중
                  </div>
                )}
                {isWaiting && (
                  <div className="absolute top-1 left-1 bg-[#FFC870] text-white text-xs px-2 py-0.5 rounded">
                    대기 중
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ============================
            선택된 인원 → 새 대기열 만들기
        ============================ */}
        {isAdmin && selectedPlayers.length > 0 && (
          <div className="mb-6">
            <div className="text-center font-semibold text-[#333] mb-2">
              선택된 인원: {selectedPlayers.length}명
            </div>
            <button
              onClick={moveToNewWaitingQueue}
              className="w-full py-2 rounded-xl font-bold bg-[#FFD76B] text-[#333]"
            >
              새 대기 만들기
            </button>
          </div>
        )}

        {/* ============================
            대기열 UI
        ============================ */}
        <h2 className="font-bold text-lg mb-3 text-[#333]">대기 현황</h2>

        {safeWaitingQueues.map((q, i) => (
          <div
            key={i}
            className="bg-[#FFF7B2] border border-[#FFEFA1] rounded-xl p-4 mb-3"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-[#333]">대기 {i + 1}</span>
              <span className="font-semibold text-[#333]">{q.length}/4명</span>
            </div>

            {isAdmin && selectedPlayers.length > 0 && q.length < 4 && (
              <button
                onClick={() => addSelectedToQueue(i)}
                className="w-full py-2 rounded-xl text-sm font-bold bg-[#FFD76B] text-[#333]"
              >
                선택된 {selectedPlayers.length}명 추가
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              {q.map((id) => {
                const p = players.find((x) => x.id === id);
                if (!p) return null;

                return (
                  <div
                    key={id}
                    className={`
                      p-2 rounded text-sm font-semibold relative
                      ${p.gender === "남" ? "bg-[#A7D8FF]" : "bg-[#FFD2E1]"}
                    `}
                  >
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWaitingQueue(id, i);
                        }}
                        className="absolute top-1 right-1 bg-[#FF8A8A] text-white p-0.5 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {p.name} {p.guest && "(게스트)"} ({p.grade})
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ============================
            코트 UI
        ============================ */}
        <h2 className="font-bold text-lg mb-3 text-[#333]">코트 현황</h2>

        {safeCourts.map((court) => (
          <div
            key={court.id}
            className="bg-[#CDEBFF] border border-[#B8E0FF] rounded-xl p-4 mb-3"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-[#333]">코트 {court.id}</h3>

              {court.startTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7DB9FF]" />
                  <span className="font-mono font-bold text-[#333]">
                    {getElapsedTime(court.startTime)}
                  </span>
                </div>
              )}
            </div>

            {/* 빈 코트 */}
            {!court.players.length ? (
              <>
                <div className="text-center font-semibold text-[#333] mb-2">
                  빈 코트
                </div>
                <div className="flex gap-2">
                  {safeWaitingQueues.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => assignToCourt(court.id, idx)}
                      disabled={!isAdmin || q.length !== 4}
                      className={`flex-1 py-2 rounded-xl font-bold ${
                        isAdmin && q.length === 4
                          ? "bg-[#7DB9FF] text-white"
                          : "bg-gray-300 text-[#333]"
                      }`}
                    >
                      대기 {idx + 1}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {court.players.map((p) => (
                    <div
                      key={p.id}
                      className={`p-2 rounded text-sm font-bold ${
                        p.gender === "남" ? "bg-[#A7D8FF]" : "bg-[#FFD2E1]"
                      }`}
                    >
                      {p.name} {p.guest && "(게스트)"} ({p.grade})
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => clearCourt(court.id)}
                    className="w-full py-2 bg-[#FF8A8A] text-white rounded-xl font-bold"
                  >
                    코트 비우기
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* ============================
          삭제 모달
      ============================ */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-80 rounded-2xl p-6 shadow-xl">
            <div className="text-lg font-bold mb-3 text-center">
              정말 삭제하시겠습니까?
            </div>
            <div className="text-sm text-gray-700 mb-5 text-center">
              <b>{deleteTarget.name}</b> 님을 목록에서 제거합니다.
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2 bg-gray-200 rounded-xl font-semibold"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-400 text-white rounded-xl font-semibold"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
