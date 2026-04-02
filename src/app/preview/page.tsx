"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo, ProposalSection } from "@/types";

export default function PreviewPage() {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // リロード検知: アプリ内遷移フラグがなければトップへ
    if (!sessionStorage.getItem("__nav")) { router.replace("/"); return; }
    const storedInfo = sessionStorage.getItem("customerInfo");
    const storedSections = sessionStorage.getItem("sections");
    if (!storedInfo || !storedSections) {
      router.replace("/");
      return;
    }
    setCustomerInfo(JSON.parse(storedInfo));
    setSections(JSON.parse(storedSections));
  }, [router]);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = previewRef.current;
      if (!element) return;

      // html2canvasのscale倍率
      const h2cScale = 2;

      const canvas = await html2canvas(element, {
        scale: h2cScale,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentHeight = (canvas.height * pdfWidth) / canvas.width;

      if (contentHeight <= pageHeight) {
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, contentHeight);
      } else {
        // セクション境界を検出して、そこでページ分割する
        const sectionEls = element.querySelectorAll("[data-pdf-section]");
        const containerRect = element.getBoundingClientRect();

        // 各セクションの境界位置（canvas座標）を収集
        const breakPoints: number[] = [0];
        sectionEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          // セクション上端（コンテナ相対）をcanvas座標に変換
          const topInCanvas = (rect.top - containerRect.top) * h2cScale;
          breakPoints.push(Math.round(topInCanvas));
        });
        // 最終端
        breakPoints.push(canvas.height);

        const scaleFactor = pdfWidth / canvas.width;
        const pageCanvasHeight = Math.floor(pageHeight / scaleFactor);

        // セクション境界を使って最適なページ分割位置を決定
        const pageBreaks: { srcY: number; height: number }[] = [];
        let currentPageStart = 0;

        for (let i = 1; i < breakPoints.length; i++) {
          const nextBreak = breakPoints[i];
          const currentPageHeight = nextBreak - currentPageStart;

          if (currentPageHeight > pageCanvasHeight && i > 1 && breakPoints[i - 1] > currentPageStart) {
            // このセクションを追加するとページを超える→前のセクション境界で切る
            const cutAt = breakPoints[i - 1];
            pageBreaks.push({ srcY: currentPageStart, height: cutAt - currentPageStart });
            currentPageStart = cutAt;
          }
          // セクション単体がページより大きい場合はそのまま含める（避けられない）
        }
        // 残りを最終ページとして追加
        if (currentPageStart < canvas.height) {
          pageBreaks.push({ srcY: currentPageStart, height: canvas.height - currentPageStart });
        }

        // フォールバック: セクション境界が取れなかった場合は従来方式
        if (pageBreaks.length === 0) {
          let srcY = 0;
          while (srcY < canvas.height) {
            const sliceHeight = Math.min(pageCanvasHeight, canvas.height - srcY);
            pageBreaks.push({ srcY, height: sliceHeight });
            srcY += sliceHeight;
          }
        }

        pageBreaks.forEach((slice, pageNum) => {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = slice.height;
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, 0, slice.srcY, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
          }
          const pageImgData = pageCanvas.toDataURL("image/png");
          const sliceMmHeight = slice.height * scaleFactor;

          if (pageNum > 0) pdf.addPage();
          pdf.addImage(pageImgData, "PNG", 0, 0, pdfWidth, sliceMmHeight);
        });
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const fileName = customerInfo ? `提案書_${customerInfo.propertyName}_${customerInfo.date}.pdf` : "提案書.pdf";
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF生成に失敗しました。もう一度お試しください。");
    } finally {
      setGenerating(false);
    }
  };

  // iPad/Apple Pencil対応: pointerdown + click両方でデバウンス発火
  const lastAction = useRef(0);
  const safeAction = (action: () => void) => {
    const now = Date.now();
    if (now - lastAction.current < 300) return;
    lastAction.current = now;
    action();
  };

  if (!customerInfo) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl lg:max-w-full mx-auto lg:px-10 xl:px-16 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onPointerDown={(e) => { e.preventDefault(); safeAction(() => router.push("/edit")); }}
                onClick={() => safeAction(() => router.push("/edit"))}
                className="text-gray-500 hover:text-gray-700 text-base py-2 px-3 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                style={{ touchAction: "manipulation", minHeight: 44 }}
              >
                ← 編集に戻る
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); safeAction(() => router.push("/")); }}
                onClick={() => safeAction(() => router.push("/"))}
                className="text-gray-400 hover:text-gray-600 text-sm py-2 px-3 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                style={{ touchAction: "manipulation", minHeight: 44 }}
              >
                トップ
              </button>
            </div>
            <h1 className="font-bold text-gray-800 text-lg">プレビュー</h1>
            <button
              onPointerDown={(e) => { e.preventDefault(); if (!generating) safeAction(generatePdf); }}
              onClick={() => { if (!generating) safeAction(generatePdf); }}
              disabled={generating}
              className="px-5 py-3 bg-green-600 text-white rounded-xl text-base font-bold hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors shadow"
              style={{ touchAction: "manipulation", minHeight: 48 }}
            >
              {generating ? "生成中..." : "PDF出力"}
            </button>
          </div>

          {/* ステップ表示 */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-green-500 text-white text-xs font-bold rounded-full">✓</span>
              <span className="text-xs text-green-600 hidden sm:inline">基本情報</span>
            </div>
            <div className="w-6 h-0.5 bg-green-400" />
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-green-500 text-white text-xs font-bold rounded-full">✓</span>
              <span className="text-xs text-green-600 hidden sm:inline">写真・説明</span>
            </div>
            <div className="w-6 h-0.5 bg-green-400" />
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-600 text-white text-xs font-bold rounded-full">3</span>
              <span className="text-xs font-bold text-blue-600 hidden sm:inline">確認・出力</span>
            </div>
          </div>
        </div>
      </div>

      {/* ガイドメッセージ */}
      <div className="max-w-4xl lg:max-w-full mx-auto lg:px-10 xl:px-16 px-4 pt-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 text-sm sm:text-base text-center">
            内容を確認して、問題なければ「PDF出力」ボタンでダウンロードできます。
          </p>
        </div>
      </div>

      {/* Preview content — A4固定幅(794px = 210mm@96dpi)、モバイルは縮小表示 */}
      <div className="p-4 overflow-x-auto" style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: 794, minWidth: 794 }}>
          <div
            ref={previewRef}
            className="bg-white shadow-lg"
            style={{ width: 794, padding: "56px 60px", boxSizing: "border-box" }}
          >
            {/* Document Header */}
            <div style={{ borderBottom: "3px solid #1e3a5f", paddingBottom: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: "bold", color: "#111", margin: 0 }}>
                    現場調査報告書
                  </h1>
                  <h2 style={{ fontSize: 14, color: "#444", margin: "4px 0 0", fontWeight: "normal" }}>
                    {customerInfo.propertyName}
                  </h2>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#666" }}>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                    {customerInfo.companyName}
                  </p>
                  <p style={{ margin: "2px 0 0" }}>
                    作成日：{customerInfo.date.replace(/-/g, "/")}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 12, background: "#f9fafb", borderRadius: 4, padding: "8px 12px", fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: "#666" }}>提出先：</span>
                <span style={{ color: "#222" }}>{customerInfo.customerName}</span>
              </div>
            </div>

            {/* Sections */}
            {sections.map((section, i) => {
              const displayImage =
                section.annotatedImageUrl || section.imageUrl;
              return (
                <div
                  key={section.id}
                  data-pdf-section
                  style={{ marginBottom: 20, pageBreakInside: "avoid" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#1e3a5f", color: "#fff", fontSize: 11, fontWeight: "bold", borderRadius: "50%", flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <h3 style={{ fontSize: 14, fontWeight: "bold", color: "#222", margin: 0 }}>
                      {section.imageName || `調査箇所 ${i + 1}`}
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: 16 }}>
                    {displayImage && (
                      <div style={{ flexShrink: 0, width: "46%" }}>
                        <img
                          src={displayImage}
                          alt={section.imageName}
                          style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 4, border: "1px solid #e5e7eb", background: "#f9fafb" }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ background: "#f9fafb", borderRadius: 4, padding: "10px 12px", height: "100%", boxSizing: "border-box" }}>
                        <p style={{ fontSize: 11, color: "#444", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {i < sections.length - 1 && (
                    <hr style={{ marginTop: 16, border: "none", borderTop: "1px solid #e5e7eb" }} />
                  )}
                </div>
              );
            })}

            {/* Footer */}
            <div data-pdf-section style={{ marginTop: 32, paddingTop: 12, borderTop: "2px solid #e5e7eb", textAlign: "center", fontSize: 10, color: "#aaa" }}>
              <p style={{ margin: 0 }}>
                本書は{customerInfo.companyName}が作成した現場調査報告書です。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 sm:hidden" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button
          onPointerDown={(e) => { e.preventDefault(); if (!generating) safeAction(generatePdf); }}
          onClick={() => { if (!generating) safeAction(generatePdf); }}
          disabled={generating}
          className="w-full bg-green-600 text-white py-5 rounded-xl text-xl font-bold hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors shadow-lg"
          style={{ touchAction: "manipulation", minHeight: 56 }}
        >
          {generating ? "PDF生成中..." : "PDFをダウンロード"}
        </button>
      </div>
    </div>
  );
}
