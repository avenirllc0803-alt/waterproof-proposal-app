// Cloudflare Pages Function: /api/demo-image?index=0-3
// Google AI Studio APIキーで防水・塗装デモ画像を生成

interface Env {
  GOOGLE_AI_API_KEY?: string;
}

const DEMO_PROMPTS = [
  "Photorealistic inspection photograph, taken from above, of a deteriorated rooftop waterproofing surface on a Japanese apartment building. The waterproof membrane is peeling and cracking extensively, exposing raw concrete underneath. Water puddles on the surface, rust stains near drain areas, visible damage patterns. Overcast sky with distant city buildings. Professional building inspection photo, high detail, natural lighting, 3:2 aspect ratio.",

  "Photorealistic close-up inspection photograph of severe rust and paint peeling on a metal anchor bolt attached to a concrete wall of a Japanese building. Heavy rust corrosion with rust water streaks dripping down the grey concrete wall. Paint coating flaking off in large pieces revealing corroded metal underneath. Professional building inspection photo, high detail, natural daylight, 3:2 aspect ratio.",

  "Photorealistic inspection photograph of a damaged balcony waterproofing surface on a Japanese residential building. Concrete floor with deep cracks, waterproof membrane peeling off. Water puddles, moss growth, and deterioration marks visible. Metal railing in background, wall shows water stain marks. Taken from slightly elevated angle. Professional inspection photo, natural lighting, 3:2 aspect ratio.",

  "Photorealistic close-up inspection photograph of deep structural cracks in a concrete wall of a Japanese building. A main vertical crack runs through the center with branching smaller cracks. White efflorescence deposits visible along crack edges. Exposed aggregate inside the crack. High detail concrete texture, professional building inspection photography, natural lighting, 3:2 aspect ratio.",
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const indexStr = url.searchParams.get("index");

  if (indexStr === null || isNaN(Number(indexStr))) {
    return Response.json({ error: "index parameter required" }, { status: 400 });
  }

  const index = Number(indexStr);
  if (index < 0 || index >= DEMO_PROMPTS.length) {
    return Response.json({ error: "index out of range (0-3)" }, { status: 400 });
  }

  const apiKey = context.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_AI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: DEMO_PROMPTS[index] }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google AI API error:", errText);
      return Response.json(
        { error: "Image generation failed", detail: errText },
        { status: response.status }
      );
    }

    const data: {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { mimeType: string; data: string };
            text?: string;
          }>;
        };
      }>;
    } = await response.json();

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) {
      return Response.json({ error: "No image in response" }, { status: 500 });
    }

    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      return Response.json({ error: "No image data in response" }, { status: 500 });
    }

    const { mimeType, data: base64Data } = imagePart.inlineData;
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return Response.json({ imageUrl: dataUrl });
  } catch (err) {
    console.error("Demo image generation error:", err);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
};
