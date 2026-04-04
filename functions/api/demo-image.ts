// Cloudflare Pages Function: /api/demo-image?index=0-3
// Google Cloud Vertex AI (サービスアカウントJWT認証) で防水・塗装デモ画像を生成

interface Env {
  GCP_SERVICE_ACCOUNT_KEY?: string;
  GCP_PROJECT_ID?: string;
  IMAGE_MODEL?: string;
}

const DEMO_PROMPTS = [
  "Photorealistic inspection photograph, taken from above, of a deteriorated rooftop waterproofing surface on a Japanese apartment building. The waterproof membrane is peeling and cracking extensively, exposing raw concrete underneath. Water puddles on the surface, rust stains near drain areas, visible damage patterns. Overcast sky with distant city buildings. Professional building inspection photo, high detail, natural lighting, 3:2 aspect ratio.",

  "Photorealistic close-up inspection photograph of severe rust and paint peeling on a metal anchor bolt attached to a concrete wall of a Japanese building. Heavy rust corrosion with rust water streaks dripping down the grey concrete wall. Paint coating flaking off in large pieces revealing corroded metal underneath. Professional building inspection photo, high detail, natural daylight, 3:2 aspect ratio.",

  "Photorealistic inspection photograph of a damaged balcony waterproofing surface on a Japanese residential building. Concrete floor with deep cracks, waterproof membrane peeling off. Water puddles, moss growth, and deterioration marks visible. Metal railing in background, wall shows water stain marks. Taken from slightly elevated angle. Professional inspection photo, natural lighting, 3:2 aspect ratio.",

  "Photorealistic close-up inspection photograph of deep structural cracks in a concrete wall of a Japanese building. A main vertical crack runs through the center with branching smaller cracks. White efflorescence deposits visible along crack edges. Exposed aggregate inside the crack. High detail concrete texture, professional building inspection photography, natural lighting, 3:2 aspect ratio.",
];

function b64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ArrayBuffer to base64url
function ab2b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// PEM private key → CryptoKey
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function getAccessToken(saKeyJson: string): Promise<string> {
  const saKey = JSON.parse(saKeyJson);
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: saKey.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const signInput = `${header}.${payload}`;
  const key = await importPrivateKey(saKey.private_key);
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signInput)
  );
  const signature = ab2b64url(signatureBuffer);
  const jwt = `${signInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Token exchange failed: ${errText}`);
  }

  const tokenData: { access_token: string } = await tokenRes.json();
  return tokenData.access_token;
}

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

  const saKey = context.env.GCP_SERVICE_ACCOUNT_KEY;
  if (!saKey) {
    return Response.json(
      { error: "GCP_SERVICE_ACCOUNT_KEY not configured" },
      { status: 500 }
    );
  }

  let token: string;
  try {
    token = await getAccessToken(saKey);
  } catch (err) {
    return Response.json(
      { error: `Auth failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  try {
    const projectId = context.env.GCP_PROJECT_ID || "gen-lang-client-0618000372";
    const modelName = context.env.IMAGE_MODEL || "gemini-3.1-flash-image-preview";
    const apiUrl = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${modelName}:generateContent`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
