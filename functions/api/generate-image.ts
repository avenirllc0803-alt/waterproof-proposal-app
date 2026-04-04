interface Env {
  GOOGLE_AI_API_KEY?: string;
  NEXT_PUBLIC_GOOGLE_AI_API_KEY?: string;
}

interface ImageRequest {
  prompt: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// デバッグ用エラーログ
const errors: string[] = [];

// Imagen API（高品質写実画像）
async function generateWithImagen(
  prompt: string,
  apiKey: string
): Promise<string | null> {
  const models = ["imagen-4.0-generate-001", "imagen-4.0-fast-generate-001"];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: "3:2",
              personGeneration: "dont_allow",
            },
          }),
        }
      );
      if (!res.ok) {
        const body = await res.text();
        errors.push(`Imagen ${model}: ${res.status} ${body.slice(0, 200)}`);
        continue;
      }
      const data = await res.json();
      if (data.predictions?.[0]?.bytesBase64Encoded) {
        return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
      }
      errors.push(`Imagen ${model}: no image in response`);
    } catch (e) {
      errors.push(`Imagen ${model}: ${String(e)}`);
    }
  }
  return null;
}

// Gemini Native Image（フォールバック）
async function generateWithGemini(
  prompt: string,
  apiKey: string
): Promise<string | null> {
  const models = [
    "gemini-2.0-flash-preview-image-generation",
    "gemini-2.0-flash-exp",
  ];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        }
      );
      if (!res.ok) {
        const body = await res.text();
        errors.push(`Gemini ${model}: ${res.status} ${body.slice(0, 200)}`);
        continue;
      }
      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts;
      const img = parts?.find(
        (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
      );
      if (img?.inlineData) {
        return `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`;
      }
      errors.push(`Gemini ${model}: no image in response`);
    } catch (e) {
      errors.push(`Gemini ${model}: ${String(e)}`);
    }
  }
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey =
    context.env.GOOGLE_AI_API_KEY ||
    context.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ||
    "";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const { prompt } = (await context.request.json()) as ImageRequest;
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // APIキーの先頭4文字をデバッグ用に記録
    errors.length = 0;
    errors.push(`apiKey: ${apiKey.slice(0, 4)}...（${apiKey.length}文字）`);

    // Imagen → Gemini フォールバック
    const result =
      (await generateWithImagen(prompt, apiKey)) ||
      (await generateWithGemini(prompt, apiKey));

    if (result) {
      return new Response(
        JSON.stringify({ image: result }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Image generation failed", details: errors }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: [...errors, String(e)] }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
