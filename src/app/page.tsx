"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo } from "@/types";

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<CustomerInfo>({
    customerName: "",
    propertyName: "",
    date: new Date().toISOString().split("T")[0],
    companyName: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("customerInfo", JSON.stringify(form));
    router.push("/edit");
  };

  const loadDemo = () => {
    const demoData: CustomerInfo = {
      customerName: "サンプル不動産 様",
      propertyName: "サンプルマンション 屋上防水工事",
      date: new Date().toISOString().split("T")[0],
      companyName: "防水工房サンプル",
    };
    setForm(demoData);
    sessionStorage.setItem("customerInfo", JSON.stringify(demoData));
    sessionStorage.setItem("useDemo", "true");
    router.push("/edit");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg md:max-w-xl lg:max-w-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            現場提案書ジェネレーター
          </h1>
          <p className="text-gray-500 mt-2">
            写真と説明文で、プロの提案書を簡単作成
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社名
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="株式会社○○防水"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お客様名
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="○○不動産 様"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              物件名・工事名
            </label>
            <input
              type="text"
              value={form.propertyName}
              onChange={(e) =>
                setForm({ ...form, propertyName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="○○マンション 屋上防水工事"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日付
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors"
          >
            提案書を作成する
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={loadDemo}
            className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl text-base hover:bg-gray-200 transition-colors"
          >
            デモデータで試す
          </button>
        </div>
      </div>
    </div>
  );
}
