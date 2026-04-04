"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo, ProposalSection } from "@/types";
import { dummySections } from "@/data/templates";
import SectionEditor from "@/components/SectionEditor";

/** デモ用の事前生成済み画像パス */
const DEMO_IMAGES = [
  "/demo/rooftop.jpg",
  "/demo/rust.jpg",
  "/demo/balcony.jpg",
  "/demo/crack.jpg",
];

/** dataURLをリ��イズ・JPEG圧縮して容量を削減 */
function compressDataUrl(dataUrl: string, maxWidth: number, quality: number): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return Promise.resolve(dataUrl);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function EditPage() {
  const router = useRouter();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // リロード検知: アプリ内遷移フラグがなければトップへ
    if (!sessionStorage.getItem("__nav")) { router.replace("/"); return; }
    const stored = sessionStorage.getItem("customerInfo");
    if (!stored) {
      router.replace("/");
      return;
    }
    setCustomerInfo(JSON.parse(stored));

    const useDemo = sessionStorage.getItem("useDemo");
    if (useDemo === "true") {
      sessionStorage.removeItem("useDemo");

      // 事前生成済みの静的画像を使って即座に表示
      const initialData: ProposalSection[] = dummySections.map((ds, i) => ({
        id: `demo-${i}`,
        imageUrl: DEMO_IMAGES[i] || DEMO_IMAGES[0],
        imageName: ds.imageName,
        annotations: [],
        description: ds.description,
      }));
      setSections(initialData);
    }
    setIsReady(true);
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

  const [navigating, setNavigating] = useState(false);

  const goToPreview = async () => {
    if (navigating) return;
    setNavigating(true);
    try {
      // 画像が大きすぎるとsessionStorage上限(5MB)を超えるため、リサイズして保存
      const compressedSections = await Promise.all(
        sections.map(async (s) => ({
          ...s,
          imageUrl: await compressDataUrl(s.imageUrl, 800, 0.7),
          annotatedImageUrl: s.annotatedImageUrl
            ? await compressDataUrl(s.annotatedImageUrl, 800, 0.7)
            : undefined,
        }))
      );
      sessionStorage.setItem("sections", JSON.stringify(compressedSections));
      sessionStorage.setItem("__nav", "1");
      router.push("/preview");
    } catch (e) {
      console.error("[Preview] sessionStorage error:", e);
      // 圧縮なしでリトライ（容量不足ならアラート）
      try {
        sessionStorage.setItem("sections", JSON.stringify(sections));
        sessionStorage.setItem("__nav", "1");
        router.push("/preview");
      } catch {
        alert("データが大きすぎてプレビューに移動できません。セクション数を減らすか、画像を小さくしてください。");
      }
    } finally {
      setNavigating(false);
    }
  };

  if (!customerInfo || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl lg:max-w-full mx-auto px-4 lg:px-10 xl:px-16 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/proposal")}
                onPointerDown={() => router.push("/proposal")}
                className="text-gray-500 hover:text-gray-700 text-base py-2 px-3 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                style={{ touchAction: "manipulation", minHeight: 44 }}
              >
                ← 戻る
              </button>
              <button
                onClick={() => router.push("/")}
                onPointerDown={() => router.push("/")}
                className="text-gray-400 hover:text-gray-600 text-sm py-2 px-3 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                style={{ touchAction: "manipulation", minHeight: 44 }}
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
          className="w-full py-5 border-3 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors font-bold text-lg"
          style={{ borderWidth: "3px", touchAction: "manipulation", minHeight: 56 }}
        >
          + セクションを追加
        </button>
      </div>

      {/* Bottom bar */}
      {sections.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-20" style={{ touchAction: "manipulation", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <div className="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto">
            <button
              onClick={goToPreview}
              className="w-full bg-blue-600 text-white py-5 rounded-xl text-xl font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
              style={{ touchAction: "manipulation", minHeight: 56 }}
            >
              プレビュー
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
