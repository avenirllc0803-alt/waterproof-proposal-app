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
type DragMode = "none" | "draw" | "move" | "resize-br" | "resize-start" | "resize-end";

const COLOR_PALETTE = [
  { value: "#FF0000", label: "赤" },
  { value: "#0000FF", label: "青" },
  { value: "#00AA00", label: "緑" },
  { value: "#FFcc00", label: "黄" },
  { value: "#000000", label: "黒" },
];

const HANDLE_SIZE = 8;

function hitTest(ann: Annotation, x: number, y: number, threshold: number = 12): boolean {
  if (ann.type === "circle" && ann.radiusX !== undefined && ann.radiusY !== undefined) {
    const dx = (x - ann.x) / ann.radiusX;
    const dy = (y - ann.y) / ann.radiusY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Math.abs(dist - 1) < threshold / Math.max(ann.radiusX, ann.radiusY, 1);
  }
  if (ann.type === "rectangle" && ann.width !== undefined && ann.height !== undefined) {
    const r = threshold;
    const x1 = Math.min(ann.x, ann.x + ann.width);
    const y1 = Math.min(ann.y, ann.y + ann.height);
    const x2 = Math.max(ann.x, ann.x + ann.width);
    const y2 = Math.max(ann.y, ann.y + ann.height);
    const nearLeft = Math.abs(x - x1) < r && y >= y1 - r && y <= y2 + r;
    const nearRight = Math.abs(x - x2) < r && y >= y1 - r && y <= y2 + r;
    const nearTop = Math.abs(y - y1) < r && x >= x1 - r && x <= x2 + r;
    const nearBottom = Math.abs(y - y2) < r && x >= x1 - r && x <= x2 + r;
    return nearLeft || nearRight || nearTop || nearBottom || (x >= x1 && x <= x2 && y >= y1 && y <= y2);
  }
  if (ann.type === "arrow" && ann.endX !== undefined && ann.endY !== undefined) {
    const dx = ann.endX - ann.x;
    const dy = ann.endY - ann.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return false;
    const t = Math.max(0, Math.min(1, ((x - ann.x) * dx + (y - ann.y) * dy) / (len * len)));
    const px = ann.x + t * dx;
    const py = ann.y + t * dy;
    return Math.hypot(x - px, y - py) < threshold;
  }
  if (ann.type === "text") {
    return x >= ann.x - 5 && x <= ann.x + 200 && y >= ann.y - 25 && y <= ann.y + 10;
  }
  return false;
}

