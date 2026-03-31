"use client";

import { useState } from "react";
import type { ProposalSection } from "@/types";
import AnnotationCanvas from "./AnnotationCanvas";
import TemplateSelector from "./TemplateSelector";

interface Props {
  section: ProposalSection;
  index: number;
  onUpdate: (section: ProposalSection) => void;
  onDelete: () => void;
}

export default function SectionEditor({
  section,
  index,
  onUpdate,
  onDelete,
}: Props) {
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    }
  };

  const displayImage = section.annotatedImageUrl || section.imageUrl;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <span className="font-bold text-gray-700">
          セクション {index + 1}
        </span>
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-600 text-sm"
        >
          削除
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 写真エリア */}
        <div>
          {displayImage ? (
            <div className="relative group">
              <img
                src={displayImage}
                alt={section.imageName}
                className="w-full max-h-64 object-contain rounded-xl bg-gray-100"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setShowAnnotation(true)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                >
                  注釈を描く
                </button>
                <label className="px-3 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium cursor-pointer">
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
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <svg
                className="w-10 h-10 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-gray-500 text-sm">
                タップして写真を選択
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
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              説明文
            </label>
            <button
              onClick={() => setShowTemplate(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              テンプレートから選ぶ
            </button>
          </div>
          <textarea
            value={section.description}
            onChange={(e) =>
              onUpdate({ ...section, description: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            placeholder="説明文を入力、またはテンプレートから選択してください..."
          />
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

      {showTemplate && (
        <TemplateSelector
          currentDescription={section.description}
          onSelect={(desc) => onUpdate({ ...section, description: desc })}
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  );
}
