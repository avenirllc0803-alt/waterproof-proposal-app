import { NextRequest, NextResponse } from "next/server";

const DEMO_PROMPTS = [
  "Photorealistic inspection photograph, taken from above, of a deteriorated rooftop waterproofing surface on a Japanese apartment building. The waterproof membrane is peeling and cracking extensively, exposing raw concrete underneath. Water puddles on the surface, rust stains near drain areas, visible damage patterns. Overcast sky with distant city buildings. Professional building inspection photo, high detail, natural lighting, 3:2 aspect ratio.",

  "Photorealistic close-up inspection photograph of severe rust and paint peeling on a metal anchor bolt attached to a concrete wall of a Japanese building. Heavy rust corrosion with rust water streaks dripping down the grey concrete wall. Paint coating flaking off in large pieces revealing corroded metal underneath. Professional building inspection photo, high detail, natural daylight, 3:2 aspect ratio.",

  "Photorealistic inspection photograph of a damaged balcony waterproofing surface on a Japanese residential building. Concrete floor with deep cracks, waterproof membrane peeling off. Water puddles, moss growth, and deterioration marks visible. Metal railing in background, wall shows water stain marks. Taken from slightly elevated angle. Professional inspection photo, natural lighting, 3:2 aspect ratio.",

  "Photorealistic close-up inspection photograph of deep structural cracks in a concrete wall of a Japanese building. A main vertical crack runs through the center with branching smaller cracks. White efflorescence deposits visible along crack edges. Exposed aggregate inside the crack. High detail concrete texture, professional building inspection photography, natural lighting, 3:2 aspect ratio.",
];

async function getAccessToken(): Promise<{ token: string; method: "apikey" | "gcloud" }> {
  // 1. Google AI Studio APIキー（Cloudflare / Vercel / ローカル共通）
  if (process.env.GOOGLE_AI_API_KEY) {
    return { token: process.env.GOOGLE_AI_API_KEY, method: "apikey" };
  }

  // 2. ローカル開発: gcloud auth print-access-token
  const { execSync } = await import("child_process");
  const gcloudPaths = [
    "/opt/homebrew/bin/gcloud",
    "/usr/local/bin/gcloud",
    `${process.env.HOME}/google-cloud-sdk/bin/gcloud`,
    "gcloud",
  ];
  for (const gcloudPath of gcloudPaths) {
    try {
      const t = execSync(`${gcloudPath} auth print-access-token`, {
        encoding: "utf-8",
        timeout: 10000,
      }).trim();
      return { token: t, method: "gcloud" };
    } catch {
      continue;
    }
  }
  throw new Error("GOOGLE_AI_API_KEYを設定するか、gcloud auth loginを実行してください。");
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

  let auth: { token: string; method: "apikey" | "gcloud" };
  try {
    auth = await getAccessToken();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  try {
    let url: string;
    let headers: Record<string, string>;

    if (auth.method === "apikey") {
      // Google AI Studio (Gemini API) 経由
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${auth.token}`;
      headers = { "Content-Type": "application/json" };
    } else {
      // Vertex AI (gcloud) 経由
      const projectId = process.env.GCP_PROJECT_ID || "gen-lang-client-0618000372";
      const modelName = process.env.IMAGE_MODEL || "gemini-3.1-flash-image-preview";
      url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${modelName}:generateContent`;
      headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
    }

    const body = auth.method === "apikey"
      ? { contents: [{ parts: [{ text: DEMO_PROMPTS[index] }] }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }
      : { contents: { role: "USER", parts: [{ text: DEMO_PROMPTS[index] }] }, generationConfig: { responseModalities: ["TEXT", "IMAGE"] } };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("API error:", errText);
      return NextResponse.json({ error: "Image generation failed", detail: errText }, { status: response.status });
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json({ error: "No image in response" }, { status: 500 });
    }

    const imagePart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData);
    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: "No image data in response" }, { status: 500 });
    }

    const { mimeType, data: base64Data } = imagePart.inlineData;
    return NextResponse.json({ imageUrl: `data:${mimeType};base64,${base64Data}` });
  } catch (err) {
    console.error("Demo image generation error:", err);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