function getResizeHandle(ann: Annotation, x: number, y: number): DragMode {
  const hs = HANDLE_SIZE + 4;
  if (ann.type === "circle" && ann.radiusX !== undefined && ann.radiusY !== undefined) {
    const hx = ann.x + ann.radiusX;
    const hy = ann.y + ann.radiusY;
    if (Math.hypot(x - hx, y - hy) < hs) return "resize-br";
  }
  if (ann.type === "rectangle" && ann.width !== undefined && ann.height !== undefined) {
    const hx = ann.x + ann.width;
    const hy = ann.y + ann.height;
    if (Math.hypot(x - hx, y - hy) < hs) return "resize-br";
  }
  if (ann.type === "arrow" && ann.endX !== undefined && ann.endY !== undefined) {
    if (Math.hypot(x - ann.x, y - ann.y) < hs) return "resize-start";
    if (Math.hypot(x - ann.endX, y - ann.endY) < hs) return "resize-end";
  }
  return "none";
}

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
  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [shiftHeld, setShiftHeld] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>(annotations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [textBoxed, setTextBoxed] = useState(true);
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState("#FF0000");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(true);
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !textPos) {
        setLocalAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
        setSelectedId(null);
      }
    };
    const up = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftHeld(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [selectedId, textPos]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      const container = containerRef.current;
      if (container) {
        const maxW = container.clientWidth - 8;
        const maxH = container.clientHeight - 8;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        setCanvasSize({ width: Math.floor(img.width * scale), height: Math.floor(img.height * scale) });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawAnnotation = useCallback((ctx: CanvasRenderingContext2D, ann: Annotation, isSelected: boolean) => {
    const c = ann.color || "#FF0000";
    const lw = ann.lineWidth || 3;
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineWidth = lw;

    if (ann.type === "circle" && ann.radiusX !== undefined && ann.radiusY !== undefined) {
      ctx.beginPath();
      ctx.ellipse(ann.x, ann.y, Math.abs(ann.radiusX), Math.abs(ann.radiusY), 0, 0, Math.PI * 2);
      ctx.stroke();
      if (isSelected) {
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#0088ff";
        ctx.lineWidth = 2;
        const hx = ann.x + ann.radiusX;
        const hy = ann.y + ann.radiusY;
        ctx.beginPath(); ctx.arc(hx, hy, HANDLE_SIZE, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
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
      if (isSelected) {
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#0088ff";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ann.x, ann.y, HANDLE_SIZE, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(ann.endX, ann.endY, HANDLE_SIZE, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    } else if (ann.type === "rectangle" && ann.width !== undefined && ann.height !== undefined) {
      ctx.beginPath();
      ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
      if (isSelected) {
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#0088ff";
        ctx.lineWidth = 2;
        const hx = ann.x + ann.width;
        const hy = ann.y + ann.height;
        ctx.beginPath(); ctx.arc(hx, hy, HANDLE_SIZE, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    } else if (ann.type === "text" && ann.text) {
      const fontSize = 16 + ((ann.lineWidth || 3) - 3) * 2;
      ctx.font = `bold ${fontSize}px sans-serif`;
      const measured = ctx.measureText(ann.text);
      const boxed = ann.width === 1;
      if (boxed) {
        const pad = 6;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(ann.x - pad, ann.y - fontSize - pad, measured.width + pad * 2, fontSize + pad * 2);
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ann.x - pad, ann.y - fontSize - pad, measured.width + pad * 2, fontSize + pad * 2);
      }
      ctx.fillStyle = c;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillText(ann.text, ann.x, ann.y);
      if (isSelected) {
        ctx.strokeStyle = "#0088ff";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(ann.x - 4, ann.y - fontSize - 4, measured.width + 8, fontSize + 12);
        ctx.setLineDash([]);
      }
    }

    if (isSelected && (ann.type === "circle" || ann.type === "rectangle" || ann.type === "arrow")) {
      ctx.strokeStyle = "#0088ff";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      if (ann.type === "circle" && ann.radiusX !== undefined && ann.radiusY !== undefined) {
        ctx.strokeRect(ann.x - Math.abs(ann.radiusX), ann.y - Math.abs(ann.radiusY), Math.abs(ann.radiusX) * 2, Math.abs(ann.radiusY) * 2);
      }
      ctx.setLineDash([]);
    }
  }, []);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    localAnnotations.forEach((ann) => drawAnnotation(ctx, ann, ann.id === selectedId));

    if (dragMode === "draw" && startPos && currentPos) {
      ctx.setLineDash([6, 3]);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (tool === "circle") {
        const cx = (startPos.x + currentPos.x) / 2;
        const cy = (startPos.y + currentPos.y) / 2;
        let rx = Math.abs(currentPos.x - startPos.x) / 2;
        let ry = Math.abs(currentPos.y - startPos.y) / 2;
        if (shiftHeld) { const r = Math.max(rx, ry); rx = r; ry = r; }
        if (rx > 2 || ry > 2) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
      } else if (tool === "arrow") {
        const headLen = 12 + lineWidth * 2;
        const angle = Math.atan2(currentPos.y - startPos.y, currentPos.x - startPos.x);
        ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(currentPos.x, currentPos.y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(currentPos.x - headLen * Math.cos(angle - Math.PI / 6), currentPos.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(currentPos.x - headLen * Math.cos(angle + Math.PI / 6), currentPos.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (tool === "rectangle") {
        let w = currentPos.x - startPos.x;
        let h = currentPos.y - startPos.y;
        if (shiftHeld) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w) * s; h = Math.sign(h) * s; }
        ctx.beginPath(); ctx.strokeRect(startPos.x, startPos.y, w, h);
      }
      ctx.setLineDash([]);
    }
  }, [image, localAnnotations, selectedId, dragMode, startPos, currentPos, tool, color, lineWidth, shiftHeld, drawAnnotation]);

  useEffect(() => { drawAll(); }, [drawAll]);

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
    const pos = getCanvasPos(e);

    if (tool === "text") {
      setTextPos(pos);
      return;
    }

    if (tool === "select") {
      if (selectedId) {
        const sel = localAnnotations.find((a) => a.id === selectedId);
        if (sel) {
          const handleMode = getResizeHandle(sel, pos.x, pos.y);
          if (handleMode !== "none") {
            setDragMode(handleMode);
            setStartPos(pos);
            setCurrentPos(pos);
            return;
          }
        }
      }
      for (let i = localAnnotations.length - 1; i >= 0; i--) {
        if (hitTest(localAnnotations[i], pos.x, pos.y)) {
          setSelectedId(localAnnotations[i].id);
          setDragMode("move");
          setDragOffset({ x: pos.x - localAnnotations[i].x, y: pos.y - localAnnotations[i].y });
          setStartPos(pos);
          setCurrentPos(pos);
          return;
        }
      }
      setSelectedId(null);
      return;
    }

    setDragMode("draw");
    setStartPos(pos);
    setCurrentPos(pos);
    setSelectedId(null);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragMode === "none") return;
    const pos = getCanvasPos(e);
    setCurrentPos(pos);

    if (dragMode === "move" && selectedId && startPos) {
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;
      setLocalAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId) return a;
          const updated = { ...a, x: a.x + dx, y: a.y + dy };
          if (a.endX !== undefined && a.endY !== undefined) {
            updated.endX = a.endX + dx;
            updated.endY = a.endY + dy;
          }
          return updated;
        })
      );
      setStartPos(pos);
    }

    if (dragMode === "resize-br" && selectedId) {
      setLocalAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId) return a;
          if (a.type === "circle") {
            let rx = pos.x - a.x;
            let ry = pos.y - a.y;
            if (shiftHeld) { const r = Math.max(Math.abs(rx), Math.abs(ry)); rx = Math.sign(rx) * r; ry = Math.sign(ry) * r; }
            return { ...a, radiusX: Math.max(5, Math.abs(rx)), radiusY: Math.max(5, Math.abs(ry)) };
          }
          if (a.type === "rectangle") {
            let w = pos.x - a.x;
            let h = pos.y - a.y;
            if (shiftHeld) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w) * s; h = Math.sign(h) * s; }
            return { ...a, width: w, height: h };
          }
          return a;
        })
      );
    }

    if (dragMode === "resize-start" && selectedId) {
      setLocalAnnotations((prev) =>
        prev.map((a) => a.id === selectedId ? { ...a, x: pos.x, y: pos.y } : a)
      );
    }

    if (dragMode === "resize-end" && selectedId) {
      setLocalAnnotations((prev) =>
        prev.map((a) => a.id === selectedId ? { ...a, endX: pos.x, endY: pos.y } : a)
      );
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragMode === "draw" && startPos && currentPos) {
      const endPos = getCanvasPos(e);
      const id = Date.now().toString();

      if (tool === "circle") {
        let rx = Math.abs(endPos.x - startPos.x) / 2;
        let ry = Math.abs(endPos.y - startPos.y) / 2;
        if (shiftHeld) { const r = Math.max(rx, ry); rx = r; ry = r; }
        const cx = (startPos.x + endPos.x) / 2;
        const cy = (startPos.y + endPos.y) / 2;
        if (rx > 3 || ry > 3) {
          setLocalAnnotations((prev) => [...prev, { id, type: "circle", x: cx, y: cy, radiusX: rx, radiusY: ry, color, lineWidth }]);
          setSelectedId(id);
          setTool("select");
        }
      } else if (tool === "arrow") {
        if (Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y) > 10) {
          setLocalAnnotations((prev) => [...prev, { id, type: "arrow", x: startPos.x, y: startPos.y, endX: endPos.x, endY: endPos.y, color, lineWidth }]);
          setSelectedId(id);
          setTool("select");
        }
      } else if (tool === "rectangle") {
        let w = endPos.x - startPos.x;
        let h = endPos.y - startPos.y;
        if (shiftHeld) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w) * s; h = Math.sign(h) * s; }
        if (Math.abs(w) > 5 || Math.abs(h) > 5) {
          setLocalAnnotations((prev) => [...prev, { id, type: "rectangle", x: startPos.x, y: startPos.y, width: w, height: h, color, lineWidth }]);
          setSelectedId(id);
          setTool("select");
        }
      }
    }
    setDragMode("none");
    setStartPos(null);
    setCurrentPos(null);
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && textPos) {
      const id = Date.now().toString();
      setLocalAnnotations((prev) => [
        ...prev,
        { id, type: "text", x: textPos.x, y: textPos.y, text: textInput, color, lineWidth, width: textBoxed ? 1 : 0 },
      ]);
      setTextInput("");
      setTextPos(null);
      setSelectedId(id);
      setTool("select");
    }
  };

  const handleUndo = () => {
    setLocalAnnotations((prev) => prev.slice(0, -1));
    setSelectedId(null);
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      setLocalAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleSave = () => {
    setSelectedId(null);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx && image) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          localAnnotations.forEach((ann) => drawAnnotation(ctx, ann, false));
        }
        onAnnotationsChange(localAnnotations);
        onSave(canvas.toDataURL("image/png"));
        onClose();
      }
    }, 50);
  };

  const allTools: { id: Tool; label: string; icon: string }[] = [
    { id: "select", label: "選択", icon: "↖" },
    { id: "circle", label: "丸", icon: "⭕" },
    { id: "rectangle", label: "四角", icon: "▢" },
    { id: "arrow", label: "矢印", icon: "➡️" },
    { id: "text", label: "文字", icon: "T" },
  ];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center justify-between px-2 py-1.5 bg-gray-900 gap-1">
        <div className="flex gap-1 flex-wrap">
          {allTools.map((t) => (
            <button key={t.id} onClick={() => { setTool(t.id); if (t.id !== "select") setSelectedId(null); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                tool === t.id ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-600 mx-1 self-center" />
          {COLOR_PALETTE.map((c) => (
            <button key={c.value} onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 ${color === c.value ? "border-white scale-110" : "border-gray-600"}`}
              style={{ backgroundColor: c.value }} title={c.label} />
          ))}
          <div className="flex items-center gap-1 ml-1">
            <input type="range" min={2} max={8} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-16 accent-blue-500" />
            <span className="text-gray-400 text-xs">{lineWidth}px</span>
          </div>
          {tool === "text" && (
            <button onClick={() => setTextBoxed(!textBoxed)}
              className={`px-2 py-1 rounded text-xs ${textBoxed ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"}`}>
              枠{textBoxed ? "ON" : "OFF"}
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {selectedId && (
            <button onClick={handleDeleteSelected} className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs sm:text-sm hover:bg-red-700">
              削除
            </button>
          )}
          <button onClick={handleUndo} className="px-2.5 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-600">↩</button>
          <button onClick={handleSave} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700">保存</button>
          <button onClick={onClose} className="px-2.5 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-600">✕</button>
        </div>
      </div>

      {/* ヒント */}
      <div className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs text-center hidden sm:block">
        {tool === "select" ? "図形をクリックで選択 → ドラッグで移動 → ハンドル(○)でサイズ変更 → Delete/Backspaceで削除" :
         tool === "circle" ? "ドラッグで楕円 / Shift+ドラッグで正円 → 描画後に選択ツールで編集" :
         tool === "rectangle" ? "ドラッグで長方形 / Shift+ドラッグで正方形 → 描画後に選択ツールで編集" :
         tool === "arrow" ? "ドラッグで矢印 → 描画後に選択ツールで根元・先端を調整" :
         "クリックした場所にテキスト追加 → 選択ツールで移動"}
      </div>

      {textPos && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-white rounded-xl shadow-lg p-3 flex gap-2">
          <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
            placeholder="テキストを入力..." className="px-3 py-2 border rounded-lg text-sm" autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()} />
          <button onClick={handleTextSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">追加</button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto">
        {canvasSize.width > 0 && (
          <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height}
            className={`touch-none ${tool === "select" ? "cursor-default" : "cursor-crosshair"}`}
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd}
            onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} />
        )}
      </div>
    </div>
  );
}
