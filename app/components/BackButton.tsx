"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const params = useSearchParams();

  // 현재 URL의 모든 파라미터 그대로 유지 → menu로 이동
  const userQuery = params.toString();

  return (
    <button
      onClick={() => router.push(`/menu?${userQuery}`)}
      className="text-sm text-gray-500 mb-4"
    >
      ← 메뉴로 돌아가기
    </button>
  );
}
