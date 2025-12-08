"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EntrancePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("A조");
  const [gender, setGender] = useState("남");
  const [guest, setGuest] = useState(false);
  const [pin, setPin] = useState("");

  const [adminChecked, setAdminChecked] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const ADMIN_PASSWORD = "yoon511";

  function enterSite() {
    if (!name) return alert("이름을 입력하세요.");
    if (!pin || pin.length !== 4) return alert("비밀번호 4자리를 입력하세요.");

    let isAdmin = false;

    // 🔥 관리자 모드 체크 시 → 비밀번호 검증
    if (adminChecked) {
      if (adminPass !== ADMIN_PASSWORD) {
        alert("관리자 비밀번호가 틀렸습니다!");
        return;
      }
      isAdmin = true;
    }

    // 🔗 Menu 페이지로 모든 정보 전달
    const query = `name=${encodeURIComponent(name)}&grade=${encodeURIComponent(
      grade
    )}&gender=${encodeURIComponent(gender)}&guest=${guest}&pin=${pin}&admin=${isAdmin}`;

    router.push(`/menu?${query}`);
  }

  return (
    <main className="flex justify-center items-center min-h-screen bg-[#fdfbf6] p-6">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow font-sans">

        <h1 className="text-xl font-bold mb-6 text-center text-red-400">
          Netplay 접속하기 🏸
        </h1>

        {/* 이름 */}
        <input
          className="w-full p-2 border rounded-xl mb-3"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* 급수 */}
        <select
          className="w-full p-2 border rounded-xl mb-3"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option>A조</option>
          <option>B조</option>
          <option>C조</option>
          <option>D조</option>
          <option>E조</option>
        </select>

        {/* 성별 */}
        <select
          className="w-full p-2 border rounded-xl mb-3"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option>남</option>
          <option>여</option>
        </select>

        {/* 게스트 */}
        <label className="flex items-center gap-2 mb-3 text-sm">
          <input
            type="checkbox"
            checked={guest}
            onChange={() => setGuest(!guest)}
          />
          게스트 여부
        </label>

        {/* 🔥 관리자 체크박스 */}
        <label className="flex items-center gap-2 mb-3 text-sm">
          <input
            type="checkbox"
            checked={adminChecked}
            onChange={() => setAdminChecked(!adminChecked)}
          />
          관리자 모드로 접속하기
        </label>

        {/* 🔥 관리자 비밀번호 입력창 (체크했을 때만 보임) */}
        {adminChecked && (
          <input
            className="w-full p-2 border rounded-xl mb-3"
            type="password"
            placeholder="관리자 비밀번호 입력"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
          />
        )}

        {/* 비밀번호 */}
        <input
          className="w-full p-2 border rounded-xl mb-6"
          placeholder="비밀번호 4자리"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        {/* 접속 버튼 */}
        <button
          className="w-full bg-red-300 hover:bg-red-400 text-white py-3 rounded-2xl"
          onClick={enterSite}
        >
          접속하기
        </button>

      </div>
    </main>
  );
}
