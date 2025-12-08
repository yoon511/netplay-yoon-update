import TabsBar from "./TabsBar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 min-h-screen">
      {children}
      <TabsBar />
    </div>
  );
}
