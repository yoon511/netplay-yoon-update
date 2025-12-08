import { Suspense } from "react";
import TabsBar from "./TabsBar";


export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 min-h-screen">
      {children}
      <Suspense fallback={null}>
        <TabsBar />   {/* 👉 CSR 컴포넌트 따로 분리됨 */}
      </Suspense>
    </div>
  );
}

