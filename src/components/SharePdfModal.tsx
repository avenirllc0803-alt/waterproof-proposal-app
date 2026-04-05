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
  const sharingRef = useRef(false);
  const generatingRef = useRef(false);
  const generatePdfBlobRef = useRef(generatePdfBlob);

  // 最新のgeneratePdfBlobを参照するが、useCallbackの依存には入れない
  useEffect(() => {
    generatePdfBlobRef.current = generatePdfBlob;
  }, [generatePdfBlob]);

  const bgClass = theme === "orange" ? "bg-orange-600 hover:bg-orange-700 active:bg-orange-800" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800";

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 4000);
  };

  // モーダルを開いた時点でPDFを事前生成してキャッシュ
  const preGeneratePdf = useCallback(async () => {
    if (generatingRef.current) return; // 二重実行防止
    generatingRef.current = true;
    setPdfReady(false);
    cachedBlobRef.current = null;
    try {
      const blob = await generatePdfBlobRef.current();
      if (blob) {
        cachedBlobRef.current = blob;
        setPdfReady(true);
      }
    } catch (err) {
      console.warn("[SharePdfModal] PDF pre-generation failed:", err);
    } finally {
      generatingRef.current = false;
    }
  }, []); // 依存なし — generatePdfBlobはrefで参照

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

  // 共有の共通処理 — 共有中はstateを一切変更せずDOMを凍結する
  // iOS share extension（特にGmail）がDOM変更で強制終了する問題を回避
  const doShare = async (shareData: ShareData) => {
    if (sharingRef.current) return;
    sharingRef.current = true;
    try {
      // 重要: navigator.share()が完了するまでsetStateを呼ばない（DOM凍結）
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

  // アプリで共有（Web Share API）— 共有シートからLINE・Gmail等を選べる
  // files + title + text を一緒に渡すことでGmail等のメールアプリがPDFを正しく処理できるようにする
  const shareNative = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await doShare({
          files: [file],
          title: documentTitle,
          text: `${documentTitle}をお送りします。`,
        });
      } else if (typeof navigator.share === "function") {
        downloadBlob(blob);
        await doShare({ title: documentTitle, text: `${documentTitle}をお送りします。` });
      } else {
        downloadBlob(blob);
      }
    } finally {
      setSharing(false);
    }
  };

  // メール専用ボタンは削除済み
  // 理由: mailto:リンクではPDF添付が技術的に不可能（RFC上ファイル添付パラメータが存在しない）
  // Web Share APIの共有先にメールアプリ（Gmail等）が含まれるため、「アプリで共有」に統合で十分
  // PC向けにはダウンロード→手動添付のフローで対応

  // PDFダウンロードのみ
  const downloadPdf = async () => {
    if (sharing) return;
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
              {/* アプリで共有（Web Share API対応端末） — 共有シートからLINE・Gmail等を選べる */}
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

              {/* PC向けフォールバック — Web Share API非対応時にガイドテキストを表示 */}
              {!supportsNativeShare && (
                <div className="px-4 py-3 text-xs text-gray-500 bg-gray-50 rounded-xl">
                  <p className="font-bold text-gray-700 text-sm mb-1">共有するには</p>
                  <p>PDFをダウンロード後、LINE・メール等に添付して送信してください。</p>
                </div>
              )}

              {/* ダウンロードのみ */}
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
