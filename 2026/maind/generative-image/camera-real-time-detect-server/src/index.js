
const API_KEY = process.env.OPENAI_API_KEY;

// ─── DOM helpers ────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const logEl = $("log");
const statusEl = $("status");
const video = $("video");
const canvas = $("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// ─── State ───────────────────────────────────────────────────────────────────
let stream = null;
let timer = null;
let inFlight = false;
let lastSpoken = "";
let lastRequestAt = 0;

// ─── Camera ──────────────────────────────────────────────────────────────────
$("btnStartCam").addEventListener("click", async () => {
  try {
    $("btnStartCam").disabled = true;
    setStatus("Requesting camera…");
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    video.srcObject = stream;
    await new Promise((resolve) => {
      if (video.readyState >= 2) return resolve();
      video.onloadedmetadata = resolve;
    });
    setStatus("Camera ready");
    $("btnStart").disabled = false;
  } catch (e) {
    $("btnStartCam").disabled = false;
    setStatus("Camera denied");
    logLine(`Camera error: ${e.message}`);
  }
});

// ─── Narration controls ───────────────────────────────────────────────────────
$("btnStart").addEventListener("click", () => {
  const ms = intervalMs();
  logEl.textContent = "";
  setStatus("Starting…");
  $("btnStop").disabled = false;
  $("btnStart").disabled = true;
  timer = setInterval(tick, ms);
  tick();
});

$("btnStop").addEventListener("click", () => {
  clearInterval(timer);
  timer = null;
  $("btnStart").disabled = false;
  $("btnStop").disabled = true;
  setStatus("Paused");
});

// ─── Core logic ───────────────────────────────────────────────────────────────
function intervalMs() {
  return Math.max(300, Number($("interval").value || 1000));
}

function captureFrame(quality = 0.72) {
  const w = video.videoWidth;
  const h = video.videoHeight;
  const scale = Math.min(1, 640 / w);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function describeFrame(dataUrl) {
  if (!API_KEY || API_KEY === "sk-...") {
    throw new Error("Metti la tua OPENAI_API_KEY nel file .env e rifai il build!");
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: $("model").value,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: $("prompt").value.trim() },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`);

  return (
    json.output_text ||
    json?.output?.[0]?.content?.map((c) => c.text).filter(Boolean).join("") ||
    ""
  ).trim();
}

async function tick() {
  const now = Date.now();
  if (inFlight) return;
  if (now - lastRequestAt < intervalMs() * 0.75) return;
  lastRequestAt = now;

  const dataUrl = captureFrame();
  inFlight = true;
  setStatus("Thinking…");

  try {
    const text = await describeFrame(dataUrl);
    setStatus("Live");
    logLine(`[${new Date().toLocaleTimeString()}] ${text}`);
    speak(text);
  } catch (err) {
    setStatus("Error");
    logLine(`Error: ${err.message}`);
  } finally {
    inFlight = false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setStatus(text) {
  statusEl.textContent = text;
}

function logLine(text) {
  logEl.textContent += text + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

function speak(text) {
  if (!$("speak").checked) return;
  if (!("speechSynthesis" in window)) return;
  if (text.trim() === lastSpoken.trim()) return;
  lastSpoken = text;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 1.05;
  window.speechSynthesis.speak(u);
}

window.addEventListener("beforeunload", () => {
  clearInterval(timer);
  stream?.getTracks().forEach((t) => t.stop());
});
