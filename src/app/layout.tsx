import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "現場書類ジェネレーター",
  description: "防水・塗装工事の提案書・見積書・請求書を簡単作成",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
