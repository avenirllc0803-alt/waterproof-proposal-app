"use client";

import { useState } from "react";
import { descriptionTemplates } from "@/data/templates";

interface Props {
  currentDescription: string;
  onSelect: (text: string) => void;
  onClose: () => void;
}

export default function TemplateSelector({
  currentDescription,
  onSelect,
  onClose,
}: Props) {
  const [openCategory, setOpenCategory] = useState<number | null>(null);

  const handleSelect = (text: string) => {
    const newDesc = currentDescription
      ? currentDescription + "\n" + text
      : text;
    onSelect(newDesc);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">説明文テンプレート</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {descriptionTemplates.map((cat, catIdx) => (
            <div key={catIdx} className="border rounded-xl overflow-hidden">
              <button
                onClick={() =>
                  setOpenCategory(openCategory === catIdx ? null : catIdx)
                }
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
              >
                <span className="font-medium text-gray-700">
                  {cat.category}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    openCategory === catIdx ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openCategory === catIdx && (
                <div className="divide-y">
                  {cat.templates.map((tmpl, tmplIdx) => (
                    <button
                      key={tmplIdx}
                      onClick={() => handleSelect(tmpl)}
                      className="w-full text-left p-3 hover:bg-blue-50 text-sm text-gray-600 whitespace-pre-wrap"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
