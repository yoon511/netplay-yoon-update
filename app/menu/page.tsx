"use client";

import { Suspense } from "react";
import MenuPageContent from "./MenuPageContent";

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-4">로딩 중...</div>}>
      <MenuPageContent />
    </Suspense>
  );
}
