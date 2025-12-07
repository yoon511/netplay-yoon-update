"use client";

import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

export default function AdminPage() {
  const ADMIN_PASS = "yoon511";

  // 로그인 상태
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPass, setInputPass] = useState("");

  // 입력값
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [fee, setFee] = useState("");

  // 템플릿
  const [templates, setTemplates] = useState<any[]>([]);

  async function loadTemplates() {
    const snap = await getDocs(collection(db, "templates"));
    const list: any[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    setTemplates(list);
  }

  useEffect(() => {
    if (authenticated) loadTemplates();
  }, [authenticated]);

  function tryLogin() {
    if (inputPass === ADMIN_PASS) {
      setAuthenticated(true);
    } else {
      alert("비밀번호가 틀렸습니다!");
    }
  }

  // 템플릿 저장
  async function saveTemplate() {
    if (!title || !time || !location || !capacity) {
      alert("템플릿에는 제목, 시간, 장소, 정원이 필요합니다.");
      return;
    }

    await addDoc(collection(db, "templates"), {
      title,
      date,
      time,
      location,
      capacity,
      fee,
      createdAt: Timestamp.now(),
    });

    alert("템플릿이 저장되었습니다.");
    loadTemplates();
  }

  // 템플릿 적용
  function applyTemplate(t: any) {
    setTitle(t.title);
    setDate(t.date);
    setTime(t.time);
    setLocation(t.location);
    setCapacity(t.capacity);
    setFee(t.fee);
  }

  async function deleteTemplate(id: string) {
    if (!confirm("정말 삭제할까요?")) return;
    await deleteDoc(doc(db, "templates", id));
    loadTemplates();
  }

  // 투표 생성
  async function createPoll() {
    if (!title || !date || !time || !location || !capacity) {
      return alert("필수 정보를 모두 입력하세요.");
    }

    await addDoc(collection(db, "polls"), {
      title,
      date,
      time,
      location,
      capacity: Number(capacity),
      fee,
      participants: [],
      waitlist: [],
      createdAt: Timestamp.now(),
    });

    alert("투표 생성 완료!");

    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setCapacity("");
    setFee("");
  }

  // 🔐 인증되지 않은 경우 → 비밀번호 입력창만 보여줌
  if (!authenticated) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-[#fffaf3] p-6">
        <div className="bg-white p-6 rounded-2xl shadow max-w-sm w-full">
          <h1 className="text-xl font-bold mb-4 text-center">관리자 로그인</h1>

          <input
            type="password"
            placeholder="관리자 비밀번호"
            value={inputPass}
            onChange={(e) => setInputPass(e.target.value)}
            className="w-full p-2 border rounded-xl mb-4"
          />

          <button
            onClick={tryLogin}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-xl"
          >
            로그인
          </button>
        </div>
      </main>
    );
  }

  // 🔓 인증된 경우 → 관리자 페이지 표시
  return (
    <main className="flex justify-center items-start min-h-screen bg-[#fffaf3] p-6">
      <div className="w-full max-w-md font-sans">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-red-400">Netplay 관리자 페이지</h1>
          <div className="text-sm text-gray-600">투표 생성 & 템플릿 관리</div>
        </div>

        {/* 투표 생성 */}
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
          <h2 className="font-semibold mb-3">투표 생성</h2>

          <input className="w-full p-2 border rounded-xl mb-2" placeholder="제목"
            value={title} onChange={(e) => setTitle(e.target.value)} />

          <input type="date" className="w-full p-2 border rounded-xl mb-2"
            value={date} onChange={(e) => setDate(e.target.value)} />

          <input className="w-full p-2 border rounded-xl mb-2" placeholder="시간(예: 18:00)"
            value={time} onChange={(e) => setTime(e.target.value)} />

          <input className="w-full p-2 border rounded-xl mb-2" placeholder="장소"
            value={location} onChange={(e) => setLocation(e.target.value)} />

          <input type="number" className="w-full p-2 border rounded-xl mb-2" placeholder="정원"
            value={capacity} onChange={(e) => setCapacity(e.target.value)} />

          <input className="w-full p-2 border rounded-xl mb-4" placeholder="비용"
            value={fee} onChange={(e) => setFee(e.target.value)} />

          <button onClick={createPoll}
            className="w-full bg-red-300 hover:bg-red-400 text-white py-2 rounded-xl mb-3">
            투표 생성하기
          </button>

          <button onClick={saveTemplate}
            className="w-full bg-blue-300 hover:bg-blue-400 text-white py-2 rounded-xl">
            템플릿으로 저장하기
          </button>
        </div>

        {/* 템플릿 목록 */}
        <div className="bg-white p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-3">저장된 템플릿</h2>

          {templates.length === 0 && (
            <div className="text-sm text-gray-500">저장된 템플릿이 없습니다.</div>
          )}

          {templates.map((t) => (
            <div key={t.id}
              className="p-3 mb-2 bg-[#f2f9f4] rounded-xl flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm">{t.title}</div>
                <div className="text-xs text-gray-600">
                  {t.time} · {t.location}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => applyTemplate(t)}
                  className="text-xs text-blue-500 hover:underline">
                  적용
                </button>

                <button onClick={() => deleteTemplate(t.id)}
                  className="text-xs text-red-500 hover:underline">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
