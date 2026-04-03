"use client";

import { useState } from "react";

interface SharePdfModalProps {
  /** PDFのBlobを生成して返す関数 */
  generatePdfBlob: () => Promise<Blob | null>;
  /** PDFファイル名 */
  fileName: string;
  /** 共有時のメール件名・メッセージ用タイトル */
  documentTitle: string;
  /** テーマカラー（green / orange） */
  theme?: "green" | "orange";
}

export default function SharePdfModal({
  generatePdfBlob,
  fileName,
  documentTitle,
  theme = "green",
}: SharePdfModalProps) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const themeColor = theme === "orange" ? "orange" : "green";
  const bgClass = theme === "orange" ? "bg-orange-600 hover:bg-orange-700 active:bg-orange-800" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800";

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  // Web Share API でPDFファイルを共有（モバイル対応）
  const shareNative = async () => {
    setSharing(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) return;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: documentTitle,
          text: `${documentTitle}をお送りします。`,
          files: [file],
        });
        showStatus("共有しました");
      } else {
        // ファイル共有非対応の場合はテキストのみ
        await navigator.share({
          title: documentTitle,
          text: `${documentTitle}をお送りします。PDFファイルは別途添付いたします。`,
        });
        showStatus("テキストを共有しました。PDFは別途ダウンロードしてください。");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        showStatus("共有に失敗しました");
      }
    } finally {
      setSharing(false);
    }
  };

  // PDFをダウンロードしてからメールを開く
  const shareEmail = async () => {
    setSharing(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) return;

      // まずPDFをダウンロード
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);

      // メール作成画面を開く
      const subject = encodeURIComponent(documentTitle);
      const body = encodeURIComponent(
        `${documentTitle}をお送りいたします。\n\n添付ファイルをご確認ください。\n\nよろしくお願いいたします。`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      showStatus("PDFをダウンロードしました。メールに添付してください。");
    } catch {
      showStatus("エラーが発生しました");
    } finally {
      setSharing(false);
    }
  };

  // LINEで共有
  const shareLINE = async () => {
    setSharing(true);
    try {
      // まずPDFをダウンロード
      const blob = await generatePdfBlob();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);

      // LINEでテキストメッセージを送信
      const message = encodeURIComponent(
        `${documentTitle}をお送りします。\nPDFファイルを添付しますのでご確認ください。`
      );
      window.open(`https://line.me/R/share?text=${message}`, "_blank");
      showStatus("PDFをダウンロードしました。LINEでファイルも送信してください。");
    } catch {
      showStatus("エラーが発生しました");
    } finally {
      setSharing(false);
    }
  };

  // PDFダウンロードのみ
  const downloadPdf = async () => {
    setSharing(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      showStatus("ダウンロードしました");
    } catch {
      showStatus("ダウンロードに失敗しました");
    } finally {
      setSharing(false);
    }
  };

  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="relative">
      {/* 共有ボタン */}
      <button
        onClick={() => setOpen(!open)}
        disabled={sharing}
        className={`px-5 py-3 ${bgClass} text-white rounded-xl text-base font-bold disabled:opacity-50 transition-colors shadow`}
        style={{ touchAction: "manipulation", minHeight: 48 }}
      >
        {sharing ? "処理中..." : "共有・送信"}
      </button>

      {/* ステータスメッセージ */}
      {status && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
          {status}
        </div>
      )}

      {/* モーダル */}
      {open && (
        <>
          {/* 背景オーバーレイ */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* メニュー */}
          <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-bold text-gray-700">PDFを共有・送信</p>
              <p className="text-xs text-gray-500 mt-0.5">送信方法を選んでください</p>
            </div>

            <div className="p-2">
              {/* Web Share API（モバイル） */}
              {supportsNativeShare && (
                <button
                  onClick={() => { setOpen(false); shareNative(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition-colors text-left"
                >
                  <span className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-lg flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">アプリで共有</p>
                    <p className="text-xs text-gray-500">LINE・メール等にPDFを直接送信</p>
                  </div>
                </button>
              )}

              {/* LINE */}
              <button
                onClick={() => { setOpen(false); shareLINE(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 active:bg-green-100 transition-colors text-left"
              >
                <span className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-full text-lg font-bold flex-shrink-0">
                  L
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-800">LINEで送る</p>
                  <p className="text-xs text-gray-500">PDFをダウンロード後、LINEで送信</p>
                </div>
              </button>

              {/* メール */}
              <button
                onClick={() => { setOpen(false); shareEmail(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 active:bg-orange-100 transition-colors text-left"
              >
                <span className="w-10 h-10 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full text-lg flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-800">メールで送る</p>
                  <p className="text-xs text-gray-500">PDFをダウンロード後、メール作成</p>
                </div>
              </button>

              {/* ダウンロード */}
              <button
                onClick={() => { setOpen(false); downloadPdf(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <span className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full text-lg flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-800">ダウンロードのみ</p>
                  <p className="text-xs text-gray-500">PDFファイルを端末に保存</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
