// デモ用のリアルなイメージ画像をCanvas APIで生成する

function drawRooftopRising(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 空
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.35);
  skyGrad.addColorStop(0, "#87CEEB");
  skyGrad.addColorStop(1, "#B0D4E8");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.35);

  // 屋上コンクリート面
  ctx.fillStyle = "#A8A8A0";
  ctx.fillRect(0, h * 0.35, w, h * 0.65);

  // コンクリートのテクスチャ
  ctx.fillStyle = "#9E9E96";
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w;
    const y = h * 0.35 + Math.random() * h * 0.65;
    ctx.fillRect(x, y, Math.random() * 8 + 2, Math.random() * 3 + 1);
  }

  // 立上り壁（パラペット）
  ctx.fillStyle = "#B0B0A8";
  ctx.fillRect(0, h * 0.15, w, h * 0.25);
  // 壁の影
  ctx.fillStyle = "#908F88";
  ctx.fillRect(0, h * 0.35, w, h * 0.05);

  // 防水シート（立上り部）— 浮いている表現
  ctx.fillStyle = "#7B8FA0";
  ctx.fillRect(0, h * 0.2, w, h * 0.18);

  // シートの浮き（波打ち）
  ctx.strokeStyle = "#6B7F90";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < w; x += 5) {
    const y = h * 0.28 + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.08) * 4;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // シート剥離の隙間
  ctx.fillStyle = "#3D3D38";
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.2);
  ctx.quadraticCurveTo(w * 0.4, h * 0.23, w * 0.55, h * 0.2);
  ctx.lineTo(w * 0.55, h * 0.22);
  ctx.quadraticCurveTo(w * 0.4, h * 0.25, w * 0.3, h * 0.22);
  ctx.fill();

  // 赤丸で問題箇所をマーク
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w * 0.42, h * 0.22, w * 0.15, h * 0.06, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 赤矢印
  ctx.beginPath();
  ctx.moveTo(w * 0.6, h * 0.12);
  ctx.lineTo(w * 0.52, h * 0.18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.52, h * 0.18);
  ctx.lineTo(w * 0.56, h * 0.155);
  ctx.stroke();
  ctx.moveTo(w * 0.52, h * 0.18);
  ctx.lineTo(w * 0.545, h * 0.185);
  ctx.stroke();

  // ラベル
  ctx.fillStyle = "#FF0000";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("シート浮き・剥離箇所", w * 0.42, h * 0.1);

  // 寸法線風の表現
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.2);
  ctx.lineTo(w * 0.05, h * 0.38);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#333";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("立上り部", w * 0.07, h * 0.3);
}

function drawPvcSheet(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // コンクリート躯体
  ctx.fillStyle = "#B5B0A5";
  ctx.fillRect(0, 0, w, h);

  // 躯体のテクスチャ
  ctx.fillStyle = "#AAA59A";
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillRect(x, y, Math.random() * 10 + 2, Math.random() * 4 + 1);
  }

  // 塩ビシート（既存・劣化）
  ctx.fillStyle = "#8899AA";
  ctx.fillRect(w * 0.05, h * 0.15, w * 0.9, h * 0.55);

  // シートのジョイント線
  ctx.strokeStyle = "#667788";
  ctx.lineWidth = 2;
  for (let x = w * 0.05; x < w * 0.95; x += w * 0.3) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.15);
    ctx.lineTo(x, h * 0.7);
    ctx.stroke();
  }

  // 膨れ（複数箇所）
  const blisters = [
    { x: w * 0.3, y: h * 0.35, rx: 35, ry: 20 },
    { x: w * 0.6, y: h * 0.5, rx: 45, ry: 25 },
    { x: w * 0.2, y: h * 0.55, rx: 25, ry: 15 },
  ];

  blisters.forEach((b) => {
    const grad = ctx.createRadialGradient(b.x, b.y - 5, 0, b.x, b.y, b.rx);
    grad.addColorStop(0, "#99AABB");
    grad.addColorStop(1, "#8899AA");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#778899";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // ひび割れ
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.3);
  ctx.lineTo(w * 0.5, h * 0.4);
  ctx.lineTo(w * 0.47, h * 0.5);
  ctx.lineTo(w * 0.52, h * 0.6);
  ctx.stroke();
  // 枝分かれ
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.4);
  ctx.lineTo(w * 0.55, h * 0.45);
  ctx.stroke();

  // 赤丸
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.45, w * 0.2, h * 0.2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ラベル
  ctx.fillStyle = "#FF0000";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("シート膨れ・ひび割れ", w * 0.5, h * 0.85);

  // 説明注記
  ctx.fillStyle = "#333";
  ctx.font = "12px sans-serif";
  ctx.fillText("既存塩ビシート → 撤去して新規施工推奨", w * 0.5, h * 0.92);
}

