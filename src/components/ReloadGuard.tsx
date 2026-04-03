"use client";

import { useEffect } from "react";

export default function ReloadGuard() {
  useEffect(() => {
    // ページリロード・タブ閉じ時に __nav フラグをクリア
    // クライアントサイド遷移(router.push)では beforeunload は発火しないので影響なし
    const handleUnload = () => {
      sessionStorage.removeItem("__nav");
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return null;
}
