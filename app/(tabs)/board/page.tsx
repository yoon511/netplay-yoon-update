"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import BoardPageContent from "./BoardPageContent";

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="p-4">로딩 중...</div>}>
      <BoardPageContent />
    </Suspense>
  );
}
