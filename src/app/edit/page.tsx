"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo, ProposalSection } from "@/types";
import { dummySections } from "@/data/templates";
import SectionEditor from "@/components/SectionEditor";

function createDummyImageUrl(label: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;
  // background
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, 0, 640, 480);
  // grid
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  for (let i = 0; i < 640; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 480);
    ctx.stroke();
  }
  for (let i = 0; i < 480; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(640, i);
    ctx.stroke();
  }
  // icon
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.arc(320, 200, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(320, 185, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(320, 230, 35, 25, 0, 0, Math.PI);
  ctx.fill();
  // label
  ctx.fillStyle = "#475569";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, 320, 310);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("※ ダミー画像（実際は現場写真を使用）", 320, 340);
  // red annotation circle (demo)
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(200, 180, 80, 50, 0, 0, Math.PI * 2);
  ctx.stroke();
  // red arrow
  ctx.beginPath();
  ctx.moveTo(300, 140);
  ctx.lineTo(230, 170);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(230, 170);
  ctx.lineTo(245, 155);
  ctx.stroke();
  ctx.moveTo(230, 170);
  ctx.lineTo(243, 178);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

export default function EditPage() {
  const router = useRouter();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("customerInfo");
    if (!stored) {
      router.push("/");
      return;
    }
    setCustomerInfo(JSON.parse(stored));

    const useDemo = sessionStorage.getItem("useDemo");
    if (useDemo === "true") {
      const demoData: ProposalSection[] = dummySections.map((ds, i) => ({
        id: `demo-${i}`,
        imageUrl: createDummyImageUrl(ds.imageName),
        imageName: ds.imageName,
        annotations: [],
        description: ds.description,
      }));
      setSections(demoData);
      sessionStorage.removeItem("useDemo");
    }
  }, [router]);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        imageUrl: "",
        imageName: "",
        annotations: [],
        description: "",
      },
    ]);
  };

  const updateSection = (index: number, updated: ProposalSection) => {
    setSections((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const deleteSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const goToPreview = () => {
    sessionStorage.setItem("sections", JSON.stringify(sections));
    router.push("/preview");
  };

  if (!customerInfo) return null;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 戻る
            </button>
            <h1 className="font-bold text-gray-800">提案書を編集</h1>
            <div className="w-12" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {customerInfo.propertyName} / {customerInfo.customerName}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-4">
        {sections.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg mb-2">まだセクションがありません</p>
            <p className="text-sm">
              下の「セクションを追加」から写真と説明を追加してください
            </p>
          </div>
        )}

        {sections.map((section, i) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={i}
            onUpdate={(updated) => updateSection(i, updated)}
            onDelete={() => deleteSection(i)}
          />
        ))}

        <button
          onClick={addSection}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
        >
          + セクションを追加
        </button>
      </div>

      {/* Bottom bar */}
      {sections.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto">
            <button
              onClick={goToPreview}
              className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors"
            >
              プレビューを確認 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
