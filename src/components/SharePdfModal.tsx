"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SharePdfModalProps {
  generatePdfBlob: () => Promise<Blob | null>;
  fileName: string;
  documentTitle: string;
  theme?: "green" | "orange";
}

type View = "menu" | "email";

export default function SharePdfModal({
  generatePdfBlob,
  fileName,
  documentTitle,
  theme = "green",
}: SharePdfModalProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sending, setSending] = useState(false);
  const cachedBlobRef = useRef<Blob | null>(null);
  const sharingRef = useRef(false);

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
      setView("menu");
      setEmailTo("");
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

  // BlobをBase64文字列に変換
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // "data:application/pdf;base64," の部分を除去
        resolve(dataUrl.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 共有の共通処理 — 共有中はstateを一切変更せずDOMを凍結する
  const doShare = async (shareData: ShareData) => {
    if (sharingRef.current) return;
    sharingRef.current = true;
    try {
      await navigator.share(shareData);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        showStatus("共有に失敗しました");
      }
    } finally {
      sharingRef.current = false;
      setOpen(false);
    }
  };

  // アプリで共有（Web Share API）— 共有シートからLINE等を選べる
  const shareNative = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await doShare({ files: [file] });
    } else if (typeof navigator.share === "function") {
      downloadBlob(blob);
      await doShare({ title: documentTitle, text: `${documentTitle}をお送りします。` });
    } else {
      downloadBlob(blob);
    }
  };

  // メールで送る（Resend API経由でサーバーからPDF添付メールを送信）
  const sendEmail = async () => {
    if (!emailTo.trim()) return;
    setSending(true);
    try {
      const blob = await getBlob();
      if (!blob) {
        showStatus("PDFの生成に失敗しました");
        return;
      }
      const pdfBase64 = await blobToBase64(blob);

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo.trim(),
          subject: documentTitle,
          body: `${documentTitle}をお送りします。添付のPDFをご確認ください。`,
          pdfBase64,
          fileName,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showStatus("メールを送信しました");
        setOpen(false);
      } else {
        showStatus(result.error || "送信に失敗しました");
      }
    } catch {
      showStatus("送信に失敗しました");
    } finally {
      setSending(false);
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
        disabled={sharing || sending}
        className={`px-5 py-3 ${bgClass} text-white rounded-xl text-base font-bold disabled:opacity-50 transition-colors shadow`}
        style={{ touchAction: "manipulation", minHeight: 48 }}
      >
        {sharing || sending ? "処理中..." : "共有・送信"}
      </button>

      {status && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
          {status}
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => !sending && setOpen(false)} />

          <div className="absolute right-0 bottom-full mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 z-50 overflow-hidden">
            {/* ヘッダー */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              {view === "menu" ? (
                <>
                  <p className="text-sm font-bold text-gray-700">PDFを共有・送信</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pdfReady ? "送信方法を選んでください" : "PDF準備中..."}
                  </p>
                  {!pdfReady && (
                    <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setView("menu")}
                    className="text-gray-500 hover:text-gray-700 -ml-1 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <p className="text-sm font-bold text-gray-700">メールでPDFを送信</p>
                </div>
              )}
            </div>

            {/* メニュー表示 */}
            {view === "menu" && (
              <div className="p-2">
                {/* アプリで共有 — Web Share API対応時に表示（LINE等にPDF付きで送信） */}
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
                          ? "LINE等にPDFを直接送信"
                          : "共有シートを開く（PDFは別途ダウンロード）"
                        }
                      </p>
                    </div>
                  </button>
                )}

                {/* メールで送る — サーバー経由でPDF添付メール送信 */}
                <button
                  onClick={() => setView("email")}
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
                    <p className="text-sm font-bold text-gray-800">メールで送る</p>
                    <p className="text-xs text-gray-500">宛先を入力してPDF添付メールを送信</p>
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
            )}

            {/* メール送信フォーム */}
            {view === "email" && (
              <div className="p-4">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  送信先メールアドレス
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && emailTo.trim()) sendEmail();
                  }}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  PDF添付のメールが送信されます
                </p>
                <button
                  onClick={sendEmail}
                  disabled={!emailTo.trim() || sending}
                  className="w-full mt-3 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {sending ? "送信中..." : "送信する"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
