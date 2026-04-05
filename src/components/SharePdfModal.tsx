"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SharePdfModalProps {
  generatePdfBlob: () => Promise<Blob | null>;
  fileName: string;
  documentTitle: string;
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
  const [pdfReady, setPdfReady] = useState(false);
  const cachedBlobRef = useRef<Blob | null>(null);

  const bgClass = theme === "orange" ? "bg-orange-600 hover:bg-orange-700 active:bg-orange-800" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800";

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 4000);
  };

  // モーダルを開いた時点でPDFを事前生成してキャッシュ
  const preGeneratePdf = useCallback(async () => {
    setPdfReady(false);
    cachedBlobRef.current = null;
    try {
      const blob = await generatePdfBlob();
      if (blob) {
        cachedBlobRef.current = blob;
        setPdfReady(true);
      }
    } catch (err) {
      console.warn("[SharePdfModal] PDF pre-generation failed:", err);
    }
  }, [generatePdfBlob]);

  useEffect(() => {
    if (open) {
      preGeneratePdf();
    } else {
      cachedBlobRef.current = null;
      setPdfReady(false);
    }
  }, [open, preGeneratePdf]);

  const getBlob = async (): Promise<Blob | null> => {
    if (cachedBlobRef.current) return cachedBlobRef.current;
    const blob = await generatePdfBlob();
    if (blob) cachedBlobRef.current = blob;
    return blob;
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  // アプリで共有（Web Share API）— 共有シートからLINE・メール等を選べる
  // filesのみで共有（title/textを含めるとiOS share extensionが不安定になる問題を回避）
  // 重要: モーダルを閉じずに共有を実行（DOM変更によるiOS share extension強制終了を防止）
  const shareNative = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else if (navigator.share) {
        downloadBlob(blob);
        await navigator.share({
          title: documentTitle,
          text: `${documentTitle}をお送りします。`,
        });
      } else {
        downloadBlob(blob);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        showStatus("共有に失敗しました");
      }
    } finally {
      setSharing(false);
      setOpen(false);
    }
  };

  // Gmailで送る（iOSのWeb Share API経由だとGmail share extensionが不安定なため直接起動）
  const shareViaGmail = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      downloadBlob(blob);
      // Gmail作成画面を直接開く
      const subject = encodeURIComponent(documentTitle);
      const body = encodeURIComponent(`${documentTitle}をお送りします。\n\n※ダウンロードされたPDFファイルを添付してください。`);
      // iOSではGmailアプリのURLスキームを試み、失敗時はWeb版にフォールバック
      const gmailAppUrl = `googlegmail:///co?subject=${subject}&body=${body}`;
      const gmailWebUrl = `https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`;

      // Gmailアプリを試行
      const opened = window.open(gmailAppUrl, "_blank");
      if (!opened) {
        window.open(gmailWebUrl, "_blank");
      }
      showStatus("PDFをダウンロードしました。Gmailに添付してください");
    } catch {
      showStatus("送信の準備に失敗しました");
    } finally {
      setSharing(false);
      setOpen(false);
    }
  };

  // PDFダウンロードのみ
  const downloadPdf = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      downloadBlob(blob);
      showStatus("ダウンロードしました");
    } catch {
      showStatus("ダウンロードに失敗しました");
    } finally {
      setSharing(false);
    }
  };

  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;
  const supportsFileShare = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={sharing}
        className={`px-5 py-3 ${bgClass} text-white rounded-xl text-base font-bold disabled:opacity-50 transition-colors shadow`}
        style={{ touchAction: "manipulation", minHeight: 48 }}
      >
        {sharing ? "処理中..." : "共有・送信"}
      </button>

      {status && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
          {status}
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 bottom-full mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-bold text-gray-700">PDFを共有・送信</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {pdfReady ? "送信方法を選んでください" : "PDF準備中..."}
              </p>
              {!pdfReady && (
                <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: "60%" }} />
                </div>
              )}
            </div>

            <div className="p-2">
              {/* アプリで共有 — Web Share API対応時に表示（LINE・メール等にPDF付きで送信） */}
              {supportsNativeShare && (
                <button
                  onClick={() => shareNative()}
                  disabled={!pdfReady}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${pdfReady ? "hover:bg-blue-50 active:bg-blue-100" : "opacity-50 cursor-wait"}`}
                >
                  <span className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-lg flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">アプリで共有</p>
                    <p className="text-xs text-gray-500">
                      {supportsFileShare
                        ? "LINE・メール等にPDFを直接送信"
                        : "共有シートを開く（PDFは別途ダウンロード）"
                      }
                    </p>
                  </div>
                </button>
              )}

              {/* Gmailで送る — iOS share extensionの不具合回避用 */}
              <button
                onClick={() => shareViaGmail()}
                disabled={!pdfReady}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${pdfReady ? "hover:bg-red-50 active:bg-red-100" : "opacity-50 cursor-wait"}`}
              >
                <span className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full text-lg flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-800">Gmailで送る</p>
                  <p className="text-xs text-gray-500">PDFダウンロード後にGmailを起動</p>
                </div>
              </button>

              {/* ダウンロードのみ — 全デバイス共通 */}
              <button
                onClick={() => { downloadPdf(); setOpen(false); }}
                disabled={!pdfReady}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${pdfReady ? "hover:bg-gray-50 active:bg-gray-100" : "opacity-50 cursor-wait"}`}
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
