// Nessuna chiave API qui! Il frontend chiama /api/describe
// che è la serverless function su Vercel (o il dev-api.js in locale).

const $ = (id) => document.getElementById(id);
const logEl = $("log");
const statusEl = $("status");
const video = $("video");
const canvas = $("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

let stream = null;
let timer = null;
let inFlight = false;
let lastSpoken = "";
let lastRequestAt = 0;

// ─── Camera ───────────────────────────────────────────────────────────────────
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

// ─── Controls ─────────────────────────────────────────────────────────────────
$("btnStart").addEventListener("click", () => {
  logEl.textContent = "";
  setStatus("Starting…");
  $("btnStop").disabled = false;
  $("btnStart").disabled = true;
  timer = setInterval(tick, intervalMs());
  tick();
});

$("btnStop").addEventListener("click", () => {
  clearInterval(timer);
  timer = null;
  $("btnStart").disabled = false;
  $("btnStop").disabled = true;
  setStatus("Paused");
});

// ─── Core ─────────────────────────────────────────────────────────────────────
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

async function describeFrame(imageDataUrl) {
  // Chiama la serverless function — stessa origine, niente CORS
  const res = await fetch("/api/describe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: $("model").value,
      prompt: $("prompt").value.trim(),
      imageDataUrl,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json.text;
}

async function tick() {
  const now = Date.now();
  if (inFlight) return;
  if (now - lastRequestAt < intervalMs() * 0.75) return;
  lastRequestAt = now;

  const imageDataUrl = captureFrame();
  inFlight = true;
  setStatus("Thinking…");

  try {
    const text = await describeFrame(imageDataUrl);
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
function setStatus(t) { statusEl.textContent = t; }

function logLine(t) {
  logEl.textContent += t + "\n";
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
