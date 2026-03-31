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
    const storedInfo = sessionStorage.getItem("customerInfo");
    const storedSections = sessionStorage.getItem("sections");
    if (!storedInfo || !storedSections) {
      router.push("/");
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

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page
      const pageHeight = pdf.internal.pageSize.getHeight();
      let position = 0;

      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      } else {
        let heightLeft = pdfHeight;
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      }

      const fileName = customerInfo
        ? `提案書_${customerInfo.propertyName}_${customerInfo.date}.pdf`
        : "提案書.pdf";
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF生成に失敗しました。もう一度お試しください。");
    } finally {
      setGenerating(false);
    }
  };

  if (!customerInfo) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/edit")}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 編集に戻る
          </button>
          <h1 className="font-bold text-gray-800">プレビュー</h1>
          <button
            onClick={generatePdf}
            disabled={generating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {generating ? "生成中..." : "PDF出力"}
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="max-w-4xl mx-auto p-4">
        <div
          ref={previewRef}
          className="bg-white shadow-lg"
          style={{ padding: "40px", minHeight: "297mm" }}
        >
          {/* Document Header */}
          <div className="border-b-4 border-blue-800 pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  現場調査報告書
                </h1>
                <h2 className="text-lg text-gray-700">
                  {customerInfo.propertyName}
                </h2>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p className="font-medium text-base">
                  {customerInfo.companyName}
                </p>
                <p className="mt-1">
                  作成日：{customerInfo.date.replace(/-/g, "/")}
                </p>
              </div>
            </div>
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm">
              <span className="font-medium text-gray-600">提出先：</span>
              <span className="text-gray-800">{customerInfo.customerName}</span>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section, i) => {
            const displayImage =
              section.annotatedImageUrl || section.imageUrl;
            return (
              <div
                key={section.id}
                className="mb-8 page-break-inside-avoid"
                style={{ pageBreakInside: "avoid" }}
              >
                <div className="flex items-start gap-1 mb-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-800 text-white text-sm font-bold rounded-full flex-shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-bold text-gray-800 mt-0.5">
                    {section.imageName || `調査箇所 ${i + 1}`}
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {displayImage && (
                    <div className="sm:w-1/2 flex-shrink-0">
                      <img
                        src={displayImage}
                        alt={section.imageName}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <div className="sm:w-1/2">
                    <div className="bg-gray-50 rounded-lg p-4 h-full">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>

                {i < sections.length - 1 && (
                  <hr className="mt-6 border-gray-200" />
                )}
              </div>
            );
          })}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-xs text-gray-400">
            <p>
              本書は{customerInfo.companyName}が作成した現場調査報告書です。
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 sm:hidden">
        <button
          onClick={generatePdf}
          disabled={generating}
          className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {generating ? "PDF生成中..." : "PDFをダウンロード"}
        </button>
      </div>
    </div>
  );
}
