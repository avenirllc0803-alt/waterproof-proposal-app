"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo, ProposalSection } from "@/types";
import { dummySections } from "@/data/templates";
import { createDemoImage } from "@/lib/demoImages";
import SectionEditor from "@/components/SectionEditor";

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
        imageUrl: createDemoImage(i),
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

  const moveSection = (index: number, direction: "up" | "down") => {
    setSections((prev) => {
      const arr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const goToPreview = () => {
    sessionStorage.setItem("sections", JSON.stringify(sections));
    router.push("/preview");
  };

  if (!customerInfo) return null;

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl lg:max-w-full mx-auto px-4 lg:px-10 xl:px-16 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/proposal")}
                className="text-gray-500 hover:text-gray-700 text-base py-2 px-3 rounded-lg hover:bg-gray-100"
              >
                ← 戻る
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-gray-400 hover:text-gray-600 text-sm py-2 px-3 rounded-lg hover:bg-gray-100"
              >
                トップ
              </button>
            </div>
            <h1 className="font-bold text-gray-800 text-lg">提案書を編集</h1>
            <div className="w-24" />
          </div>

          {/* ステップ表示 */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-green-500 text-white text-xs font-bold rounded-full">✓</span>
              <span className="text-xs text-green-600 hidden sm:inline">基本情報</span>
            </div>
            <div className="w-6 h-0.5 bg-green-400" />
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-600 text-white text-xs font-bold rounded-full">2</span>
              <span className="text-xs font-bold text-blue-600 hidden sm:inline">写真・説明</span>
            </div>
            <div className="w-6 h-0.5 bg-gray-300" />
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 text-gray-400 text-xs font-bold rounded-full">3</span>
              <span className="text-xs text-gray-400 hidden sm:inline">確認・出力</span>
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-500 text-center">
            {customerInfo.propertyName} / {customerInfo.customerName}
          </div>
        </div>
      </div>

      {/* ガイドメッセージ */}
      <div className="max-w-2xl lg:max-w-full mx-auto px-4 lg:px-10 xl:px-16 pt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-700 text-sm sm:text-base text-center">
            {sections.length === 0
              ? "「セクションを追加」ボタンを押して、現場写真と説明を追加してください。"
              : `${sections.length}件のセクションがあります。写真を追加して、説明文を入力またはテンプレートから選んでください。`}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-2xl lg:max-w-full mx-auto px-4 lg:px-10 xl:px-16 py-4 space-y-4">
        {sections.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg
              className="w-20 h-20 mx-auto mb-4 text-gray-300"
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
            <p className="text-xl mb-2 text-gray-500">まだセクションがありません</p>
            <p className="text-base text-gray-400">
              下のボタンから写真と説明を追加してください
            </p>
          </div>
        )}

        {sections.map((section, i) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={i}
            total={sections.length}
            onUpdate={(updated) => updateSection(i, updated)}
            onDelete={() => deleteSection(i)}
            onMove={(dir) => moveSection(i, dir)}
          />
        ))}

        <button
          onClick={addSection}
          className="w-full py-5 border-3 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors font-bold text-lg"
          style={{ borderWidth: "3px" }}
        >
          + セクションを追加
        </button>
      </div>

      {/* Bottom bar */}
      {sections.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-20">
          <div className="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto">
            <button
              onClick={goToPreview}
              className="w-full bg-blue-600 text-white py-5 rounded-xl text-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
            >
              次へ：プレビューを確認 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
