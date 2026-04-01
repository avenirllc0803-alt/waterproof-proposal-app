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
type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "start" | "end" | "move" | "none";

const COLORS = [
  { v: "#FF0000", l: "赤" }, { v: "#0000FF", l: "青" }, { v: "#00AA00", l: "緑" },
  { v: "#FFcc00", l: "黄" }, { v: "#000000", l: "黒" }, { v: "#FF6600", l: "橙" },
];
const BG_COLORS = [
  { v: "", l: "なし" }, { v: "rgba(255,255,255,0.85)", l: "白" },
  { v: "rgba(255,255,200,0.85)", l: "黄" }, { v: "rgba(200,230,255,0.85)", l: "青" },
];
const HS = 7;

function getBBox(a: Annotation) {
  if (a.type === "circle") {
    const rx = Math.abs(a.radiusX || 0), ry = Math.abs(a.radiusY || 0);
    return { x1: a.x - rx, y1: a.y - ry, x2: a.x + rx, y2: a.y + ry };
  }
  if (a.type === "rectangle") {
    return { x1: Math.min(a.x, a.x + (a.width || 0)), y1: Math.min(a.y, a.y + (a.height || 0)), x2: Math.max(a.x, a.x + (a.width || 0)), y2: Math.max(a.y, a.y + (a.height || 0)) };
  }
  if (a.type === "arrow") {
    return { x1: Math.min(a.x, a.endX || a.x), y1: Math.min(a.y, a.endY || a.y), x2: Math.max(a.x, a.endX || a.x), y2: Math.max(a.y, a.endY || a.y) };
  }
  return { x1: a.x, y1: a.y, x2: a.x + 100, y2: a.y + 30 };
}

