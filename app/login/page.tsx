"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Lock, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [grade, setGrade] = useState("A조");
  const [gender, setGender] = useState("남");
  const [guest, setGuest] = useState(false);

  const login = () => {
    if (!name || !pin) {
      alert("이름과 PIN을 입력해주세요!");
      return;
    }

    const query = `name=${name}&pin=${pin}&grade=${grade}&gender=${gender}&guest=${guest}`;
    router.push(`/vote?${query}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F7] to-[#E5F0FF] flex items-center justify-center px-6">
      
      {/* 전체 카드 */}
      <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-8 text-center">
        
        {/* 제목 */}
        <h1 className="text-4xl font-bold text-[#333] mb-6">
          👋 넷플레이 접속하기
        </h1>

        {/* 이름 */}
        <div className="mb-4 text-left">
          <label className="font-semibold text-[#444]">이름</label>
          <div className="flex items-center bg-gray-100 rounded-xl px-3 mt-1">
            <User className="w-5 h-5 text-gray-500" />
            <input
              className="flex-1 bg-transparent p-2 outline-none"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* PIN */}
        <div className="mb-4 text-left">
          <label className="font-semibold text-[#444]">PIN</label>
          <div className="flex items-center bg-gray-100 rounded-xl px-3 mt-1">
            <Lock className="w-5 h-5 text-gray-500" />
            <input
              className="flex-1 bg-transparent p-2 outline-none"
              placeholder="비밀번호(PIN)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              type="password"
            />
          </div>
        </div>

        {/* 급수 / 성별 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-left">
            <label className="font-semibold text-[#444]">급수</label>
            <select
              className="w-full mt-1 p-2 bg-gray-100 rounded-xl outline-none"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option>A조</option>
              <option>B조</option>
              <option>C조</option>
              <option>D조</option>
              <option>E조</option>
            </select>
          </div>

          <div className="text-left">
            <label className="font-semibold text-[#444]">성별</label>
            <select
              className="w-full mt-1 p-2 bg-gray-100 rounded-xl outline-none"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option>남</option>
              <option>여</option>
            </select>
          </div>
        </div>

        {/* 게스트 체크 */}
        <label className="flex items-center gap-2 mb-6 text-sm text-gray-700 justify-center">
          <input
            type="checkbox"
            checked={guest}
            onChange={(e) => setGuest(e.target.checked)}
          />
          게스트입니다
        </label>

        {/* 버튼 */}
        <button
          onClick={login}
          className="
            w-full py-4 
            bg-gradient-to-r from-[#FF8A8A] to-[#FFB7B7]
            text-white font-bold text-lg rounded-2xl 
            shadow-md hover:shadow-lg
            flex items-center justify-center gap-2
            transition-all
          "
        >
          접속하기
          <ChevronRight className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
}
