import "./globals.css";

export const metadata = {
  title: "Netplay",
  description: "Badminton Netplay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-[#fdfbf6]">
        {/* 페이지 전체 래퍼 */}
        <div className="flex-1 w-full max-w-3xl mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
