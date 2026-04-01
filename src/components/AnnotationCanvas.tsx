"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Annotation } from "@/types";

interface Props {
  imageUrl: string;
  annotations: Annotation[];
  onAnnotationsChange: (annotations: Annotation[]) => void;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

type Tool = "select" | "circle" | "arrow" | "text" | "rectangle";
// 8方向 + 矢印の始点/終点
type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "start" | "end" | "move" | "none";

const COLORS = [
  { v: "#FF0000", l: "赤" }, { v: "#0000FF", l: "青" }, { v: "#00AA00", l: "緑" },
  { v: "#FFcc00", l: "黄" }, { v: "#000000", l: "黒" }, { v: "#FF6600", l: "橙" },
];
const BG_COLORS = [
  { v: "", l: "なし" }, { v: "rgba(255,255,255,0.85)", l: "白" },
  { v: "rgba(255,255,200,0.85)", l: "黄" }, { v: "rgba(200,230,255,0.85)", l: "青" },
];
const HS = 7; // ハンドルサイズ

// 図形のバウンディングボックスを取得
function getBBox(a: Annotation): { x1: number; y1: number; x2: number; y2: number } {
  if (a.type === "circle") {
    const rx = Math.abs(a.radiusX || 0), ry = Math.abs(a.radiusY || 0);
    return { x1: a.x - rx, y1: a.y - ry, x2: a.x + rx, y2: a.y + ry };
  }
  if (a.type === "rectangle") {
    const x1 = Math.min(a.x, a.x + (a.width || 0)), y1 = Math.min(a.y, a.y + (a.height || 0));
    const x2 = Math.max(a.x, a.x + (a.width || 0)), y2 = Math.max(a.y, a.y + (a.height || 0));
    return { x1, y1, x2, y2 };
  }
  if (a.type === "arrow") {
    return { x1: Math.min(a.x, a.endX || a.x), y1: Math.min(a.y, a.endY || a.y), x2: Math.max(a.x, a.endX || a.x), y2: Math.max(a.y, a.endY || a.y) };
  }
  // テキスト: フォントサイズと文字数から概算
  const fs = a.fontSize || 18;
  const textLen = (a.text || "").length;
  const estWidth = Math.max(textLen * fs * 0.65, 30);
  return { x1: a.x - 8, y1: a.y - fs - 8, x2: a.x + estWidth + 8, y2: a.y + 8 };
}

function hitTestShape(a: Annotation, x: number, y: number): boolean {
  const bb = getBBox(a);
  const pad = 10;
  if (a.type === "text") return x >= bb.x1 - pad && x <= bb.x2 + pad && y >= bb.y1 - pad && y <= bb.y2 + pad;
  if (a.type === "circle") {
    const rx = Math.abs(a.radiusX || 1), ry = Math.abs(a.radiusY || 1);
    const dx = (x - a.x) / rx, dy = (y - a.y) / ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    return d < 1.3;
  }
  if (a.type === "rectangle") return x >= bb.x1 - pad && x <= bb.x2 + pad && y >= bb.y1 - pad && y <= bb.y2 + pad;
  if (a.type === "arrow" && a.endX !== undefined && a.endY !== undefined) {
    const len = Math.hypot(a.endX - a.x, a.endY - a.y);
    if (len < 1) return false;
    const t = Math.max(0, Math.min(1, ((x - a.x) * (a.endX - a.x) + (y - a.y) * (a.endY - a.y)) / (len * len)));
    return Math.hypot(x - (a.x + t * (a.endX - a.x)), y - (a.y + t * (a.endY - a.y))) < pad;
  }
  return false;
}

// 8方向ハンドルの位置
function getHandles(a: Annotation): { type: HandleType; x: number; y: number }[] {
  if (a.type === "text") return []; // テキストは移動のみ（ハンドルなし）
  if (a.type === "arrow") {
    return [
      { type: "start", x: a.x, y: a.y },
      { type: "end", x: a.endX || a.x, y: a.endY || a.y },
    ];
  }
  const bb = getBBox(a);
  const cx = (bb.x1 + bb.x2) / 2, cy = (bb.y1 + bb.y2) / 2;
  return [
    { type: "nw", x: bb.x1, y: bb.y1 }, { type: "n", x: cx, y: bb.y1 },
    { type: "ne", x: bb.x2, y: bb.y1 }, { type: "e", x: bb.x2, y: cy },
    { type: "se", x: bb.x2, y: bb.y2 }, { type: "s", x: cx, y: bb.y2 },
    { type: "sw", x: bb.x1, y: bb.y2 }, { type: "w", x: bb.x1, y: cy },
  ];
}

function hitHandle(a: Annotation, x: number, y: number): HandleType {
  for (const h of getHandles(a)) {
    if (Math.hypot(x - h.x, y - h.y) < HS + 5) return h.type;
  }
  return "none";
}

export default function AnnotationCanvas({ imageUrl, annotations, onAnnotationsChange, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [handle, setHandle] = useState<HandleType>("none");
  const [shiftHeld, setShiftHeld] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [anns, setAnns] = useState<Annotation[]>(annotations);
  const [selId, setSelId] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cvs, setCvs] = useState({ width: 0, height: 0 });
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState("#FF0000");
  const [textBoxed, setTextBoxed] = useState(false);
  const [textBgColor, setTextBgColor] = useState("");
  const [fontSize, setFontSize] = useState(18);

  const sel = anns.find((a) => a.id === selId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(true);
      if ((e.key === "Delete" || e.key === "Backspace") && selId && !textPos && !editingTextId) {
        setAnns((p) => p.filter((a) => a.id !== selId));
        setSelId(null);
      }
    };
    const up = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftHeld(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [selId, textPos, editingTextId]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      const c = containerRef.current;
      if (c) {
        const scale = Math.min((c.clientWidth - 4) / img.width, (c.clientHeight - 4) / img.height);
        setCvs({ width: Math.floor(img.width * scale), height: Math.floor(img.height * scale) });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawAnn = useCallback((ctx: CanvasRenderingContext2D, a: Annotation, isSel: boolean) => {
    const c = a.color || "#FF0000";
    const lw = a.lineWidth || 3;
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = lw;

    if (a.type === "circle" && a.radiusX !== undefined && a.radiusY !== undefined) {
      ctx.beginPath(); ctx.ellipse(a.x, a.y, Math.abs(a.radiusX), Math.abs(a.radiusY), 0, 0, Math.PI * 2); ctx.stroke();
    } else if (a.type === "arrow" && a.endX !== undefined && a.endY !== undefined) {
      const hl = 12 + lw * 2;
      const ang = Math.atan2(a.endY - a.y, a.endX - a.x);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.endX, a.endY); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(a.endX, a.endY);
      ctx.lineTo(a.endX - hl * Math.cos(ang - Math.PI / 6), a.endY - hl * Math.sin(ang - Math.PI / 6));
      ctx.moveTo(a.endX, a.endY);
      ctx.lineTo(a.endX - hl * Math.cos(ang + Math.PI / 6), a.endY - hl * Math.sin(ang + Math.PI / 6));
      ctx.stroke();
    } else if (a.type === "rectangle" && a.width !== undefined && a.height !== undefined) {
      ctx.beginPath(); ctx.strokeRect(a.x, a.y, a.width, a.height);
    } else if (a.type === "text" && a.text) {
      const fs = a.fontSize || 18;
      ctx.font = `bold ${fs}px sans-serif`;
      const m = ctx.measureText(a.text);
      const pad = 5;
      if (a.boxed || a.bgColor) {
        ctx.fillStyle = a.bgColor || "rgba(255,255,255,0.85)";
        ctx.fillRect(a.x - pad, a.y - fs - pad, m.width + pad * 2, fs + pad * 2);
        if (a.boxed) { ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.strokeRect(a.x - pad, a.y - fs - pad, m.width + pad * 2, fs + pad * 2); }
      }
      ctx.fillStyle = c; ctx.font = `bold ${fs}px sans-serif`; ctx.fillText(a.text, a.x, a.y);
    }

    if (isSel) {
      const handles = getHandles(a);
      // 選択枠
      if (a.type !== "arrow") {
        const bb = getBBox(a);
        ctx.strokeStyle = "#0088ff"; ctx.lineWidth = 1; ctx.setLineDash([4, 2]);
        ctx.strokeRect(bb.x1 - 3, bb.y1 - 3, bb.x2 - bb.x1 + 6, bb.y2 - bb.y1 + 6);
        ctx.setLineDash([]);
      }
      handles.forEach((h) => {
        ctx.fillStyle = "#fff"; ctx.strokeStyle = "#0088ff"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(h.x, h.y, HS, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    }
  }, []);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    anns.forEach((a) => drawAnn(ctx, a, a.id === selId));

    // 描画プレビュー
    if (handle === "none" && startPos && currentPos && tool !== "select" && tool !== "text") {
      ctx.setLineDash([6, 3]); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
      if (tool === "circle") {
        let rx = Math.abs(currentPos.x - startPos.x) / 2, ry = Math.abs(currentPos.y - startPos.y) / 2;
        if (shiftHeld) { const r = Math.max(rx, ry); rx = r; ry = r; }
        if (rx > 2 || ry > 2) { ctx.beginPath(); ctx.ellipse((startPos.x + currentPos.x) / 2, (startPos.y + currentPos.y) / 2, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
      } else if (tool === "arrow") {
        const hl = 12 + lineWidth * 2;
        const ang = Math.atan2(currentPos.y - startPos.y, currentPos.x - startPos.x);
        ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(currentPos.x, currentPos.y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(currentPos.x - hl * Math.cos(ang - Math.PI / 6), currentPos.y - hl * Math.sin(ang - Math.PI / 6));
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(currentPos.x - hl * Math.cos(ang + Math.PI / 6), currentPos.y - hl * Math.sin(ang + Math.PI / 6));
        ctx.stroke();
      } else if (tool === "rectangle") {
        let w = currentPos.x - startPos.x, h = currentPos.y - startPos.y;
        if (shiftHeld) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w) * s; h = Math.sign(h) * s; }
        ctx.strokeRect(startPos.x, startPos.y, w, h);
      }
      ctx.setLineDash([]);
    }
  }, [image, anns, selId, handle, startPos, currentPos, tool, color, lineWidth, shiftHeld, drawAnn]);

  useEffect(() => { drawAll(); }, [drawAll]);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    if ("touches" in e) { const t = e.touches.length > 0 ? e.touches[0] : e.changedTouches[0]; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const p = pos(e);
    if (editingTextId) return; // テキスト編集中は無視

    if (tool === "text") {
      // テキストツール中でも既存テキストをクリックしたら選択して編集
      for (let i = anns.length - 1; i >= 0; i--) {
        if (anns[i].type === "text" && hitTestShape(anns[i], p.x, p.y)) {
          setSelId(anns[i].id);
          setEditingTextId(anns[i].id);
          setTextInput(anns[i].text || "");
          setTool("select");
          return;
        }
      }
      setTextPos(p);
      return;
    }

    if (tool === "select") {
      // ハンドルチェック
      if (sel) {
        const h = hitHandle(sel, p.x, p.y);
        if (h !== "none") { setHandle(h); setStartPos(p); setCurrentPos(p); return; }
      }
      // 図形選択（テキスト含む）
      for (let i = anns.length - 1; i >= 0; i--) {
        if (hitTestShape(anns[i], p.x, p.y)) {
          setSelId(anns[i].id); setHandle("move"); setStartPos(p); setCurrentPos(p); return;
        }
      }
      setSelId(null); return;
    }
    // 描画ツール中でも既存図形をクリックしたら選択
    for (let i = anns.length - 1; i >= 0; i--) {
      if (hitTestShape(anns[i], p.x, p.y)) {
        setSelId(anns[i].id); setTool("select"); setHandle("move"); setStartPos(p); setCurrentPos(p); return;
      }
    }
    setStartPos(p); setCurrentPos(p); setHandle("none"); setSelId(null);
  };

  const handleDblClick = (e: React.MouseEvent) => {
    const p = pos(e);
    // どのツールでもテキストをダブルクリックすれば編集モードに入る
    for (let i = anns.length - 1; i >= 0; i--) {
      if (anns[i].type === "text" && hitTestShape(anns[i], p.x, p.y)) {
        setEditingTextId(anns[i].id);
        setTextInput(anns[i].text || "");
        setSelId(anns[i].id);
        setTool("select");
        return;
      }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const p = pos(e);
    setCurrentPos(p);
    if (!startPos) return;
    const dx = p.x - startPos.x, dy = p.y - startPos.y;

    if (handle === "move" && selId) {
      setAnns((prev) => prev.map((a) => {
        if (a.id !== selId) return a;
        const u = { ...a, x: a.x + dx, y: a.y + dy };
        if (a.endX !== undefined) u.endX = a.endX + dx;
        if (a.endY !== undefined) u.endY = a.endY + dy;
        return u;
      }));
      setStartPos(p);
    }

    if ((handle === "start" || handle === "end") && selId) {
      setAnns((prev) => prev.map((a) => {
        if (a.id !== selId) return a;
        return handle === "start" ? { ...a, x: p.x, y: p.y } : { ...a, endX: p.x, endY: p.y };
      }));
    }

    if (handle !== "none" && handle !== "move" && handle !== "start" && handle !== "end" && selId) {
      setAnns((prev) => prev.map((a) => {
        if (a.id !== selId) return a;
        const bb = getBBox(a);
        let x1 = bb.x1, y1 = bb.y1, x2 = bb.x2, y2 = bb.y2;
        if (handle.includes("w")) x1 = p.x;
        if (handle.includes("e")) x2 = p.x;
        if (handle.includes("n")) y1 = p.y;
        if (handle.includes("s")) y2 = p.y;
        if (handle === "n" || handle === "s") { x1 = bb.x1; x2 = bb.x2; }
        if (handle === "w" || handle === "e") { y1 = bb.y1; y2 = bb.y2; }
        if (shiftHeld && (handle === "nw" || handle === "ne" || handle === "sw" || handle === "se")) {
          const s = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
          if (handle.includes("e")) x2 = x1 + s; else x1 = x2 - s;
          if (handle.includes("s")) y2 = y1 + s; else y1 = y2 - s;
        }

        if (a.type === "circle") {
          const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
          return { ...a, x: cx, y: cy, radiusX: Math.abs(x2 - x1) / 2, radiusY: Math.abs(y2 - y1) / 2 };
        }
        if (a.type === "rectangle") {
          return { ...a, x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
        }
        return a;
      }));
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (handle !== "none") { setHandle("none"); setStartPos(null); setCurrentPos(null); return; }
    if (!startPos || !currentPos) { setStartPos(null); setCurrentPos(null); return; }

    const ep = pos(e);
    const id = Date.now().toString();

    if (tool === "circle") {
      let rx = Math.abs(ep.x - startPos.x) / 2, ry = Math.abs(ep.y - startPos.y) / 2;
      if (shiftHeld) { const r = Math.max(rx, ry); rx = r; ry = r; }
      if (rx > 3 || ry > 3) {
        setAnns((p) => [...p, { id, type: "circle", x: (startPos.x + ep.x) / 2, y: (startPos.y + ep.y) / 2, radiusX: rx, radiusY: ry, color, lineWidth }]);
        setSelId(id); setTool("select");
      }
    } else if (tool === "arrow") {
      if (Math.hypot(ep.x - startPos.x, ep.y - startPos.y) > 10) {
        setAnns((p) => [...p, { id, type: "arrow", x: startPos.x, y: startPos.y, endX: ep.x, endY: ep.y, color, lineWidth }]);
        setSelId(id); setTool("select");
      }
    } else if (tool === "rectangle") {
      let w = ep.x - startPos.x, h = ep.y - startPos.y;
      if (shiftHeld) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w) * s; h = Math.sign(h) * s; }
      if (Math.abs(w) > 5 || Math.abs(h) > 5) {
        setAnns((p) => [...p, { id, type: "rectangle", x: startPos.x, y: startPos.y, width: w, height: h, color, lineWidth }]);
        setSelId(id); setTool("select");
      }
    }
    setStartPos(null); setCurrentPos(null);
  };

  const addText = () => {
    if (!textInput.trim()) return;
    if (editingTextId) {
      setAnns((p) => p.map((a) => a.id === editingTextId ? { ...a, text: textInput } : a));
      setEditingTextId(null);
    } else if (textPos) {
      const id = Date.now().toString();
      setAnns((p) => [...p, { id, type: "text", x: textPos.x, y: textPos.y, text: textInput, color, lineWidth, fontSize, boxed: textBoxed, bgColor: textBgColor || undefined }]);
      setSelId(id); setTool("select");
    }
    setTextInput(""); setTextPos(null);
  };

  const updateSel = (patch: Partial<Annotation>) => {
    if (!selId) return;
    setAnns((p) => p.map((a) => a.id === selId ? { ...a, ...patch } : a));
  };

  const handleSave = () => {
    setSelId(null); setEditingTextId(null);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas && image) {
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        anns.forEach((a) => drawAnn(ctx, a, false));
        onAnnotationsChange(anns);
        onSave(canvas.toDataURL("image/png"));
        onClose();
      }
    }, 50);
  };

  const allTools: { id: Tool; label: string }[] = [
    { id: "select", label: "↖ 選択" }, { id: "circle", label: "⭕ 丸" },
    { id: "rectangle", label: "▢ 四角" }, { id: "arrow", label: "➡ 矢印" }, { id: "text", label: "T 文字" },
  ];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center justify-between px-1.5 py-1 bg-gray-900 gap-1">
        <div className="flex gap-0.5 flex-wrap items-center">
          {allTools.map((t) => (
            <button key={t.id} onClick={() => { setTool(t.id); if (t.id !== "select") setSelId(null); setEditingTextId(null); }}
              className={`px-2 py-1.5 rounded text-xs font-medium ${tool === t.id ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
              {t.label}
            </button>
          ))}
          <span className="w-px h-5 bg-gray-600 mx-1" />
          {COLORS.map((c) => (
            <button key={c.v} onClick={() => { setColor(c.v); if (selId) updateSel({ color: c.v }); }}
              className={`w-5 h-5 rounded-full border-2 ${color === c.v ? "border-white scale-110" : "border-gray-600"}`}
              style={{ backgroundColor: c.v }} title={c.l} />
          ))}
          <span className="w-px h-5 bg-gray-600 mx-1" />
          <input type="range" min={2} max={8} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-14 accent-blue-500" />
          <span className="text-gray-400 text-xs">{lineWidth}px</span>
        </div>
        <div className="flex gap-1">
          {selId && <button onClick={() => { setAnns((p) => p.filter((a) => a.id !== selId)); setSelId(null); }} className="px-2 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700">削除</button>}
          <button onClick={() => { setAnns((p) => p.slice(0, -1)); setSelId(null); }} className="px-2 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600">↩</button>
          <button onClick={handleSave} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">保存</button>
          <button onClick={onClose} className="px-2 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600">✕</button>
        </div>
      </div>

      {/* テキスト選択時のプロパティ（編集中でも表示） */}
      {sel?.type === "text" && tool === "select" && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-gray-800 border-t border-gray-700">
          {!editingTextId && (
            <button onClick={() => { setEditingTextId(selId!); setTextInput(sel.text || ""); }}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs">文字を編集</button>
          )}
          <span className="text-gray-400 text-xs">サイズ:</span>
          <input type="range" min={10} max={40} value={sel.fontSize || 18} onChange={(e) => updateSel({ fontSize: Number(e.target.value) })} className="w-16 accent-blue-500" />
          <span className="text-gray-300 text-xs">{sel.fontSize || 18}px</span>
          <span className="text-gray-400 text-xs">色:</span>
          {COLORS.map((c) => (
            <button key={c.v} onClick={() => { setColor(c.v); updateSel({ color: c.v }); }}
              className={`w-4 h-4 rounded-full border ${(sel.color || "#FF0000") === c.v ? "border-white" : "border-gray-600"}`}
              style={{ backgroundColor: c.v }} />
          ))}
          <button onClick={() => updateSel({ boxed: !sel.boxed })}
            className={`px-2 py-1 rounded text-xs ${sel.boxed ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"}`}>
            枠{sel.boxed ? "ON" : "OFF"}
          </button>
          <span className="text-gray-400 text-xs">背景:</span>
          {BG_COLORS.map((bg) => (
            <button key={bg.l} onClick={() => updateSel({ bgColor: bg.v || undefined })}
              className={`px-2 py-1 rounded text-xs border ${(sel.bgColor || "") === bg.v ? "border-blue-400 bg-gray-600 text-white" : "border-gray-600 text-gray-400"}`}>
              {bg.l}
            </button>
          ))}
        </div>
      )}

      {/* 丸・四角選択時のプロパティ */}
      {sel && (sel.type === "circle" || sel.type === "rectangle") && tool === "select" && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-gray-800 border-t border-gray-700">
          <span className="text-gray-400 text-xs">色:</span>
          {COLORS.map((c) => (
            <button key={c.v} onClick={() => { setColor(c.v); updateSel({ color: c.v }); }}
              className={`w-4 h-4 rounded-full border ${(sel.color || "#FF0000") === c.v ? "border-white" : "border-gray-600"}`}
              style={{ backgroundColor: c.v }} />
          ))}
          <span className="text-gray-400 text-xs">太さ:</span>
          <input type="range" min={1} max={8} value={sel.lineWidth || 3} onChange={(e) => { setLineWidth(Number(e.target.value)); updateSel({ lineWidth: Number(e.target.value) }); }} className="w-14 accent-blue-500" />
          <span className="text-gray-300 text-xs">{sel.lineWidth || 3}px</span>
        </div>
      )}

      {/* テキスト入力/編集ダイアログ */}
      {(textPos || editingTextId) && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 bg-white rounded-xl shadow-lg p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="テキストを入力..."
              className="px-3 py-2 border rounded-lg text-sm w-48" autoFocus onKeyDown={(e) => e.key === "Enter" && addText()} />
            <button onClick={addText} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">{editingTextId ? "更新" : "追加"}</button>
            <button onClick={() => { setTextPos(null); setEditingTextId(null); setTextInput(""); }} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">取消</button>
          </div>
          {!editingTextId && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">サイズ:</span>
              <input type="range" min={12} max={36} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-20 accent-blue-500" />
              <span className="text-xs">{fontSize}px</span>
              <button onClick={() => setTextBoxed(!textBoxed)} className={`px-2 py-0.5 rounded text-xs ${textBoxed ? "bg-blue-600 text-white" : "bg-gray-200"}`}>枠{textBoxed ? "ON" : "OFF"}</button>
              <span className="text-xs text-gray-500">背景:</span>
              {BG_COLORS.map((bg) => (
                <button key={bg.l} onClick={() => setTextBgColor(bg.v)}
                  className={`px-1.5 py-0.5 rounded text-xs border ${textBgColor === bg.v ? "border-blue-400 bg-blue-50" : "border-gray-300"}`}>
                  {bg.l}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto">
        {cvs.width > 0 && (
          <canvas ref={canvasRef} width={cvs.width} height={cvs.height}
            className={`touch-none ${tool === "select" ? "cursor-default" : "cursor-crosshair"}`}
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd}
            onDoubleClick={handleDblClick}
            onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} />
        )}
      </div>
    </div>
  );
}
