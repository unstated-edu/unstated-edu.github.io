/**
 * Tiny HTTP server che emula la Vercel serverless function in locale.
 * Gira su :3001, webpack-dev-server fa da proxy /api → :3001
 * 
 * Avviato automaticamente da `npm run dev` tramite concurrently.
 */
require("dotenv").config();
const http = require("http");

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // CORS per dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== "POST" || req.url !== "/api/describe") {
    res.writeHead(404);
    return res.end("Not found");
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { model, prompt, imageDataUrl } = JSON.parse(body);
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey || apiKey === "sk-...") {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Metti OPENAI_API_KEY nel .env!" }));
      }

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
      const text = (
        json.output_text ||
        json?.output?.[0]?.content?.map((c) => c.text).filter(Boolean).join("") ||
        ""
      ).trim();

      res.writeHead(upstream.ok ? 200 : upstream.status, {
        "Content-Type": "application/json",
      });
      res.end(
        JSON.stringify(
          upstream.ok ? { text } : { error: json?.error?.message }
        )
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () =>
  console.log(`[dev-api] proxy OpenAI attivo su http://localhost:${PORT}`)
);