function drawCopingJoint(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 空
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.3);
  skyGrad.addColorStop(0, "#87CEEB");
  skyGrad.addColorStop(1, "#C0D8E8");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.3);

  // パラペット壁
  ctx.fillStyle = "#C0BDB5";
  ctx.fillRect(0, h * 0.3, w, h * 0.5);

  // 壁のテクスチャ
  ctx.fillStyle = "#B5B2AA";
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * w;
    const y = h * 0.3 + Math.random() * h * 0.5;
    ctx.fillRect(x, y, Math.random() * 6 + 1, Math.random() * 3 + 1);
  }

  // 笠木（上部の金属キャップ）
  ctx.fillStyle = "#888";
  ctx.fillRect(0, h * 0.25, w, h * 0.08);
  // 笠木のハイライト
  const capGrad = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.33);
  capGrad.addColorStop(0, "#AAA");
  capGrad.addColorStop(0.3, "#999");
  capGrad.addColorStop(1, "#777");
  ctx.fillStyle = capGrad;
  ctx.fillRect(0, h * 0.25, w, h * 0.08);

  // ジョイント部（隙間）
  ctx.fillStyle = "#444";
  ctx.fillRect(w * 0.48, h * 0.25, 4, h * 0.08);
  ctx.fillRect(w * 0.2, h * 0.25, 4, h * 0.08);
  ctx.fillRect(w * 0.76, h * 0.25, 4, h * 0.08);

  // シーリング劣化の表現（中央ジョイント）
  ctx.fillStyle = "#555";
  ctx.fillRect(w * 0.47, h * 0.25, 6, h * 0.08);
  // ひび割れ
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.49, h * 0.26);
  ctx.lineTo(w * 0.5, h * 0.29);
  ctx.lineTo(w * 0.49, h * 0.32);
  ctx.stroke();

  // 雨水浸入の表現（水色の滴り）
  ctx.fillStyle = "rgba(100, 180, 255, 0.5)";
  ctx.beginPath();
  ctx.moveTo(w * 0.49, h * 0.33);
  ctx.lineTo(w * 0.47, h * 0.42);
  ctx.lineTo(w * 0.51, h * 0.42);
  ctx.closePath();
  ctx.fill();

  // 赤丸
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w * 0.49, h * 0.32, w * 0.08, h * 0.1, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 赤矢印
  ctx.beginPath();
  ctx.moveTo(w * 0.65, h * 0.2);
  ctx.lineTo(w * 0.55, h * 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.55, h * 0.28);
  ctx.lineTo(w * 0.59, h * 0.25);
  ctx.stroke();
  ctx.moveTo(w * 0.55, h * 0.28);
  ctx.lineTo(w * 0.58, h * 0.295);
  ctx.stroke();

  // ラベル
  ctx.fillStyle = "#FF0000";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("笠木ジョイント劣化", w * 0.65, h * 0.16);

  // 下部の屋上面
  ctx.fillStyle = "#A0A098";
  ctx.fillRect(0, h * 0.8, w, h * 0.2);

  // 説明
  ctx.fillStyle = "#333";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("オーバーブリッジ工法で対応", w * 0.5, h * 0.93);
}

function drawExteriorWall(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 空
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, w, h * 0.15);

  // 外壁（タイル風）
  ctx.fillStyle = "#D4C8B8";
  ctx.fillRect(0, h * 0.15, w, h * 0.85);

  // タイル目地
  ctx.strokeStyle = "#C0B4A4";
  ctx.lineWidth = 1;
  const tileH = 25;
  const tileW = 50;
  for (let y = h * 0.15; y < h; y += tileH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    const offset = (Math.floor((y - h * 0.15) / tileH) % 2) * (tileW / 2);
    for (let x = offset; x < w; x += tileW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + tileH);
      ctx.stroke();
    }
  }

  // バルコニー手すり
  ctx.fillStyle = "#888";
  ctx.fillRect(0, h * 0.45, w, 6);
  // 手すり支柱
  for (let x = w * 0.1; x < w; x += w * 0.15) {
    ctx.fillRect(x, h * 0.35, 4, h * 0.12);
  }

  // 目地シーリングの劣化（黒い線 = ひび割れ）
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  // 縦目地の劣化
  ctx.beginPath();
  ctx.moveTo(w * 0.35, h * 0.5);
  ctx.lineTo(w * 0.35, h * 0.75);
  ctx.stroke();
  // ひび割れ表現
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.55);
  ctx.lineTo(w * 0.32, h * 0.58);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h * 0.65);
  ctx.lineTo(w * 0.38, h * 0.68);
  ctx.stroke();
  ctx.setLineDash([]);

  // 水染み
  ctx.fillStyle = "rgba(80, 70, 60, 0.15)";
  ctx.beginPath();
  ctx.moveTo(w * 0.33, h * 0.75);
  ctx.quadraticCurveTo(w * 0.35, h * 0.85, w * 0.37, h * 0.75);
  ctx.quadraticCurveTo(w * 0.36, h * 0.82, w * 0.33, h * 0.75);
  ctx.fill();

  // 赤丸
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w * 0.35, h * 0.63, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 散水試験の表現（右側）
  ctx.fillStyle = "rgba(100, 180, 255, 0.3)";
  ctx.beginPath();
  ctx.arc(w * 0.7, h * 0.35, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4090D0";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // ラベル
  ctx.fillStyle = "#FF0000";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("目地シーリング劣化", w * 0.35, h * 0.48);

  ctx.fillStyle = "#4090D0";
  ctx.fillText("散水試験実施箇所", w * 0.7, h * 0.28);
}

export function createDemoImage(index: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;

  switch (index) {
    case 0:
      drawRooftopRising(ctx, 640, 480);
      break;
    case 1:
      drawPvcSheet(ctx, 640, 480);
      break;
    case 2:
      drawCopingJoint(ctx, 640, 480);
      break;
    case 3:
      drawExteriorWall(ctx, 640, 480);
      break;
    default:
      drawRooftopRising(ctx, 640, 480);
  }

  return canvas.toDataURL("image/png");
}
