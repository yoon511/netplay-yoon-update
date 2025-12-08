"use client";

import { useState } from "react";
import { db } from "@/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreatePollPage() {
  const router = useRouter();
  const params = useSearchParams();

  const user = {
    name: params.get("name") ?? "",
    grade: params.get("grade") ?? "",
    gender: params.get("gender") ?? "",
    guest: params.get("guest") === "true",
    pin: params.get("pin") ?? "",
  };

  const isAdmin = params.get("admin") === "true";

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    fee: "",
    capacity: "",
  });

  // 🔥 템플릿 저장 + 불러오기용 state
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // 🔥 템플릿 불러오기 함수
  async function loadTemplates() {
    const snap = await getDocs(collection(db, "templates"));
    const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setTemplates(arr);
    setShowTemplates(!showTemplates);
  }

  // 🔥 현재 폼 상태를 템플릿으로 저장
  async function saveTemplate() {
    if (!form.location) return alert("장소는 반드시 입력되어야 합니다.");

    await addDoc(collection(db, "templates"), {
      title: form.title || "이름 없는 템플릿",
      date: form.date,
      time: form.time,
      location: form.location,
      fee: form.fee,
      capacity: form.capacity,
    });

    alert("템플릿으로 저장되었습니다!");
  }

  // 🔥 새로운 투표 생성
  async function createPoll() {
    if (!form.date || !form.time || !form.location) {
      alert("필수 입력 항목이 비어 있습니다.");
      return;
    }

    const ref = await addDoc(collection(db, "polls"), {
      title: form.title || `${form.date} 넷플레이 모임`,
      date: form.date,
      time: form.time,
      location: form.location,
      fee: form.fee,
      capacity: Number(form.capacity),
      participants: [],
      waitlist: [],
      logs: [],
    });

    const q = new URLSearchParams({
      name: user.name,
      grade: user.grade,
      gender: user.gender,
      guest: String(user.guest),
      pin: user.pin,
      admin: String(isAdmin),
    }).toString();

    router.push(`/vote/${ref.id}?${q}`);
  }

  return (
    <main className="p-4 bg-[#FFF8F0] min-h-screen">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6">

        <h1 className="text-2xl font-bold text-red-500 mb-4">새 투표 만들기</h1>

        {/* 🔥 템플릿 불러오기 버튼 */}
        {isAdmin && (
          <button
            onClick={loadTemplates}
            className="w-full bg-gray-300 text-black py-2 rounded mb-3"
          >
            📂 템플릿 불러오기
          </button>
        )}

        {/* 🔥 템플릿 목록 박스 */}
        {showTemplates && templates.length > 0 && (
          <div className="bg-gray-100 p-3 rounded-xl space-y-2 mb-4 border">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setForm({
                    title: t.title,
                    date: t.date,
                    time: t.time,
                    location: t.location,
                    fee: t.fee,
                    capacity: t.capacity,
                  });
                  setShowTemplates(false);
                }}
                className="w-full bg-white p-2 border rounded text-left"
              >
                📌 {t.title}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {/* 제목 */}
          <input
            className="w-full p-3 border rounded"
            placeholder="제목 (선택)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          {/* 날짜 */}
          <div>
            <label className="text-sm font-bold">날짜 선택</label>
            <input
              type="date"
              className="w-full p-3 border rounded mt-1"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          {/* 시간 */}
          <input
            className="w-full p-3 border rounded"
            placeholder="시간 (예: 19:00~21:00)"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />

          {/* 장소 */}
          <input
            className="w-full p-3 border rounded"
            placeholder="장소"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          {/* 비용 */}
          <input
            className="w-full p-3 border rounded"
            placeholder="비용 (예: 일반 8000원 / 게스트 무료)"
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })}
          />

          {/* 정원 */}
          <input
            className="w-full p-3 border rounded"
            placeholder="정원 (숫자)"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />

          {/* 🔥 템플릿 저장 버튼 */}
          {isAdmin && (
            <button
              onClick={saveTemplate}
              className="w-full bg-blue-500 text-white py-2 rounded-xl font-bold"
            >
              💾 템플릿으로 저장
            </button>
          )}

          {/* 투표 생성 버튼 */}
          <button
            onClick={createPoll}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-bold mt-4"
          >
            투표 생성하기
          </button>
        </div>
      </div>
    </main>
  );
}
