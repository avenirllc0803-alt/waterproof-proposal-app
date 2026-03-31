import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "現場提案書ジェネレーター",
  description: "防水工事の現場提案書を簡単に作成",
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
