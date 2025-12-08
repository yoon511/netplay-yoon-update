export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 min-h-screen">
      {children}
      <TabsBar />   {/* 👉 CSR 컴포넌트 따로 분리됨 */}
    </div>
  );
}

