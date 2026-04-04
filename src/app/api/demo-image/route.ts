import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

const PROJECT_ID = process.env.GCP_PROJECT_ID || "gen-lang-client-0618000372";

const DEMO_PROMPTS = [
  // index 0: 屋上防水面の劣化
  "Photorealistic inspection photograph, taken from above, of a deteriorated rooftop waterproofing surface on a Japanese apartment building. The waterproof membrane is peeling and cracking extensively, exposing raw concrete underneath. Water puddles on the surface, rust stains near drain areas, visible damage patterns. Overcast sky with distant city buildings. Professional building inspection photo, high detail, natural lighting, 3:2 aspect ratio.",

  // index 1: 鉄部錆・塗膜剥離
  "Photorealistic close-up inspection photograph of severe rust and paint peeling on a metal anchor bolt attached to a concrete wall of a Japanese building. Heavy rust corrosion with rust water streaks dripping down the grey concrete wall. Paint coating flaking off in large pieces revealing corroded metal underneath. Professional building inspection photo, high detail, natural daylight, 3:2 aspect ratio.",

  // index 2: バルコニー防水面の劣化
  "Photorealistic inspection photograph of a damaged balcony waterproofing surface on a Japanese residential building. Concrete floor with deep cracks, waterproof membrane peeling off. Water puddles, moss growth, and deterioration marks visible. Metal railing in background, wall shows water stain marks. Taken from slightly elevated angle. Professional inspection photo, natural lighting, 3:2 aspect ratio.",

  // index 3: コンクリートひび割れ
  "Photorealistic close-up inspection photograph of deep structural cracks in a concrete wall of a Japanese building. A main vertical crack runs through the center with branching smaller cracks. White efflorescence deposits visible along crack edges. Exposed aggregate inside the crack. High detail concrete texture, professional building inspection photography, natural lighting, 3:2 aspect ratio.",
];

function getGcloudToken(): string {
  const gcloudPaths = [
    "/opt/homebrew/bin/gcloud",
    "/usr/local/bin/gcloud",
    `${process.env.HOME}/google-cloud-sdk/bin/gcloud`,
    "gcloud",
  ];
  for (const gcloudPath of gcloudPaths) {
    try {
      return execSync(`${gcloudPath} auth print-access-token`, {
        encoding: "utf-8",
        timeout: 10000,
      }).trim();
    } catch {
      continue;
    }
  }
  throw new Error("gcloud認証に失敗しました。'gcloud auth login' を実行してください。");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const indexStr = searchParams.get("index");

  if (indexStr === null || isNaN(Number(indexStr))) {
    return NextResponse.json({ error: "index parameter required" }, { status: 400 });
  }

  const index = Number(indexStr);
  if (index < 0 || index >= DEMO_PROMPTS.length) {
    return NextResponse.json({ error: "index out of range (0-3)" }, { status: 400 });
  }

  let token: string;
  try {
    token = getGcloudToken();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  try {
    // Gemini 2.0 Flash で画像生成（maikoプロジェクトと同じVertex AI方式）
    const modelName = process.env.IMAGE_MODEL || "gemini-2.0-flash-exp";
    const url = `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/publishers/google/models/${modelName}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: {
          role: "USER",
          parts: [{ text: DEMO_PROMPTS[index] }],
        },
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Vertex AI error:", errText);
      return NextResponse.json(
        { error: "Image generation failed", detail: errText },
        { status: response.status }
      );
    }

    const data = await response.json();

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (!parts) {
      return NextResponse.json({ error: "No image in response" }, { status: 500 });
    }

    const imagePart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    );
    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: "No image data in response" }, { status: 500 });
    }

    const { mimeType, data: base64Data } = imagePart.inlineData;
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({ imageUrl: dataUrl });
  } catch (err) {
    console.error("Demo image generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