function hitShape(a: Annotation, x: number, y: number): boolean {
  if (a.type === "text") return false; // テキストはHTML要素なのでCanvas hitTest不要
  const bb = getBBox(a);
  const pad = 12;
  if (a.type === "circle") {
    const rx = Math.abs(a.radiusX || 1), ry = Math.abs(a.radiusY || 1);
    const d = Math.sqrt(((x - a.x) / rx) ** 2 + ((y - a.y) / ry) ** 2);
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

function getHandles(a: Annotation): { type: HandleType; x: number; y: number }[] {
  if (a.type === "text") return [];
  if (a.type === "arrow") return [{ type: "start", x: a.x, y: a.y }, { type: "end", x: a.endX || a.x, y: a.endY || a.y }];
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
  for (const h of getHandles(a)) { if (Math.hypot(x - h.x, y - h.y) < HS + 5) return h.type; }
  return "none";
}

// テキスト注釈のHTMLオーバーレイコンポーネント
function TextOverlay({ ann, isSelected, onSelect, onUpdate }: {
  ann: Annotation; isSelected: boolean;
  onSelect: () => void; onUpdate: (patch: Partial<Annotation>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(ann.text || "");
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; annX: number; annY: number } | null>(null);
  const fs = ann.fontSize || 18;

  useEffect(() => { setText(ann.text || ""); }, [ann.text]);

  const finishEdit = () => {
    setEditing(false);
    if (text.trim()) onUpdate({ text });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editing) return;
    onSelect();
    dragStart.current = { x: e.clientX, y: e.clientY, annX: ann.x, annY: ann.y };
    setDragging(true);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      onUpdate({ x: dragStart.current.annX + dx, y: dragStart.current.annY + dy });
    };
    const handleMouseUp = () => {
      setDragging(false);
      dragStart.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // 枠線: boxedの時だけ表示。選択時は青枠。両方同時にはしない。
  const borderStyle = isSelected
    ? "2px solid #0088ff"
    : ann.boxed ? `2px solid ${ann.color || "#FF0000"}` : "1px dashed transparent";

  return (
    <div
      style={{
        position: "absolute", left: ann.x, top: ann.y, minWidth: 40,
        cursor: editing ? "text" : dragging ? "grabbing" : "grab",
        border: borderStyle,
        backgroundColor: ann.bgColor || "transparent",
        padding: 4, borderRadius: 3, zIndex: editing ? 20 : 10,
      }}
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
      onMouseDown={handleMouseDown}
    >
      {editing ? (
        <input
          type="text" value={text} onChange={(e) => setText(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={(e) => { if (e.key === "Enter") finishEdit(); }}
          autoFocus
          style={{ fontSize: fs, fontWeight: "bold", color: ann.color || "#FF0000",
            border: "none", outline: "2px solid #0088ff", background: "rgba(255,255,255,0.9)",
            padding: "2px 4px", minWidth: 60, borderRadius: 3,
          }}
        />
      ) : (
        <span style={{ fontSize: fs, fontWeight: "bold", color: ann.color || "#FF0000", whiteSpace: "nowrap", userSelect: "none" }}>
          {ann.text || "(ダブルクリックで入力)"}
        </span>
      )}
    </div>
  );
}

export default function AnnotationCanvas({ imageUrl, annotations, onAnnotationsChange, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [handle, setHandle] = useState<HandleType>("none");
  const [shiftHeld, setShiftHeld] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [anns, setAnns] = useState<Annotation[]>(annotations);
  const [selId, setSelId] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cvs, setCvs] = useState({ width: 0, height: 0 });
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState("#FF0000");
  const [fontSize, setFontSize] = useState(18);
  const [zoom, setZoom] = useState(100);
  const baseScale = useRef(1);

  const sel = anns.find((a) => a.id === selId);
  const textAnns = anns.filter((a) => a.type === "text");
  const shapeAnns = anns.filter((a) => a.type !== "text");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(true);
      if ((e.key === "Delete" || e.key === "Backspace") && selId) {
        const s = anns.find((a) => a.id === selId);
        if (s && s.type !== "text") { setAnns((p) => p.filter((a) => a.id !== selId)); setSelId(null); }
      }
    };
    const up = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftHeld(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [selId, anns]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      const c = containerRef.current;
      if (c) {
        const scale = Math.min((c.clientWidth - 4) / img.width, (c.clientHeight - 4) / img.height);
        baseScale.current = scale;
        setCvs({ width: Math.floor(img.width * scale), height: Math.floor(img.height * scale) });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!image) return;
    const scale = baseScale.current * (zoom / 100);
    setCvs({ width: Math.floor(image.width * scale), height: Math.floor(image.height * scale) });
  }, [zoom, image]);

  // Canvas描画（図形のみ。テキストはHTML）
  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    shapeAnns.forEach((a) => {
      const c = a.color || "#FF0000";
      const lw = a.lineWidth || 3;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = lw;
      const isSel = a.id === selId;

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
      }

      if (isSel) {
        const handles = getHandles(a);
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
    });

    // 描画プレビュー
    if (handle === "none" && startPos && currentPos && tool !== "select" && tool !== "text") {
      ctx.setLineDash([6, 3]); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
      if (tool === "circle") {
        let rx = Math.abs(currentPos.x - startPos.x) / 2, ry = Math.abs(currentPos.y - startPos.y) / 2;
        if (shiftHeld) { const r = Math.max(rx, ry); rx = r; ry = r; }
        if (rx > 2 || ry > 2) { ctx.beginPath(); ctx.ellipse((startPos.x + currentPos.x) / 2, (startPos.y + currentPos.y) / 2, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
      } else if (tool === "arrow") {
        ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(currentPos.x, currentPos.y); ctx.stroke();
      } else if (tool === "rectangle") {
        let w = currentPos.x - startPos.x, h = currentPos.y - startPos.y;
        if (shiftHeld) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w) * s; h = Math.sign(h) * s; }
        ctx.strokeRect(startPos.x, startPos.y, w, h);
      }
      ctx.setLineDash([]);
    }
  }, [image, shapeAnns, selId, handle, startPos, currentPos, tool, color, lineWidth, shiftHeld]);

  useEffect(() => { drawAll(); }, [drawAll]);

  const getPos = (e: React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleCanvasDown = (e: React.MouseEvent) => {
    const p = getPos(e);
    if (tool === "text") {
      // テキスト追加
      const id = Date.now().toString();
      setAnns((prev) => [...prev, { id, type: "text", x: p.x, y: p.y, text: "", color, fontSize, boxed: false }]);
      setSelId(id);
      setTool("select");
      return;
    }
    if (tool === "select") {
      if (sel) {
        const h = hitHandle(sel, p.x, p.y);
        if (h !== "none") { setHandle(h); setStartPos(p); setCurrentPos(p); return; }
      }
      for (let i = shapeAnns.length - 1; i >= 0; i--) {
        if (hitShape(shapeAnns[i], p.x, p.y)) {
          setSelId(shapeAnns[i].id); setHandle("move"); setStartPos(p); setCurrentPos(p); return;
        }
      }
      setSelId(null); return;
    }
    for (let i = shapeAnns.length - 1; i >= 0; i--) {
      if (hitShape(shapeAnns[i], p.x, p.y)) {
        setSelId(shapeAnns[i].id); setTool("select"); return;
      }
    }
    setStartPos(p); setCurrentPos(p); setHandle("none"); setSelId(null);
  };

  const handleCanvasMove = (e: React.MouseEvent) => {
    const p = getPos(e);
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
      setAnns((prev) => prev.map((a) => a.id === selId ? (handle === "start" ? { ...a, x: p.x, y: p.y } : { ...a, endX: p.x, endY: p.y }) : a));
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
        if (a.type === "circle") return { ...a, x: (x1 + x2) / 2, y: (y1 + y2) / 2, radiusX: Math.abs(x2 - x1) / 2, radiusY: Math.abs(y2 - y1) / 2 };
        if (a.type === "rectangle") return { ...a, x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
        return a;
      }));
    }
  };

  const handleCanvasUp = (e: React.MouseEvent) => {
    if (handle !== "none") { setHandle("none"); setStartPos(null); setCurrentPos(null); return; }
    if (!startPos || !currentPos) { setStartPos(null); setCurrentPos(null); return; }
    const ep = getPos(e);
    const id = Date.now().toString();

    if (tool === "circle") {
      let rx = Math.abs(ep.x - startPos.x) / 2, ry = Math.abs(ep.y - startPos.y) / 2;
      if (shiftHeld) { const r = Math.max(rx, ry); rx = r; ry = r; }
      if (rx > 3 || ry > 3) { setAnns((p) => [...p, { id, type: "circle", x: (startPos.x + ep.x) / 2, y: (startPos.y + ep.y) / 2, radiusX: rx, radiusY: ry, color, lineWidth }]); setSelId(id); setTool("select"); }
    } else if (tool === "arrow") {
      if (Math.hypot(ep.x - startPos.x, ep.y - startPos.y) > 10) { setAnns((p) => [...p, { id, type: "arrow", x: startPos.x, y: startPos.y, endX: ep.x, endY: ep.y, color, lineWidth }]); setSelId(id); setTool("select"); }
    } else if (tool === "rectangle") {
      let w = ep.x - startPos.x, h = ep.y - startPos.y;
      if (shiftHeld) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w) * s; h = Math.sign(h) * s; }
      if (Math.abs(w) > 5 || Math.abs(h) > 5) { setAnns((p) => [...p, { id, type: "rectangle", x: Math.min(startPos.x, ep.x), y: Math.min(startPos.y, ep.y), width: Math.abs(w), height: Math.abs(h), color, lineWidth }]); setSelId(id); setTool("select"); }
    }
    setStartPos(null); setCurrentPos(null);
  };

  const updateSel = (patch: Partial<Annotation>) => {
    if (!selId) return;
    setAnns((p) => p.map((a) => a.id === selId ? { ...a, ...patch } : a));
  };

  const handleSave = () => {
    // テキストをCanvasに描画してから保存
    setSelId(null);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      // 図形描画
      shapeAnns.forEach((a) => {
        const c = a.color || "#FF0000";
        const lw = a.lineWidth || 3;
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = lw;
        if (a.type === "circle" && a.radiusX !== undefined && a.radiusY !== undefined) {
          ctx.beginPath(); ctx.ellipse(a.x, a.y, Math.abs(a.radiusX), Math.abs(a.radiusY), 0, 0, Math.PI * 2); ctx.stroke();
        } else if (a.type === "arrow" && a.endX !== undefined && a.endY !== undefined) {
          const hl = 12 + lw * 2; const ang = Math.atan2(a.endY - a.y, a.endX - a.x);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.endX, a.endY); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(a.endX, a.endY);
          ctx.lineTo(a.endX - hl * Math.cos(ang - Math.PI / 6), a.endY - hl * Math.sin(ang - Math.PI / 6));
          ctx.moveTo(a.endX, a.endY);
          ctx.lineTo(a.endX - hl * Math.cos(ang + Math.PI / 6), a.endY - hl * Math.sin(ang + Math.PI / 6));
          ctx.stroke();
        } else if (a.type === "rectangle" && a.width !== undefined && a.height !== undefined) {
          ctx.strokeRect(a.x, a.y, a.width, a.height);
        }
      });
      // テキスト描画（保存時のみCanvasに描画）
      textAnns.forEach((a) => {
        if (!a.text) return;
        const fs = a.fontSize || 18;
        ctx.font = `bold ${fs}px sans-serif`;
        ctx.textBaseline = "top";
        const m = ctx.measureText(a.text);
        const pad = 5;
        if (a.bgColor) { ctx.fillStyle = a.bgColor; ctx.fillRect(a.x - pad, a.y - pad, m.width + pad * 2, fs + pad * 2); }
        if (a.boxed) { ctx.strokeStyle = a.color || "#FF0000"; ctx.lineWidth = 1.5; ctx.strokeRect(a.x - pad, a.y - pad, m.width + pad * 2, fs + pad * 2); }
        ctx.fillStyle = a.color || "#FF0000";
        ctx.fillText(a.text, a.x, a.y);
        ctx.textBaseline = "alphabetic";
      });
      onAnnotationsChange(anns);
      onSave(canvas.toDataURL("image/png"));
      onClose();
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
            <button key={t.id} onClick={() => { setTool(t.id); if (t.id !== "select") setSelId(null); }}
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
          <span className="text-gray-400 text-xs">画像:</span>
          <input type="range" min={50} max={200} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-16 accent-green-500" />
          <span className="text-green-400 text-xs">{zoom}%</span>
        </div>
        <div className="flex gap-1">
          {selId && <button onClick={() => { setAnns((p) => p.filter((a) => a.id !== selId)); setSelId(null); }} className="px-2 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700">削除</button>}
          <button onClick={() => { setAnns((p) => p.slice(0, -1)); setSelId(null); }} className="px-2 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600">↩</button>
          <button onClick={handleSave} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">保存</button>
          <button onClick={onClose} className="px-2 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600">✕</button>
        </div>
      </div>

      {/* テキスト選択時: 文字サイズスライダー */}
      {sel?.type === "text" && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 bg-gray-800 border-t border-gray-700">
          <span className="text-gray-300 text-sm font-bold">文字サイズ:</span>
          <input type="range" min={10} max={60} value={sel.fontSize || 18} onChange={(e) => updateSel({ fontSize: Number(e.target.value) })} className="w-32 accent-blue-500" />
          <span className="text-white text-sm font-bold">{sel.fontSize || 18}px</span>
        </div>
      )}

      {/* 丸・四角・矢印選択時プロパティ */}
      {sel && (sel.type === "circle" || sel.type === "rectangle" || sel.type === "arrow") && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-gray-800 border-t border-gray-700">
          <span className="text-gray-400 text-xs">色:</span>
          {COLORS.map((c) => (
            <button key={c.v} onClick={() => updateSel({ color: c.v })}
              className={`w-4 h-4 rounded-full border ${(sel.color || "#FF0000") === c.v ? "border-white" : "border-gray-600"}`}
              style={{ backgroundColor: c.v }} />
          ))}
          <span className="text-gray-400 text-xs">太さ:</span>
          <input type="range" min={1} max={8} value={sel.lineWidth || 3} onChange={(e) => updateSel({ lineWidth: Number(e.target.value) })} className="w-14 accent-blue-500" />
          <span className="text-gray-300 text-xs">{sel.lineWidth || 3}px</span>
        </div>
      )}

      {/* ヒント */}
      <div className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs text-center hidden sm:block">
        {tool === "select" ? "図形をクリックで選択・移動。テキストはダブルクリックで編集。" :
         tool === "text" ? "クリックした場所にテキストを追加。ダブルクリックで編集。" :
         "ドラッグで図形を描く。Shiftで正円/正方形。"}
      </div>

      {/* キャンバス + テキストオーバーレイ */}
      <div ref={containerRef} className="flex-1 overflow-auto flex items-start justify-center p-2">
        <div ref={wrapperRef} style={{ position: "relative", width: cvs.width, height: cvs.height, flexShrink: 0 }}>
          <canvas ref={canvasRef} width={cvs.width} height={cvs.height}
            className={`touch-none ${tool === "select" ? "cursor-default" : "cursor-crosshair"}`}
            style={{ position: "absolute", top: 0, left: 0 }}
            onMouseDown={handleCanvasDown} onMouseMove={handleCanvasMove} onMouseUp={handleCanvasUp} />
          {/* テキスト注釈はHTML要素で表示 */}
          {textAnns.map((a) => (
            <TextOverlay key={a.id} ann={a} isSelected={a.id === selId}
              onSelect={() => { setSelId(a.id); setTool("select"); }}
              onUpdate={(patch) => setAnns((p) => p.map((x) => x.id === a.id ? { ...x, ...patch } : x))} />
          ))}
        </div>
      </div>
    </div>
  );
}
