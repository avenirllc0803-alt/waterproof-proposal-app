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

type Tool = "select" | "circle" | "rectangle" | "arrow" | "text";

const COLORS = [
  { v: "#FF0000", l: "赤" }, { v: "#0000FF", l: "青" }, { v: "#00AA00", l: "緑" },
  { v: "#FFcc00", l: "黄" }, { v: "#000000", l: "黒" }, { v: "#FFFFFF", l: "白" },
];
const BG_COLORS = [
  { v: "", l: "なし" }, { v: "rgba(255,255,255,0.9)", l: "白" },
  { v: "rgba(255,255,200,0.9)", l: "黄" }, { v: "rgba(200,230,255,0.9)", l: "青" },
  { v: "rgba(255,220,220,0.9)", l: "赤" },
];

export default function AnnotationCanvas({ imageUrl, onAnnotationsChange, onSave, onClose }: Props) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#FF0000");
  const [lineWidth, setLineWidth] = useState(3);
  const [fontSize, setFontSize] = useState(18);
  const [ready, setReady] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedObj, setSelectedObj] = useState<any>(null);
  const drawState = useRef<{ startX: number; startY: number; obj: any } | null>(null);

  // Fabric.js初期化
  useEffect(() => {
    let fc: any = null;
    const init = async () => {
      const fabric = await import("fabric");
      const container = containerRef.current;
      const canvasEl = canvasElRef.current;
      if (!container || !canvasEl) return;

      const maxW = container.clientWidth - 4;
      const maxH = container.clientHeight - 4;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);

        canvasEl.width = w;
        canvasEl.height = h;

        fc = new fabric.Canvas(canvasEl, { width: w, height: h, selection: true });
        fabricRef.current = fc;

        const bgImg = new fabric.FabricImage(img, { scaleX: scale, scaleY: scale });
        fc.backgroundImage = bgImg;
        fc.renderAll();

        // 選択イベント
        fc.on("selection:created", (e: any) => {
          const obj = e.selected?.[0];
          updateSelectedInfo(obj);
        });
        fc.on("selection:updated", (e: any) => {
          const obj = e.selected?.[0];
          updateSelectedInfo(obj);
        });
        fc.on("selection:cleared", () => {
          setSelectedType(null); setSelectedObj(null);
        });

        setReady(true);
      };
      img.src = imageUrl;
    };

    init();
    return () => { if (fc) fc.dispose(); };
  }, [imageUrl]);

  const updateSelectedInfo = (obj: any) => {
    if (!obj) { setSelectedType(null); setSelectedObj(null); return; }
    if (obj.type === "textbox") setSelectedType("text");
    else if (obj.type === "ellipse") setSelectedType("circle");
    else if (obj.type === "rect") setSelectedType("rectangle");
    else if (obj.type === "group" || obj.type === "line") setSelectedType("arrow");
    else setSelectedType(obj.type);
    setSelectedObj(obj);
  };

  // ツール切り替え
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    if (tool === "select") {
      fc.selection = true;
      fc.forEachObject((o: any) => { o.selectable = true; o.evented = true; });
      fc.defaultCursor = "default";
      fc.off("mouse:down"); fc.off("mouse:move"); fc.off("mouse:up");
    } else {
      fc.selection = false;
      fc.discardActiveObject();
      fc.forEachObject((o: any) => { o.selectable = false; o.evented = false; });
      fc.defaultCursor = "crosshair";

      fc.off("mouse:down"); fc.off("mouse:move"); fc.off("mouse:up");

      fc.on("mouse:down", (opt: any) => {
        const pointer = fc.getScenePoint(opt.e);
        startDraw(pointer.x, pointer.y);
      });
      fc.on("mouse:move", (opt: any) => {
        const pointer = fc.getScenePoint(opt.e);
        moveDraw(pointer.x, pointer.y);
      });
      fc.on("mouse:up", () => {
        endDraw();
      });
    }
  }, [tool, color, lineWidth, fontSize, ready]);

  const startDraw = useCallback(async (x: number, y: number) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const fabric = await import("fabric");

    let obj: any = null;
    if (tool === "circle") {
      obj = new fabric.Ellipse({ left: x, top: y, rx: 0, ry: 0, fill: "transparent", stroke: color, strokeWidth: lineWidth, originX: "center", originY: "center" });
    } else if (tool === "rectangle") {
      obj = new fabric.Rect({ left: x, top: y, width: 0, height: 0, fill: "transparent", stroke: color, strokeWidth: lineWidth });
    } else if (tool === "arrow") {
      obj = new fabric.Line([x, y, x, y], { stroke: color, strokeWidth: lineWidth, selectable: false });
    } else if (tool === "text") {
      obj = new fabric.Rect({ left: x, top: y, width: 0, height: 0, fill: "transparent", stroke: "#0088ff", strokeWidth: 1, strokeDashArray: [5, 3] });
    }
    if (obj) {
      fc.add(obj);
      drawState.current = { startX: x, startY: y, obj };
    }
  }, [tool, color, lineWidth]);

  const moveDraw = useCallback((x: number, y: number) => {
    const ds = drawState.current;
    const fc = fabricRef.current;
    if (!ds || !fc) return;

    if (tool === "circle") {
      const rx = Math.abs(x - ds.startX) / 2;
      const ry = Math.abs(y - ds.startY) / 2;
      ds.obj.set({ rx, ry, left: (ds.startX + x) / 2, top: (ds.startY + y) / 2 });
    } else if (tool === "rectangle" || tool === "text") {
      ds.obj.set({
        left: Math.min(ds.startX, x), top: Math.min(ds.startY, y),
        width: Math.abs(x - ds.startX), height: Math.abs(y - ds.startY),
      });
    } else if (tool === "arrow") {
      ds.obj.set({ x2: x, y2: y });
    }
    fc.renderAll();
  }, [tool]);

  const endDraw = useCallback(async () => {
    const ds = drawState.current;
    const fc = fabricRef.current;
    if (!ds || !fc) return;
    drawState.current = null;
    const fabric = await import("fabric");

    if (tool === "circle") {
      if (ds.obj.rx < 3 && ds.obj.ry < 3) { fc.remove(ds.obj); return; }
      ds.obj.set({ selectable: true, evented: true });
    } else if (tool === "rectangle") {
      if (ds.obj.width < 5 && ds.obj.height < 5) { fc.remove(ds.obj); return; }
      ds.obj.set({ selectable: true, evented: true });
    } else if (tool === "arrow") {
      fc.remove(ds.obj);
      const x1 = ds.obj.x1!, y1 = ds.obj.y1!, x2 = ds.obj.x2!, y2 = ds.obj.y2!;
      if (Math.hypot(x2 - x1, y2 - y1) < 10) return;
      // 矢印ヘッド
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const hl = 12 + lineWidth * 2;
      const line = new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: lineWidth });
      const head1 = new fabric.Line([x2, y2, x2 - hl * Math.cos(angle - Math.PI / 6), y2 - hl * Math.sin(angle - Math.PI / 6)], { stroke: color, strokeWidth: lineWidth });
      const head2 = new fabric.Line([x2, y2, x2 - hl * Math.cos(angle + Math.PI / 6), y2 - hl * Math.sin(angle + Math.PI / 6)], { stroke: color, strokeWidth: lineWidth });
      const group = new fabric.Group([line, head1, head2], { selectable: true, evented: true });
      fc.add(group);
      fc.setActiveObject(group);
    } else if (tool === "text") {
      fc.remove(ds.obj);
      const w = Math.max(ds.obj.width || 80, 60);
      const h = Math.max(ds.obj.height || 30, 25);
      const textbox = new fabric.Textbox("", {
        left: ds.obj.left, top: ds.obj.top, width: w,
        fontSize: fontSize, fill: color, fontWeight: "bold",
        editable: true, selectable: true, evented: true,
        borderColor: "#0088ff", cornerColor: "#0088ff", cornerStyle: "circle", cornerSize: 10,
        padding: 6,
      });
      fc.add(textbox);
      fc.setActiveObject(textbox);
      textbox.enterEditing();
    }

    setTool("select");
    fc.renderAll();
  }, [tool, color, lineWidth, fontSize]);

  const handleSave = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.discardActiveObject();
    fc.renderAll();
    const dataUrl = fc.toDataURL({ format: "png", multiplier: 1 });
    onAnnotationsChange([]);
    onSave(dataUrl);
    onClose();
  }, [onAnnotationsChange, onSave, onClose]);

  const deleteSelected = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (active) { fc.remove(active); fc.discardActiveObject(); fc.renderAll(); }
    setSelectedType(null); setSelectedObj(null);
  };

  const updateSelectedColor = (c: string) => {
    setColor(c);
    const fc = fabricRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (!obj) return;
    if (obj.type === "textbox") { obj.set("fill", c); }
    else if (obj.type === "ellipse" || obj.type === "rect") { obj.set("stroke", c); }
    else if (obj.type === "group") { obj.getObjects().forEach((o: any) => o.set("stroke", c)); }
    fc.renderAll();
  };

  const updateSelectedFontSize = (fs: number) => {
    setFontSize(fs);
    const obj = fabricRef.current?.getActiveObject();
    if (obj?.type === "textbox") { obj.set("fontSize", fs); fabricRef.current.renderAll(); }
  };

  const toggleTextBorder = () => {
    const obj = fabricRef.current?.getActiveObject();
    if (obj?.type === "textbox") {
      const hasBorder = (obj.strokeWidth || 0) > 0;
      obj.set({ stroke: hasBorder ? "transparent" : color, strokeWidth: hasBorder ? 0 : 1.5 });
      fabricRef.current.renderAll();
    }
  };

  const setTextBgColor = (bg: string) => {
    const obj = fabricRef.current?.getActiveObject();
    if (obj?.type === "textbox") {
      obj.set("backgroundColor", bg || "");
      fabricRef.current.renderAll();
    }
  };

  // キーボード削除
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && fabricRef.current) {
        const active = fabricRef.current.getActiveObject();
        if (active && active.type !== "textbox") { deleteSelected(); }
        else if (active?.type === "textbox" && !active.isEditing) { deleteSelected(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
            <button key={t.id} onClick={() => setTool(t.id)}
              className={`px-2 py-1.5 rounded text-xs font-medium ${tool === t.id ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
              {t.label}
            </button>
          ))}
          <span className="w-px h-5 bg-gray-600 mx-1" />
          {COLORS.map((c) => (
            <button key={c.v} onClick={() => updateSelectedColor(c.v)}
              className={`w-5 h-5 rounded-full border-2 ${color === c.v ? "border-white scale-110" : "border-gray-600"}`}
              style={{ backgroundColor: c.v }} title={c.l} />
          ))}
          <span className="w-px h-5 bg-gray-600 mx-1" />
          <input type="range" min={1} max={8} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-14 accent-blue-500" />
          <span className="text-gray-400 text-xs">{lineWidth}px</span>
        </div>
        <div className="flex gap-1">
          {selectedObj && <button onClick={deleteSelected} className="px-2 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700">削除</button>}
          <button onClick={() => { const fc = fabricRef.current; if (fc) { const objs = fc.getObjects(); if (objs.length > 0) { fc.remove(objs[objs.length - 1]); fc.renderAll(); } } }}
            className="px-2 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600">↩</button>
          <button onClick={handleSave} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">保存</button>
          <button onClick={onClose} className="px-2 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600">✕</button>
        </div>
      </div>

      {/* テキスト選択時のプロパティ */}
      {selectedType === "text" && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-gray-800 border-t border-gray-700">
          <span className="text-gray-400 text-xs">文字サイズ:</span>
          <input type="range" min={10} max={40} value={selectedObj?.fontSize || fontSize}
            onChange={(e) => updateSelectedFontSize(Number(e.target.value))} className="w-16 accent-blue-500" />
          <span className="text-gray-300 text-xs">{selectedObj?.fontSize || fontSize}px</span>
          <button onClick={toggleTextBorder}
            className={`px-2 py-1 rounded text-xs ${(selectedObj?.strokeWidth || 0) > 0 ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"}`}>
            枠{(selectedObj?.strokeWidth || 0) > 0 ? "ON" : "OFF"}
          </button>
          <span className="text-gray-400 text-xs">背景:</span>
          {BG_COLORS.map((bg) => (
            <button key={bg.l} onClick={() => setTextBgColor(bg.v)}
              className={`px-1.5 py-0.5 rounded text-xs border ${(selectedObj?.backgroundColor || "") === bg.v ? "border-blue-400 bg-gray-600 text-white" : "border-gray-600 text-gray-400"}`}>
              {bg.l}
            </button>
          ))}
        </div>
      )}

      {/* ヒント */}
      <div className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs text-center hidden sm:block">
        {tool === "select" ? "クリックで選択 → ドラッグで移動 → ハンドルでサイズ変更 → テキストはダブルクリックで編集" :
         tool === "text" ? "ドラッグでテキストボックスの領域を描く → テキスト入力" :
         tool === "circle" ? "ドラッグで楕円を描く" :
         tool === "rectangle" ? "ドラッグで四角を描く" :
         "ドラッグで矢印を描く"}
      </div>

      {/* キャンバス */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto">
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}
