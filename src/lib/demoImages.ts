// デモ用のリアルなイメージ画像をCanvas APIで生成する

function drawRooftopDamage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 曇り空
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.35);
  skyGrad.addColorStop(0, "#8A9AAA");
  skyGrad.addColorStop(0.5, "#A0AABA");
  skyGrad.addColorStop(1, "#B8C0C8");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.35);

  // 雲
  ctx.fillStyle = "rgba(200,205,215,0.6)";
  for (let i = 0; i < 8; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h * 0.25;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 60 + Math.random() * 80, 20 + Math.random() * 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 遠景ビル群
  ctx.fillStyle = "#7A8090";
  for (let i = 0; i < 15; i++) {
    const bx = i * (w / 15) + Math.random() * 10;
    const bh = 20 + Math.random() * 50;
    const bw = 20 + Math.random() * 30;
    ctx.fillRect(bx, h * 0.28 - bh, bw, bh + 10);
  }

  // パラペット（左右の壁）
  ctx.fillStyle = "#9A9690";
  ctx.fillRect(0, h * 0.2, w * 0.06, h * 0.5);
  ctx.fillRect(w * 0.94, h * 0.2, w * 0.06, h * 0.5);

  // 屋上面（劣化した防水層）
  const floorGrad = ctx.createLinearGradient(0, h * 0.35, 0, h);
  floorGrad.addColorStop(0, "#6A6E72");
  floorGrad.addColorStop(0.3, "#585C60");
  floorGrad.addColorStop(1, "#4A4E52");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.35, w, h * 0.65);

  // 防水シートの剥離パッチ（明るいコンクリート露出）
  const patches = [
    { x: w * 0.15, y: h * 0.45, w: w * 0.2, h: h * 0.12 },
    { x: w * 0.5, y: h * 0.4, w: w * 0.25, h: h * 0.15 },
    { x: w * 0.3, y: h * 0.6, w: w * 0.15, h: h * 0.1 },
    { x: w * 0.65, y: h * 0.55, w: w * 0.18, h: h * 0.13 },
    { x: w * 0.1, y: h * 0.7, w: w * 0.22, h: h * 0.08 },
    { x: w * 0.45, y: h * 0.72, w: w * 0.2, h: h * 0.1 },
    { x: w * 0.75, y: h * 0.7, w: w * 0.15, h: h * 0.12 },
  ];
  patches.forEach((p) => {
    ctx.fillStyle = `rgb(${155 + Math.random() * 30}, ${150 + Math.random() * 25}, ${140 + Math.random() * 20})`;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.random() * 10, p.y);
    ctx.lineTo(p.x + p.w - Math.random() * 10, p.y + Math.random() * 8);
    ctx.lineTo(p.x + p.w + Math.random() * 5, p.y + p.h - Math.random() * 5);
    ctx.lineTo(p.x - Math.random() * 5, p.y + p.h + Math.random() * 8);
    ctx.closePath();
    ctx.fill();
  });

  // ひび割れネットワーク
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 25; i++) {
    const sx = Math.random() * w;
    const sy = h * 0.38 + Math.random() * h * 0.55;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    let cx = sx, cy = sy;
    for (let j = 0; j < 3 + Math.random() * 4; j++) {
      cx += (Math.random() - 0.5) * 40;
      cy += Math.random() * 20;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // 水たまり（反射）
  ctx.fillStyle = "rgba(100, 120, 140, 0.4)";
  ctx.beginPath();
  ctx.ellipse(w * 0.3, h * 0.8, 50, 15, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(110, 130, 150, 0.3)";
  ctx.beginPath();
  ctx.ellipse(w * 0.7, h * 0.85, 40, 12, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // 錆汁
  ctx.fillStyle = "rgba(139, 90, 43, 0.5)";
  ctx.beginPath();
  ctx.ellipse(w * 0.8, h * 0.9, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 排水口
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(w * 0.85, h * 0.92, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawRustyBolt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // コンクリート壁面（右側）
  const wallGrad = ctx.createLinearGradient(w * 0.3, 0, w, 0);
  wallGrad.addColorStop(0, "#B5AFA5");
  wallGrad.addColorStop(1, "#C0BAB0");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(w * 0.3, 0, w * 0.7, h);

  // コンクリートのテクスチャ（気泡・粒）
  for (let i = 0; i < 300; i++) {
    const x = w * 0.3 + Math.random() * w * 0.7;
    const y = Math.random() * h;
    const r = Math.random() * 2;
    ctx.fillStyle = `rgba(${100 + Math.random() * 60}, ${95 + Math.random() * 55}, ${85 + Math.random() * 50}, ${0.3 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 塗膜面（左側 - 剥離している）
  ctx.fillStyle = "#D8D2C8";
  ctx.fillRect(0, 0, w * 0.35, h);

  // 剥離した塗膜の縁
  ctx.strokeStyle = "#C8C2B8";
  ctx.lineWidth = 2;
  for (let y = 0; y < h; y += 15 + Math.random() * 20) {
    ctx.beginPath();
    const edge = w * 0.32 + Math.random() * 15;
    ctx.moveTo(edge, y);
    ctx.lineTo(edge + Math.random() * 10 - 5, y + 15);
    ctx.stroke();
  }

  // 剥がれかけの塗膜片
  for (let i = 0; i < 12; i++) {
    const px = Math.random() * w * 0.35;
    const py = Math.random() * h;
    ctx.fillStyle = `rgba(${210 + Math.random() * 20}, ${200 + Math.random() * 20}, ${185 + Math.random() * 20}, 0.8)`;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + 8 + Math.random() * 15, py + Math.random() * 5);
    ctx.lineTo(px + 5 + Math.random() * 12, py + 8 + Math.random() * 12);
    ctx.lineTo(px - Math.random() * 5, py + 5 + Math.random() * 8);
    ctx.closePath();
    ctx.fill();
  }

  // ひび割れ
  ctx.strokeStyle = "#706860";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const sx = w * 0.3 + Math.random() * w * 0.5;
    const sy = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 30, sy + Math.random() * 40);
    ctx.stroke();
  }

  // ボルト/アンカー
  const bx = w * 0.45, by = h * 0.35;
  ctx.fillStyle = "#5A3A20";
  ctx.fillRect(bx - 8, by - 6, 16, 12);
  ctx.fillStyle = "#4A2A15";
  ctx.beginPath();
  ctx.arc(bx, by, 5, 0, Math.PI * 2);
  ctx.fill();

  // 錆汁の流れ（ボルトから下方向）
  const rustGrad = ctx.createLinearGradient(bx, by + 6, bx, h * 0.85);
  rustGrad.addColorStop(0, "rgba(139, 69, 19, 0.7)");
  rustGrad.addColorStop(0.3, "rgba(160, 82, 30, 0.5)");
  rustGrad.addColorStop(0.7, "rgba(139, 90, 43, 0.3)");
  rustGrad.addColorStop(1, "rgba(120, 80, 40, 0.1)");
  ctx.fillStyle = rustGrad;
  ctx.beginPath();
  ctx.moveTo(bx - 6, by + 6);
  ctx.quadraticCurveTo(bx - 10, h * 0.5, bx - 8, h * 0.7);
  ctx.quadraticCurveTo(bx - 5, h * 0.8, bx + 2, h * 0.85);
  ctx.quadraticCurveTo(bx + 8, h * 0.75, bx + 6, h * 0.5);
  ctx.quadraticCurveTo(bx + 4, by + 20, bx + 6, by + 6);
  ctx.closePath();
  ctx.fill();

  // 錆の色むら
  for (let i = 0; i < 20; i++) {
    const rx = bx - 8 + Math.random() * 16;
    const ry = by + 10 + Math.random() * (h * 0.5);
    ctx.fillStyle = `rgba(${130 + Math.random() * 40}, ${60 + Math.random() * 30}, ${15 + Math.random() * 20}, ${0.2 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 3 + Math.random() * 5, 5 + Math.random() * 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBalconyDamage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 曇り空
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.25);
  skyGrad.addColorStop(0, "#8A9AAA");
  skyGrad.addColorStop(1, "#A8B0B8");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.25);

  // 背景の建物
  ctx.fillStyle = "#A09088";
  ctx.fillRect(w * 0.3, h * 0.05, w * 0.4, h * 0.25);
  // 窓
  ctx.fillStyle = "#708090";
  ctx.fillRect(w * 0.38, h * 0.08, w * 0.1, h * 0.08);
  ctx.fillRect(w * 0.55, h * 0.08, w * 0.1, h * 0.08);

  // 壁面（左側）
  ctx.fillStyle = "#A09890";
  ctx.fillRect(0, h * 0.1, w * 0.15, h * 0.7);

  // 手すり（右側）
  ctx.fillStyle = "#6A5A4A";
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(w * 0.8 + i * 15, h * 0.15, 3, h * 0.35);
  }
  ctx.fillRect(w * 0.78, h * 0.15, w * 0.2, 4);

  // バルコニー床面（劣化防水）
  const floorGrad = ctx.createLinearGradient(0, h * 0.35, 0, h);
  floorGrad.addColorStop(0, "#505550");
  floorGrad.addColorStop(0.5, "#484C48");
  floorGrad.addColorStop(1, "#404440");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.35, w, h * 0.65);

  // ひび割れパターン（大きなクラック）
  ctx.strokeStyle = "#2A2E2A";
  ctx.lineWidth = 3;
  // メインクラック
  const cracks = [
    [{ x: w * 0.1, y: h * 0.4 }, { x: w * 0.25, y: h * 0.55 }, { x: w * 0.4, y: h * 0.6 }, { x: w * 0.6, y: h * 0.65 }],
    [{ x: w * 0.3, y: h * 0.45 }, { x: w * 0.45, y: h * 0.5 }, { x: w * 0.5, y: h * 0.7 }, { x: w * 0.55, y: h * 0.85 }],
    [{ x: w * 0.05, y: h * 0.6 }, { x: w * 0.2, y: h * 0.7 }, { x: w * 0.35, y: h * 0.75 }, { x: w * 0.5, y: h * 0.8 }],
    [{ x: w * 0.6, y: h * 0.45 }, { x: w * 0.7, y: h * 0.6 }, { x: w * 0.75, y: h * 0.75 }],
  ];
  cracks.forEach((crack) => {
    ctx.beginPath();
    ctx.moveTo(crack[0].x, crack[0].y);
    crack.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  });

  // 細いクラック
  ctx.lineWidth = 1;
  for (let i = 0; i < 15; i++) {
    const sx = Math.random() * w;
    const sy = h * 0.4 + Math.random() * h * 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 50, sy + Math.random() * 30);
    ctx.stroke();
  }

  // 剥離した防水面パッチ
  for (let i = 0; i < 6; i++) {
    const px = Math.random() * w * 0.7;
    const py = h * 0.42 + Math.random() * h * 0.35;
    ctx.fillStyle = `rgba(${90 + Math.random() * 30}, ${95 + Math.random() * 25}, ${80 + Math.random() * 20}, 0.6)`;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + 30 + Math.random() * 40, py + Math.random() * 15);
    ctx.lineTo(px + 25 + Math.random() * 35, py + 20 + Math.random() * 25);
    ctx.lineTo(px - Math.random() * 10, py + 15 + Math.random() * 20);
    ctx.closePath();
    ctx.fill();
  }

  // 水たまり
  ctx.fillStyle = "rgba(80, 100, 110, 0.35)";
  ctx.beginPath();
  ctx.ellipse(w * 0.45, h * 0.75, 45, 18, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.25, h * 0.85, 30, 12, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // 苔・汚れ
  ctx.fillStyle = "rgba(80, 100, 60, 0.3)";
  ctx.beginPath();
  ctx.ellipse(w * 0.55, h * 0.65, 25, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // 壁面の水染み
  ctx.fillStyle = "rgba(70, 65, 55, 0.2)";
  ctx.fillRect(0, h * 0.5, w * 0.12, h * 0.3);
}

function drawConcreteCrack(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // コンクリート基盤
  ctx.fillStyle = "#B0AAA0";
  ctx.fillRect(0, 0, w, h);

  // コンクリートのテクスチャ（気泡・骨材）
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.5 + Math.random() * 2.5;
    const shade = 90 + Math.random() * 80;
    ctx.fillStyle = `rgba(${shade}, ${shade - 5}, ${shade - 15}, ${0.3 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 骨材（大きな粒）
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 2 + Math.random() * 4;
    ctx.fillStyle = `rgba(${80 + Math.random() * 60}, ${75 + Math.random() * 55}, ${65 + Math.random() * 45}, 0.5)`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + Math.random() * 0.8), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // メインクラック（中央の深いひび割れ）
  ctx.strokeStyle = "#2A2420";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(w * 0.45, 0);
  ctx.quadraticCurveTo(w * 0.42, h * 0.15, w * 0.48, h * 0.25);
  ctx.quadraticCurveTo(w * 0.52, h * 0.35, w * 0.46, h * 0.45);
  ctx.quadraticCurveTo(w * 0.43, h * 0.55, w * 0.5, h * 0.65);
  ctx.quadraticCurveTo(w * 0.53, h * 0.75, w * 0.48, h * 0.85);
  ctx.quadraticCurveTo(w * 0.45, h * 0.92, w * 0.5, h);
  ctx.stroke();

  // クラックの影（深さ表現）
  ctx.strokeStyle = "#1A1410";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.46, 0);
  ctx.quadraticCurveTo(w * 0.43, h * 0.15, w * 0.49, h * 0.25);
  ctx.quadraticCurveTo(w * 0.53, h * 0.35, w * 0.47, h * 0.45);
  ctx.quadraticCurveTo(w * 0.44, h * 0.55, w * 0.51, h * 0.65);
  ctx.quadraticCurveTo(w * 0.54, h * 0.75, w * 0.49, h * 0.85);
  ctx.quadraticCurveTo(w * 0.46, h * 0.92, w * 0.51, h);
  ctx.stroke();

  // 並行するサブクラック
  ctx.strokeStyle = "#3A3430";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.4, h * 0.1);
  ctx.quadraticCurveTo(w * 0.38, h * 0.3, w * 0.42, h * 0.5);
  ctx.quadraticCurveTo(w * 0.4, h * 0.65, w * 0.43, h * 0.8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.55, h * 0.05);
  ctx.quadraticCurveTo(w * 0.57, h * 0.2, w * 0.53, h * 0.4);
  ctx.quadraticCurveTo(w * 0.56, h * 0.6, w * 0.54, h * 0.75);
  ctx.stroke();

  // 枝分かれクラック
  ctx.lineWidth = 1.5;
  const branches = [
    [w * 0.48, h * 0.25, w * 0.55, h * 0.2],
    [w * 0.46, h * 0.45, w * 0.38, h * 0.42],
    [w * 0.5, h * 0.65, w * 0.58, h * 0.6],
    [w * 0.48, h * 0.85, w * 0.4, h * 0.88],
    [w * 0.42, h * 0.5, w * 0.35, h * 0.55],
    [w * 0.53, h * 0.4, w * 0.6, h * 0.38],
  ];
  branches.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  // クラック周辺の欠け
  for (let i = 0; i < 15; i++) {
    const cx = w * 0.4 + Math.random() * w * 0.2;
    const cy = Math.random() * h;
    ctx.fillStyle = `rgba(${60 + Math.random() * 30}, ${55 + Math.random() * 25}, ${45 + Math.random() * 20}, 0.4)`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 3 + Math.random() * 6, 2 + Math.random() * 4, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // クラック内部に見える骨材
  for (let i = 0; i < 8; i++) {
    const cx = w * 0.44 + Math.random() * w * 0.1;
    const cy = Math.random() * h;
    ctx.fillStyle = `rgba(${100 + Math.random() * 50}, ${90 + Math.random() * 40}, ${70 + Math.random() * 30}, 0.6)`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 2 + Math.random() * 3, 1.5 + Math.random() * 2, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // 白い析出物（エフロレッセンス）
  ctx.strokeStyle = "rgba(220, 220, 210, 0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const sx = w * 0.44 + Math.random() * w * 0.12;
    const sy = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 15, sy + Math.random() * 10);
    ctx.stroke();
  }
}

const DEMO_PROMPTS = [
  "Photorealistic inspection photograph, taken from above, of a deteriorated rooftop waterproofing surface on a Japanese apartment building. The waterproof membrane is peeling and cracking extensively, exposing raw concrete underneath. Water puddles on the surface, rust stains near drain areas, visible damage patterns. Overcast sky with distant city buildings. Professional building inspection photo, high detail, natural lighting, 3:2 aspect ratio.",
  "Photorealistic close-up inspection photograph of severe rust and paint peeling on a metal anchor bolt attached to a concrete wall of a Japanese building. Heavy rust corrosion with rust water streaks dripping down the grey concrete wall. Paint coating flaking off in large pieces revealing corroded metal underneath. Professional building inspection photo, high detail, natural daylight, 3:2 aspect ratio.",
  "Photorealistic inspection photograph of a damaged balcony waterproofing surface on a Japanese residential building. Concrete floor with deep cracks, waterproof membrane peeling off. Water puddles, moss growth, and deterioration marks visible. Metal railing in background, wall shows water stain marks. Taken from slightly elevated angle. Professional inspection photo, natural lighting, 3:2 aspect ratio.",
  "Photorealistic close-up inspection photograph of deep structural cracks in a concrete wall of a Japanese building. A main vertical crack runs through the center with branching smaller cracks. White efflorescence deposits visible along crack edges. Exposed aggregate inside the crack. High detail concrete texture, professional building inspection photography, natural lighting, 3:2 aspect ratio.",
];

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || "";

export async function createDemoImageAI(index: number): Promise<string | null> {
  if (!GEMINI_API_KEY || index < 0 || index >= DEMO_PROMPTS.length) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: DEMO_PROMPTS[index] }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts;
    const img = parts?.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData);
    if (!img?.inlineData) return null;
    return `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`;
  } catch {
    return null;
  }
}

export function createDemoImage(index: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;

  switch (index) {
    case 0:
      drawRooftopDamage(ctx, 640, 480);
      break;
    case 1:
      drawRustyBolt(ctx, 640, 480);
      break;
    case 2:
      drawBalconyDamage(ctx, 640, 480);
      break;
    case 3:
      drawConcreteCrack(ctx, 640, 480);
      break;
    default:
      drawRooftopDamage(ctx, 640, 480);
  }

  return canvas.toDataURL("image/png");
}
