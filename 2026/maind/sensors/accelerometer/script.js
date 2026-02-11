const phone = document.getElementById("phone");
const values = document.getElementById("values");
const enableBtn = document.getElementById("enable");
const resetBtn = document.getElementById("reset");

let listening = false;
let lastT = 0;

// smoothing
let rx = 0,
  ry = 0;

// calibration offsets (so you can define "neutral")
let offsetBeta = 0;
let offsetGamma = 0;

// remember last raw values so Reset can capture current pose
let lastBeta = 0;
let lastGamma = 0;

function applyRotation(targetX, targetY) {
  const a = 0.18; // smoothing factor
  rx = rx * (1 - a) + targetX * a;
  ry = ry * (1 - a) + targetY * a;

  // Clamp a bit so it stays readable (optional)
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const cx = clamp(rx, -80, 80);
  const cy = clamp(ry, -80, 80);

  phone.style.transform = `rotateX(${cx}deg) rotateY(${cy}deg)`;
}

function onOrientation(e) {
  lastT = performance.now();

  const beta = e.beta ?? 0; // front/back tilt
  const gamma = e.gamma ?? 0; // left/right tilt

  lastBeta = beta;
  lastGamma = gamma;

  // Apply calibration offsets
  const b = beta - offsetBeta;
  const g = gamma - offsetGamma;

  // Map directly: rotateX = beta, rotateY = gamma (invert Y for more natural feel)
  applyRotation(b, g);

  values.innerHTML =
    `beta (front/back): ${beta.toFixed(1)}°<br>` +
    `gamma (left/right): ${gamma.toFixed(1)}°<br>` +
    `center beta: ${offsetBeta.toFixed(1)}°<br>` +
    `center gamma: ${offsetGamma.toFixed(1)}°`;
}

function startListening() {
  if (listening) return;
  window.addEventListener("deviceorientation", onOrientation, true);
  listening = true;

  // Watchdog: if events stop coming in, tell you
  const tick = () => {
    if (!listening) return;
    const dt = performance.now() - lastT;
    if (lastT && dt > 1200) {
      values.innerHTML =
        "⚠️ Sensor updates stopped. Tap “Enable sensors” again.";
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function requestPermission() {
  // iOS Safari permission gate
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    const res = await DeviceOrientationEvent.requestPermission();
    if (res !== "granted") throw new Error("Permission denied");
  }
}

async function enable() {
  try {
    await requestPermission();
    startListening();
    resetBtn.disabled = false;
    enableBtn.textContent = "Sensors enabled";
  } catch (err) {
    values.textContent = "Permission denied / not available.";
    console.error(err);
  }
}

function resetCenter() {
  // Take current pose as “neutral”
  offsetBeta = lastBeta;
  offsetGamma = lastGamma;
}

// Auto-recover after tab switch / lock screen
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && listening) {
    // Re-attach to be safe (some iOS versions stall)
    window.removeEventListener("deviceorientation", onOrientation, true);
    window.addEventListener("deviceorientation", onOrientation, true);
  }
});

enableBtn.addEventListener("click", enable);
resetBtn.addEventListener("click", resetCenter);
