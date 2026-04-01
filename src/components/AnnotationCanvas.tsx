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

type Tool = "circle" | "arrow" | "text" | "rectangle";

const COLOR_PALETTE = [
  { value: "#FF0000", label: "赤" },
  { value: "#0000FF", label: "青" },
  { value: "#00AA00", label: "緑" },
  { value: "#FFcc00", label: "黄" },
  { value: "#000000", label: "黒" },
];

export default function AnnotationCanvas({
  imageUrl,
  annotations,
  onAnnotationsChange,
  onSave,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("circle");
  const [isDrawing, setIsDrawing] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>(annotations);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState("#FF0000");

  // Shiftキー検知
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftHeld(true); };
    const up = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftHeld(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // 画像読み込み — 画面いっぱいに使う
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      const container = containerRef.current;
      if (container) {
        const maxW = container.clientWidth - 16;
        const maxH = container.clientHeight - 16;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        setCanvasSize({
          width: Math.floor(img.width * scale),
          height: Math.floor(img.height * scale),
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // 描画関数
  const drawAnnotation = useCallback((ctx: CanvasRenderingContext2D, ann: Annotation) => {
    const c = ann.color || "#FF0000";
    const lw = ann.lineWidth || 3;
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineWidth = lw;

    if (ann.type === "circle" && ann.radiusX !== undefined && ann.radiusY !== undefined) {
      ctx.beginPath();
      ctx.ellipse(ann.x, ann.y, ann.radiusX, ann.radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ann.type === "arrow" && ann.endX !== undefined && ann.endY !== undefined) {
      const headLen = 12 + lw * 2;
      const angle = Math.atan2(ann.endY - ann.y, ann.endX - ann.x);
      ctx.beginPath();
      ctx.moveTo(ann.x, ann.y);
      ctx.lineTo(ann.endX, ann.endY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ann.endX, ann.endY);
      ctx.lineTo(ann.endX - headLen * Math.cos(angle - Math.PI / 6), ann.endY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(ann.endX, ann.endY);
      ctx.lineTo(ann.endX - headLen * Math.cos(angle + Math.PI / 6), ann.endY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (ann.type === "rectangle" && ann.width !== undefined && ann.height !== undefined) {
      ctx.beginPath();
      ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
    } else if (ann.type === "text" && ann.text) {
      ctx.font = `bold ${16 + (lw - 3) * 2}px sans-serif`;
      ctx.fillText(ann.text, ann.x, ann.y);
    }
  }, []);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    localAnnotations.forEach((ann) => drawAnnotation(ctx, ann));

    // ドラッグ中のプレビュー
    if (isDrawing && startPos && currentPos) {
      ctx.setLineDash([6, 3]);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === "circle") {
        const cx = (startPos.x + currentPos.x) / 2;
        const cy = (startPos.y + currentPos.y) / 2;
        let rx = Math.abs(currentPos.x - startPos.x) / 2;
        let ry = Math.abs(currentPos.y - startPos.y) / 2;
        if (shiftHeld) { const r = Math.max(rx, ry); rx = r; ry = r; }
        if (rx > 2 || ry > 2) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (tool === "arrow") {
        const headLen = 12 + lineWidth * 2;
        const angle = Math.atan2(currentPos.y - startPos.y, currentPos.x - startPos.x);
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(currentPos.x - headLen * Math.cos(angle - Math.PI / 6), currentPos.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(currentPos.x - headLen * Math.cos(angle + Math.PI / 6), currentPos.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (tool === "rectangle") {
        let w = currentPos.x - startPos.x;
        let h = currentPos.y - startPos.y;
        if (shiftHeld) {
          const side = Math.max(Math.abs(w), Math.abs(h));
          w = Math.sign(w) * side;
          h = Math.sign(h) * side;
        }
        ctx.beginPath();
        ctx.strokeRect(startPos.x, startPos.y, w, h);
      }
      ctx.setLineDash([]);
    }
  }, [image, localAnnotations, isDrawing, startPos, currentPos, tool, color, lineWidth, shiftHeld, drawAnnotation]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches.length > 0 ? e.touches[0] : e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === "text") {
      setTextPos(getCanvasPos(e));
      return;
    }
    const pos = getCanvasPos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setCurrentPos(getCanvasPos(e));
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos) return;
    setIsDrawing(false);

    const endPos = getCanvasPos(e);
    const id = Date.now().toString();

    if (tool === "circle") {
      let rx = Math.abs(endPos.x - startPos.x) / 2;
      let ry = Math.abs(endPos.y - startPos.y) / 2;
      if (shiftHeld) { const r = Math.max(rx, ry); rx = r; ry = r; }
      const cx = (startPos.x + endPos.x) / 2;
      const cy = (startPos.y + endPos.y) / 2;
      if (rx > 3 || ry > 3) {
        setLocalAnnotations((prev) => [
          ...prev,
          { id, type: "circle", x: cx, y: cy, radiusX: rx, radiusY: ry, color, lineWidth },
        ]);
      }
    } else if (tool === "arrow") {
      const dist = Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y);
      if (dist > 10) {
        setLocalAnnotations((prev) => [
          ...prev,
          { id, type: "arrow", x: startPos.x, y: startPos.y, endX: endPos.x, endY: endPos.y, color, lineWidth },
        ]);
      }
    } else if (tool === "rectangle") {
      let w = endPos.x - startPos.x;
      let h = endPos.y - startPos.y;
      if (shiftHeld) {
        const side = Math.max(Math.abs(w), Math.abs(h));
        w = Math.sign(w) * side;
        h = Math.sign(h) * side;
      }
      if (Math.abs(w) > 5 || Math.abs(h) > 5) {
        setLocalAnnotations((prev) => [
          ...prev,
          { id, type: "rectangle", x: startPos.x, y: startPos.y, width: w, height: h, color, lineWidth },
        ]);
      }
    }
    setStartPos(null);
    setCurrentPos(null);
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && textPos) {
      setLocalAnnotations((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "text", x: textPos.x, y: textPos.y, text: textInput, color, lineWidth },
      ]);
      setTextInput("");
      setTextPos(null);
    }
  };

  const handleUndo = () => {
    setLocalAnnotations((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onAnnotationsChange(localAnnotations);
      onSave(canvas.toDataURL("image/png"));
      onClose();
    }
  };

  const tools_list: { id: Tool; label: string; icon: string }[] = [
    { id: "circle", label: "丸", icon: "⭕" },
    { id: "rectangle", label: "四角", icon: "▢" },
    { id: "arrow", label: "矢印", icon: "➡️" },
    { id: "text", label: "テキスト", icon: "T" },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center justify-between px-2 sm:px-4 py-2 bg-gray-900 gap-2">
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          {tools_list.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tool === t.id ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button onClick={handleUndo} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600">
            ↩ 戻す
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            保存
          </button>
          <button onClick={onClose} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600">
            ✕
          </button>
        </div>
      </div>

      {/* サブツールバー: 色 + 太さ + ヒント */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-2 sm:px-4 py-1.5 bg-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-xs">色:</span>
          {COLOR_PALETTE.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                color === c.value ? "border-white scale-110" : "border-gray-600"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">太さ:</span>
          <input type="range" min={2} max={8} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-20 accent-blue-500" />
          <span className="text-gray-300 text-xs w-6">{lineWidth}px</span>
        </div>
        <span className="text-gray-500 text-xs hidden sm:inline">
          {tool === "circle" ? "ドラッグで楕円 / Shift+ドラッグで正円" :
           tool === "rectangle" ? "ドラッグで長方形 / Shift+ドラッグで正方形" :
           tool === "arrow" ? "ドラッグで矢印を描画" :
           "クリックした場所にテキスト追加"}
        </span>
      </div>

      {textPos && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 bg-white rounded-xl shadow-lg p-3 flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="テキストを入力..."
            className="px-3 py-2 border rounded-lg text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
          />
          <button onClick={handleTextSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            追加
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-auto p-1 sm:p-2"
      >
        {canvasSize.width > 0 && (
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="cursor-crosshair touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        )}
      </div>
    </div>
  );
}
