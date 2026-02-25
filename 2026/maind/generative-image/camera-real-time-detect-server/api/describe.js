export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // La chiave sta SOLO qui sul server, mai nel browser
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY non configurata su Vercel" });
  }

  const { model, prompt, imageDataUrl } = req.body;

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: imageDataUrl },
            ],
          },
        ],
      }),
    });

    const json = await upstream.json();

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: json?.error?.message || `HTTP ${upstream.status}` });
    }

    const text = (
      json.output_text ||
      json?.output?.[0]?.content?.map((c) => c.text).filter(Boolean).join("") ||
      ""
    ).trim();

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
