"use client";

import { useState, useCallback } from "react";
import type { ProposalSection } from "@/types";
import { descriptionTemplates } from "@/data/templates";
import AnnotationCanvas from "./AnnotationCanvas";

interface Props {
  section: ProposalSection;
  index: number;
  total: number;
  onUpdate: (section: ProposalSection) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}

export default function SectionEditor({
  section,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
}: Props) {
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [openTemplateCategory, setOpenTemplateCategory] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageScale, setImageScale] = useState(100);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({
        ...section,
        imageUrl: ev.target?.result as string,
        imageName: file.name,
        annotatedImageUrl: undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [section, onUpdate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const displayImage = section.annotatedImageUrl || section.imageUrl;

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
            {index + 1}
          </span>
          <span className="font-bold text-gray-700 text-base">
            セクション {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* 並べ替えボタン */}
          <button
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
            title="上に移動"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
            title="下に移動"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          {/* 削除ボタン（確認付き） */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-red-600 font-medium">削除する？</span>
              <button
                onClick={onDelete}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600"
              >
                はい
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-300"
              >
                いいえ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="このセクションを削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* 写真エリア */}
          <div
            className="lg:w-1/2"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {displayImage ? (
              <div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={displayImage}
                    alt={section.imageName}
                    className="object-contain rounded-xl"
                    style={{ width: `${imageScale}%`, maxWidth: "100%" }}
                  />
                </div>
                {/* 画像サイズスライダー */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">小</span>
                  <input type="range" min={30} max={100} value={imageScale}
                    onChange={(e) => setImageScale(Number(e.target.value))}
                    className="flex-1 accent-blue-500" />
                  <span className="text-xs text-gray-400">大</span>
                  <span className="text-xs text-gray-500 w-8">{imageScale}%</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowAnnotation(true)}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm sm:text-base font-bold hover:bg-red-600 transition-colors"
                  >
                    注釈を描く
                  </button>
                  <label className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-200 transition-colors cursor-pointer text-center">
                    写真を変更
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center w-full h-52 lg:h-64 border-3 border-dashed rounded-xl cursor-pointer transition-colors ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                }`}
                style={{ borderWidth: "3px" }}
              >
                <svg
                  className="w-14 h-14 text-gray-300 mb-3"
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
                <span className="text-gray-500 text-base font-bold mb-1">
                  ここをタップして写真を選択
                </span>
                <span className="text-gray-400 text-sm hidden lg:block">
                  またはファイルをドラッグ＆ドロップ
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 説明文エリア */}
          <div className="mt-4 lg:mt-0 lg:w-1/2 flex flex-col">
            <label className="text-base font-bold text-gray-700 mb-2">
              説明文
            </label>
            <textarea
              value={section.description}
              onChange={(e) =>
                onUpdate({ ...section, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none lg:h-36"
              placeholder="説明文を入力、またはテンプレートから選択..."
            />
            {/* テンプレート（常時表示アコーディオン） */}
            <div className="mt-3 border-2 border-amber-200 rounded-xl overflow-hidden bg-amber-50">
              <div className="px-3 py-2 text-sm font-bold text-amber-700">テンプレートから選ぶ</div>
              <div className="max-h-40 overflow-y-auto bg-white">
                {descriptionTemplates.map((cat, catIdx) => (
                  <div key={catIdx} className="border-t border-gray-100">
                    <button
                      onClick={() => setOpenTemplateCategory(openTemplateCategory === catIdx ? null : catIdx)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${openTemplateCategory === catIdx ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openTemplateCategory === catIdx && (
                      <div className="bg-gray-50">
                        {cat.templates.map((tmpl, tmplIdx) => (
                          <button
                            key={tmplIdx}
                            onClick={() => {
                              const newDesc = section.description ? section.description + "\n" + tmpl : tmpl;
                              onUpdate({ ...section, description: newDesc });
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-xs text-gray-600 border-t border-gray-100"
                          >
                            {tmpl.length > 60 ? tmpl.slice(0, 60) + "..." : tmpl}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAnnotation && section.imageUrl && (
        <AnnotationCanvas
          imageUrl={section.imageUrl}
          annotations={section.annotations}
          onAnnotationsChange={(anns) =>
            onUpdate({ ...section, annotations: anns })
          }
          onSave={(dataUrl) =>
            onUpdate({ ...section, annotatedImageUrl: dataUrl })
          }
          onClose={() => setShowAnnotation(false)}
        />
      )}
    </div>
  );
}
