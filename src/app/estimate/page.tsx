"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo, EstimateItem } from "@/types";
import { estimateTemplates, demoEstimateItems } from "@/data/estimateTemplates";

export default function EstimatePage() {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"info" | "items" | "preview">("info");
  const [generating, setGenerating] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemNameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [form, setForm] = useState<CustomerInfo>({
    customerName: "",
    propertyName: "",
    date: new Date().toISOString().split("T")[0],
    companyName: "",
  });
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("・上記金額には消費税が含まれておりません。\n・工事期間中の天候により工期が変動する場合がございます。");
  const taxRate = 10;

  useEffect(() => {
    const isDemo = sessionStorage.getItem("useEstimateDemo");
    if (isDemo === "true") {
      setForm({
        customerName: "サンプル不動産 様",
        propertyName: "サンプルマンション 屋上防水工事",
        date: new Date().toISOString().split("T")[0],
        companyName: "防水工房サンプル",
      });
      setItems(
        demoEstimateItems.map((d, i) => ({ ...d, id: `demo-${i}` }))
      );
      sessionStorage.removeItem("useEstimateDemo");
      setStep("items");
    }
  }, []);

  // クリック外でドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addItem = useCallback(() => {
    const newId = Date.now().toString();
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        category: "",
        name: "",
        unit: "㎡",
        quantity: 0,
        unitPrice: 0,
        note: "",
      },
    ]);
    // 新しい項目のドロップダウンを開き、フォーカスする
    setTimeout(() => {
      setOpenDropdownId(newId);
      itemNameRefs.current[newId]?.focus();
    }, 50);
  }, []);

  const applyTemplate = (itemId: string, cat: string, tmpl: { name: string; unit: string; unitPrice: number; note: string }) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, category: cat, name: tmpl.name, unit: tmpl.unit, unitPrice: tmpl.unitPrice, note: tmpl.note }
          : item
      )
    );
    setOpenDropdownId(null);
  };

  const updateItem = (id: string, field: keyof EstimateItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = Math.floor(subtotal * (taxRate / 100));
  const total = subtotal + tax;

  const formatNumber = (n: number) => n.toLocaleString("ja-JP");

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const element = previewRef.current;
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
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
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (!w) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `見積書_${form.propertyName}_${form.date}.pdf`;
        a.click();
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF生成に失敗しました。もう一度お試しください。");
    } finally {
      setGenerating(false);
    }
  };

  const saveToPC = () => {
    const data = { customerInfo: form, items, validUntil, notes, taxRate };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `見積書_${form.propertyName}_${form.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromPC = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.customerInfo) setForm(data.customerInfo);
        if (data.items) setItems(data.items);
        if (data.validUntil) setValidUntil(data.validUntil);
        if (data.notes) setNotes(data.notes);
        setStep("items");
      } catch {
        alert("ファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  };

  // 見積書データを請求書ページに引き継ぐ
  const createInvoice = () => {
    sessionStorage.setItem("invoiceFromEstimate", JSON.stringify({ customerInfo: form, items, notes, taxRate }));
    router.push("/invoice");
  };

  // ステップ1: 基本情報入力
  if (step === "info") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg md:max-w-xl lg:max-w-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">見積書</h1>
            <p className="text-gray-500 mt-2">お客様情報を入力してください</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 text-sm sm:text-base text-center">
              保存済みの見積書データがある場合は、下の「読み込む」から開けます。
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setStep("items"); }} className="space-y-6">
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">会社名</label>
              <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg" placeholder="株式会社○○防水" />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">
                お客様名 <span className="text-red-500 text-sm font-normal">（必須）</span>
              </label>
              <input type="text" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg" placeholder="○○不動産 様" required />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">
                工事名 <span className="text-red-500 text-sm font-normal">（必須）</span>
              </label>
              <input type="text" value={form.propertyName} onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg" placeholder="○○マンション 屋上防水工事" required />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">見積日</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg" required />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">見積有効期限</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg" />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-xl text-xl font-bold hover:bg-green-700 transition-colors shadow-lg">
              次へ：項目を入力 →
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
            <label className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-base hover:bg-gray-200 transition-colors text-center cursor-pointer">
              保存データを読み込む
              <input type="file" accept=".json" onChange={loadFromPC} className="hidden" />
            </label>
            <button onClick={() => router.push("/")} className="flex-1 text-gray-500 py-3 rounded-xl text-base hover:bg-gray-100 transition-colors">
              ← トップに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ステップ2: 項目入力
  if (step === "items") {
    return (
      <div className="min-h-screen pb-28">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-2xl lg:max-w-full mx-auto px-4 lg:px-12 xl:px-16 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("info")} className="text-gray-500 hover:text-gray-700 text-base py-2 px-3 rounded-lg hover:bg-gray-100">← 戻る</button>
                <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-sm py-2 px-3 rounded-lg hover:bg-gray-100">トップ</button>
              </div>
              <h1 className="font-bold text-gray-800 text-lg">見積書 — 項目入力</h1>
              <div className="w-24" />
            </div>
            <div className="mt-2 text-sm text-gray-500 text-center">{form.propertyName} / {form.customerName}</div>
          </div>
        </div>

        <div className="max-w-2xl lg:max-w-full mx-auto px-4 lg:px-12 xl:px-16 py-4">
          {/* 項目リスト */}
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={item.id} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-green-600 text-white text-sm font-bold rounded-full">{i + 1}</span>
                  <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 text-sm px-2 py-1">削除</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 relative" ref={openDropdownId === item.id ? dropdownRef : undefined}>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">項目名</label>
                    <div className="flex">
                      <input
                        type="text"
                        ref={(el) => { itemNameRefs.current[item.id] = el; }}
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        className="w-full px-3 py-3 border-2 border-gray-300 rounded-l-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="項目名"
                      />
                      <button
                        type="button"
                        onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                        className="px-3 py-3 border-2 border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-amber-50 hover:border-amber-300 text-gray-500 hover:text-amber-700 transition-colors text-sm font-bold flex-shrink-0"
                        title="テンプレートから選択"
                      >
                        ▼
                      </button>
                    </div>
                    {openDropdownId === item.id && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border-2 border-gray-200 shadow-xl z-20 max-h-72 overflow-y-auto" style={{ minWidth: "320px" }}>
                        {estimateTemplates.map((cat) => (
                          <div key={cat.category} className="border-b last:border-b-0">
                            <div className="px-4 py-2 bg-gray-50 font-bold text-gray-700 text-xs sticky top-0">{cat.category}</div>
                            <div className="divide-y">
                              {cat.items.map((tmpl, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => applyTemplate(item.id, cat.category, tmpl)}
                                  className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">{tmpl.name}</span>
                                    {tmpl.note && <span className="text-xs text-gray-400 ml-2">({tmpl.note})</span>}
                                  </div>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    ¥{formatNumber(tmpl.unitPrice)}/{tmpl.unit}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">数量</label>
                    <div className="flex">
                      <input type="number" value={item.quantity || ""} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-3 border-2 border-gray-300 rounded-l-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="0" />
                      <select value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                        className="px-2 py-3 border-2 border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-sm">
                        <option>㎡</option><option>m</option><option>箇所</option><option>枚</option><option>式</option><option>缶</option><option>本</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">単価（円）</label>
                    <input type="number" value={item.unitPrice || ""} onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="0" />
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <input type="text" value={item.note} onChange={(e) => updateItem(item.id, "note", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500" placeholder="備考" />
                  <span className="ml-3 text-base font-bold text-gray-800 flex-shrink-0">
                    ¥{formatNumber(item.quantity * item.unitPrice)}
                  </span>
                </div>
              </div>
            ))}

            <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-colors font-bold text-base"
              style={{ borderWidth: "3px" }}>
              + 項目を追加
            </button>
          </div>

          {/* 合計欄 */}
          {items.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border-2 border-gray-200 p-4">
              <div className="flex justify-between text-base mb-2">
                <span className="text-gray-600">小計</span>
                <span className="font-bold">¥{formatNumber(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base mb-2">
                <span className="text-gray-600">消費税（{taxRate}%）</span>
                <span className="font-bold">¥{formatNumber(tax)}</span>
              </div>
              <div className="flex justify-between text-xl pt-2 border-t-2">
                <span className="font-bold text-gray-800">合計（税込）</span>
                <span className="font-bold text-green-700">¥{formatNumber(total)}</span>
              </div>
            </div>
          )}

          {/* 備考欄 */}
          <div className="mt-4">
            <label className="text-base font-bold text-gray-700 mb-2 block">備考・注意事項</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
        </div>

        {/* 下部バー */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-2xl lg:max-w-full mx-auto px-4 lg:px-12 xl:px-16">
              <button onClick={() => setStep("preview")} className="w-full bg-green-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-green-700 transition-colors shadow-lg">
                プレビュー →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ステップ3: プレビュー
  return (
    <div className="min-h-screen bg-gray-100 pb-28">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl lg:max-w-full xl:max-w-full mx-auto px-4 lg:px-12 xl:px-16 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep("items")} className="text-gray-500 hover:text-gray-700 text-base py-2 px-3 rounded-lg hover:bg-gray-100">← 項目に戻る</button>
              <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-sm py-2 px-3 rounded-lg hover:bg-gray-100">トップ</button>
            </div>
            <h1 className="font-bold text-gray-800 text-lg">見積書プレビュー</h1>
            <div className="flex gap-2">
              <button onClick={generatePdf} disabled={generating}
                className="px-5 py-3 bg-green-600 text-white rounded-xl text-base font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow">
                {generating ? "生成中..." : "PDF出力"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl lg:max-w-full xl:max-w-full mx-auto p-4 lg:px-12 xl:px-16">
        <div ref={previewRef} className="bg-white shadow-lg" style={{ padding: "48px", minHeight: "297mm", maxWidth: "210mm", margin: "0 auto" }}>
          {/* 見積書ヘッダー */}
          <h1 className="text-4xl font-bold text-center mb-10 tracking-widest">御 見 積 書</h1>

          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xl font-bold border-b-2 border-gray-800 pb-1 inline-block">{form.customerName}</p>
              <p className="text-base text-gray-600 mt-2">工事名：{form.propertyName}</p>
            </div>
            <div className="text-right text-base text-gray-600">
              <p className="font-medium text-lg">{form.companyName}</p>
              <p className="mt-1">見積日：{form.date.replace(/-/g, "/")}</p>
              <p>有効期限：{validUntil.replace(/-/g, "/")}</p>
            </div>
          </div>

          {/* 合計金額 */}
          <div className="bg-gray-50 border-2 border-gray-800 rounded-lg p-5 mb-8 text-center">
            <p className="text-base text-gray-600 mb-1">お見積金額（税込）</p>
            <p className="text-4xl font-bold">¥{formatNumber(total)}-</p>
          </div>

          {/* 明細テーブル */}
          <table className="w-full border-collapse mb-8 text-base">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="py-3 px-3 text-left">No.</th>
                <th className="py-3 px-3 text-left">項目名</th>
                <th className="py-3 px-3 text-right">数量</th>
                <th className="py-3 px-3 text-center">単位</th>
                <th className="py-3 px-3 text-right">単価</th>
                <th className="py-3 px-3 text-right">金額</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-2.5 px-3 border-b">{i + 1}</td>
                  <td className="py-2.5 px-3 border-b">
                    {item.name}
                    {item.note && <span className="text-sm text-gray-400 ml-1">({item.note})</span>}
                  </td>
                  <td className="py-2.5 px-3 border-b text-right">{item.quantity}</td>
                  <td className="py-2.5 px-3 border-b text-center">{item.unit}</td>
                  <td className="py-2.5 px-3 border-b text-right">¥{formatNumber(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 border-b text-right font-medium">¥{formatNumber(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 合計欄 */}
          <div className="flex justify-end">
            <div className="w-72">
              <div className="flex justify-between py-2 border-b text-base">
                <span>小計</span><span>¥{formatNumber(subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-base">
                <span>消費税（{taxRate}%）</span><span>¥{formatNumber(tax)}</span>
              </div>
              <div className="flex justify-between py-3 text-xl font-bold">
                <span>合計</span><span>¥{formatNumber(total)}</span>
              </div>
            </div>
          </div>

          {/* 備考 */}
          {notes && (
            <div className="mt-8 border-t pt-4">
              <p className="text-base font-bold text-gray-700 mb-2">備考</p>
              <p className="text-base text-gray-600 whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 下部バー */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-4xl lg:max-w-full xl:max-w-full mx-auto px-4 lg:px-12 xl:px-16 flex gap-3">
          <button onClick={createInvoice} className="flex-shrink-0 px-5 py-4 bg-orange-600 text-white rounded-xl text-base font-bold hover:bg-orange-700">
            請求書を作成
          </button>
          <button onClick={generatePdf} disabled={generating}
            className="flex-1 bg-green-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg">
            {generating ? "PDF生成中..." : "PDFをダウンロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
