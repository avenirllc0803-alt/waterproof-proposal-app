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

type Tool = "circle" | "arrow" | "text" | "select";

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
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>(annotations);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      const container = containerRef.current;
      if (container) {
        const maxW = container.clientWidth;
        const maxH = container.clientHeight - 60;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        setCanvasSize({
          width: img.width * scale,
          height: img.height * scale,
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    localAnnotations.forEach((ann) => {
      ctx.strokeStyle = "#FF0000";
      ctx.fillStyle = "#FF0000";
      ctx.lineWidth = 3;

      if (ann.type === "circle" && ann.radiusX && ann.radiusY) {
        ctx.beginPath();
        ctx.ellipse(ann.x, ann.y, ann.radiusX, ann.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ann.type === "arrow" && ann.endX !== undefined && ann.endY !== undefined) {
        const headLen = 15;
        const angle = Math.atan2(ann.endY - ann.y, ann.endX - ann.x);
        ctx.beginPath();
        ctx.moveTo(ann.x, ann.y);
        ctx.lineTo(ann.endX, ann.endY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ann.endX, ann.endY);
        ctx.lineTo(
          ann.endX - headLen * Math.cos(angle - Math.PI / 6),
          ann.endY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(ann.endX, ann.endY);
        ctx.lineTo(
          ann.endX - headLen * Math.cos(angle + Math.PI / 6),
          ann.endY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (ann.type === "text" && ann.text) {
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "#FF0000";
        ctx.fillText(ann.text, ann.x, ann.y);
      }
    });
  }, [image, localAnnotations]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === "text") {
      const pos = getCanvasPos(e);
      setTextPos(pos);
      return;
    }
    setIsDrawing(true);
    setStartPos(getCanvasPos(e));
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos) return;
    setIsDrawing(false);

    const endPos = getCanvasPos(e);
    const id = Date.now().toString();

    if (tool === "circle") {
      const cx = (startPos.x + endPos.x) / 2;
      const cy = (startPos.y + endPos.y) / 2;
      const rx = Math.abs(endPos.x - startPos.x) / 2;
      const ry = Math.abs(endPos.y - startPos.y) / 2;
      if (rx > 5 || ry > 5) {
        setLocalAnnotations((prev) => [
          ...prev,
          { id, type: "circle", x: cx, y: cy, radiusX: rx, radiusY: ry },
        ]);
      }
    } else if (tool === "arrow") {
      const dist = Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y);
      if (dist > 10) {
        setLocalAnnotations((prev) => [
          ...prev,
          { id, type: "arrow", x: startPos.x, y: startPos.y, endX: endPos.x, endY: endPos.y },
        ]);
      }
    }
    setStartPos(null);
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && textPos) {
      setLocalAnnotations((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "text", x: textPos.x, y: textPos.y, text: textInput },
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

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: "circle", label: "丸", icon: "⭕" },
    { id: "arrow", label: "矢印", icon: "➡️" },
    { id: "text", label: "テキスト", icon: "T" },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gray-900">
        <div className="flex gap-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tool === t.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
          >
            ↩ 戻す
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            保存
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
          >
            キャンセル
          </button>
        </div>
      </div>

      {textPos && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-white rounded-xl shadow-lg p-3 flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="テキストを入力..."
            className="px-3 py-2 border rounded-lg text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
          />
          <button
            onClick={handleTextSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            追加
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-auto p-4"
      >
        {canvasSize.width > 0 && (
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="cursor-crosshair touch-none"
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
          />
        )}
      </div>
    </div>
  );
}
