"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CustomerInfo, EstimateItem } from "@/types";

export default function InvoicePage() {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"info" | "preview">("info");
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState<CustomerInfo>({
    customerName: "",
    propertyName: "",
    date: new Date().toISOString().split("T")[0],
    companyName: "",
  });
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const now = new Date();
    return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-001`;
  });
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // 月末
    return d.toISOString().split("T")[0];
  });
  const [bankInfo, setBankInfo] = useState("○○銀行 ○○支店 普通 1234567\n口座名義：カ）○○ボウスイ");
  const [notes, setNotes] = useState("・お振込み手数料はお客様ご負担でお願いいたします。");
  const taxRate = 10;

  useEffect(() => {
    const fromEstimate = sessionStorage.getItem("invoiceFromEstimate");
    if (fromEstimate) {
      try {
        const data = JSON.parse(fromEstimate);
        if (data.customerInfo) setForm({ ...data.customerInfo, date: new Date().toISOString().split("T")[0] });
        if (data.items) setItems(data.items);
        if (data.notes) setNotes(data.notes);
        sessionStorage.removeItem("invoiceFromEstimate");
        setStep("preview");
      } catch { /* ignore */ }
    }
  }, []);

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
      pdf.save(`請求書_${form.propertyName}_${form.date}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF生成に失敗しました。");
    } finally {
      setGenerating(false);
    }
  };

  const saveToPC = () => {
    const data = { type: "invoice", customerInfo: form, items, invoiceNumber, dueDate, bankInfo, notes, taxRate };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `請求書_${form.propertyName}_${form.date}.json`;
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
        if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
        if (data.dueDate) setDueDate(data.dueDate);
        if (data.bankInfo) setBankInfo(data.bankInfo);
        if (data.notes) setNotes(data.notes);
        setStep("preview");
      } catch {
        alert("ファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  };

  // ステップ1: 基本情報入力
  if (step === "info") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg md:max-w-xl lg:max-w-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">請求書</h1>
            <p className="text-gray-500 mt-2">請求情報を入力してください</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <p className="text-orange-700 text-sm sm:text-base text-center">
              見積書から作成する���合は、見積書プレビューの「請求書を作成」ボタンから進めます。
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setStep("preview"); }} className="space-y-5">
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">会社名</label>
              <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg" placeholder="株式会社○○防水" />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">お客様名 <span className="text-red-500 text-sm font-normal">（必須）</span></label>
              <input type="text" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg" placeholder="○○不動産 様" required />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">工事名 <span className="text-red-500 text-sm font-normal">（必須）</span></label>
              <input type="text" value={form.propertyName} onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg" placeholder="○○マンション 屋上防水工事" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">請求書番号</label>
                <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base" />
              </div>
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">発行日</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base" />
              </div>
            </div>
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">お支払期限</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg" />
            </div>
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">振込先</label>
              <textarea value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} rows={2}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base" />
            </div>
            <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-xl text-xl font-bold hover:bg-orange-700 transition-colors shadow-lg">
              プレビュー →
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

  // ステップ2: プレビュー
  return (
    <div className="min-h-screen bg-gray-100 pb-28">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setStep("info")} className="text-gray-500 hover:text-gray-700 text-base py-2 px-3 rounded-lg hover:bg-gray-100">← 戻る</button>
            <h1 className="font-bold text-gray-800 text-lg">請求書プレビュー</h1>
            <button onClick={generatePdf} disabled={generating}
              className="px-5 py-3 bg-orange-600 text-white rounded-xl text-base font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors shadow">
              {generating ? "生成中..." : "PDF出力"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto p-4">
        <div ref={previewRef} className="bg-white shadow-lg" style={{ padding: "40px", minHeight: "297mm" }}>
          <h1 className="text-3xl font-bold text-center mb-8 tracking-widest">請 求 書</h1>

          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-lg font-bold border-b-2 border-gray-800 pb-1 inline-block">{form.customerName}</p>
              <p className="text-sm text-gray-600 mt-2">工事名：{form.propertyName}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-medium text-base">{form.companyName}</p>
              <p className="mt-1">請求書番号：{invoiceNumber}</p>
              <p>発行日：{form.date.replace(/-/g, "/")}</p>
              <p>お支払期限：{dueDate.replace(/-/g, "/")}</p>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-800 rounded-lg p-4 mb-8 text-center">
            <p className="text-sm text-gray-600 mb-1">ご請求金額（税込）</p>
            <p className="text-3xl font-bold">¥{formatNumber(total)}-</p>
          </div>

          {items.length > 0 && (
            <table className="w-full border-collapse mb-6 text-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="py-2 px-3 text-left">No.</th>
                  <th className="py-2 px-3 text-left">項目名</th>
                  <th className="py-2 px-3 text-right">数量</th>
                  <th className="py-2 px-3 text-center">単位</th>
                  <th className="py-2 px-3 text-right">単価</th>
                  <th className="py-2 px-3 text-right">金額</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-2 px-3 border-b">{i + 1}</td>
                    <td className="py-2 px-3 border-b">{item.name}{item.note && <span className="text-xs text-gray-400 ml-1">({item.note})</span>}</td>
                    <td className="py-2 px-3 border-b text-right">{item.quantity}</td>
                    <td className="py-2 px-3 border-b text-center">{item.unit}</td>
                    <td className="py-2 px-3 border-b text-right">¥{formatNumber(item.unitPrice)}</td>
                    <td className="py-2 px-3 border-b text-right font-medium">¥{formatNumber(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b text-sm"><span>小計</span><span>¥{formatNumber(subtotal)}</span></div>
              <div className="flex justify-between py-2 border-b text-sm"><span>消費税（{taxRate}%）</span><span>¥{formatNumber(tax)}</span></div>
              <div className="flex justify-between py-2 text-lg font-bold"><span>合計</span><span>¥{formatNumber(total)}</span></div>
            </div>
          </div>

          {/* 振込先 */}
          <div className="mt-8 border-t pt-4">
            <p className="text-sm font-bold text-gray-700 mb-2">お振込先</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{bankInfo}</p>
          </div>

          {notes && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-bold text-gray-700 mb-2">備考</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto flex gap-3">
          <button onClick={saveToPC} className="flex-shrink-0 px-5 py-4 bg-gray-100 text-gray-700 rounded-xl text-base font-bold hover:bg-gray-200">PCに保存</button>
          <button onClick={generatePdf} disabled={generating}
            className="flex-1 bg-orange-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-lg">
            {generating ? "PDF生成中..." : "PDFをダウンロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
