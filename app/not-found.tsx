"use client";
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">페이지를 찾을 수 없습니다.</h1>
      <p className="text-gray-600">
        존재하지 않는 페이지이거나 주소가 잘못되었습니다.
      </p>
    </div>
  );
}
