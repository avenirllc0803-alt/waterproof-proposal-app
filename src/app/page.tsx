"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const loadProposalDemo = () => {
    sessionStorage.setItem(
      "customerInfo",
      JSON.stringify({
        customerName: "サンプル不動産 様",
        propertyName: "サンプルマンション 屋上防水工事",
        date: new Date().toISOString().split("T")[0],
        companyName: "防水工房サンプル",
      })
    );
    sessionStorage.setItem("useDemo", "true");
    router.push("/edit");
  };

  const loadEstimateDemo = () => {
    sessionStorage.setItem("useEstimateDemo", "true");
    router.push("/estimate");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-blue-600"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            現場書類ジェネレーター
          </h1>
          <p className="text-gray-500 mt-2 text-base sm:text-lg">
            防水・塗装工事の書類をかんたん作成
          </p>
        </div>

        {/* 機能選択カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* 現場提案書 */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">現場提案書</h2>
            </div>
            <p className="text-gray-500 text-sm sm:text-base mb-6 flex-1">
              現場写真と説明文で調査報告書・提案書を作成します。
            </p>
            <button
              onClick={() => router.push("/proposal")}
              className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors shadow"
            >
              作成する
            </button>
            <button
              onClick={loadProposalDemo}
              className="w-full mt-3 bg-gray-100 text-gray-600 py-3 rounded-xl text-base hover:bg-gray-200 transition-colors"
            >
              デモで試す
            </button>
          </div>

          {/* 見積書 */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">見積書</h2>
            </div>
            <p className="text-gray-500 text-sm sm:text-base mb-6 flex-1">
              防水・塗装工事の見積書を材料テンプレートから作成します。
            </p>
            <button
              onClick={() => router.push("/estimate")}
              className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors shadow"
            >
              作成する
            </button>
            <button
              onClick={loadEstimateDemo}
              className="w-full mt-3 bg-gray-100 text-gray-600 py-3 rounded-xl text-base hover:bg-gray-200 transition-colors"
            >
              デモで試す
            </button>
          </div>

          {/* 請求書 */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">請求書</h2>
            </div>
            <p className="text-gray-500 text-sm sm:text-base mb-6 flex-1">
              見積書のデータから請求書を作成。振込先も設定できます。
            </p>
            <button
              onClick={() => router.push("/invoice")}
              className="w-full bg-orange-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-orange-700 transition-colors shadow"
            >
              作成する
            </button>
          </div>
        </div>

        {/* 保存・読み込み */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            作成したデータはPDF出力・PCに保存・Google ドライブに保存ができます
          </p>
        </div>
      </div>
    </div>
  );
}
