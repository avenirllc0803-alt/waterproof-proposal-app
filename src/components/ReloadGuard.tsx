"use client";

import { useEffect } from "react";

export default function ReloadGuard() {
  useEffect(() => {
    // ページリロード・タブ閉じ時に __nav フラグをクリア
    // クライアントサイド遷移(router.push)では beforeunload/pagehide は発火しないので影響なし
    const handleUnload = () => {
      sessionStorage.removeItem("__nav");
    };
    // beforeunload: デスクトップブラウザ向け
    window.addEventListener("beforeunload", handleUnload);
    // pagehide: iOS Safari/iPad で beforeunload が発火しない場合の対策
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  return null;
}
