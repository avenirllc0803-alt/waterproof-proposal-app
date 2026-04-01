"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo } from "@/types";

export default function ProposalPage() {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg md:max-w-xl lg:max-w-2xl p-6 sm:p-8">
        {/* ステップ表示 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">1</span>
            <span className="text-sm font-bold text-blue-600 hidden sm:inline">基本情報</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300" />
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-400 text-sm font-bold rounded-full">2</span>
            <span className="text-sm text-gray-400 hidden sm:inline">写真・説明</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300" />
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-400 text-sm font-bold rounded-full">3</span>
            <span className="text-sm text-gray-400 hidden sm:inline">確認・出力</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            現場提案書
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            写真と説明文で、プロの提案書を簡単作成
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-700 text-sm sm:text-base text-center">
            まず、お客様の情報を入力してください。あとから変更もできます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off" data-form-type="other">
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">会社名</label>
            <input
              type="text"
              name="company_name_field"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="株式会社○○防水"
              autoComplete="off"
              data-lpignore="true"
            />
          </div>
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">
              お客様名 <span className="text-red-500 text-sm font-normal">（必須）</span>
            </label>
            <input
              type="text"
              name="customer_name_field"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="○○不動産 様"
              required
              autoComplete="off"
              data-lpignore="true"
            />
          </div>
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">
              物件名・工事名 <span className="text-red-500 text-sm font-normal">（必須）</span>
            </label>
            <input
              type="text"
              name="property_name_field"
              value={form.propertyName}
              onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="○○マンション 屋上防水工事"
              required
              autoComplete="off"
              data-lpignore="true"
            />
          </div>
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">日付</label>
            <input
              type="date"
              name="work_date_field"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              required
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-5 rounded-xl text-xl font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
            style={{ touchAction: "manipulation", minHeight: 56 }}
          >
            次へ進む →
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push("/")}
            onPointerDown={() => router.push("/")}
            className="w-full text-gray-500 py-3 rounded-xl text-base hover:bg-gray-100 active:bg-gray-200 transition-colors"
            style={{ touchAction: "manipulation", minHeight: 48 }}
          >
            ← トップに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
