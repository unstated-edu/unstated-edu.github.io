const vals = document.getElementById("vals");
const btn = document.getElementById("start");

function onMotion(e) {
  // Prefer "accelerationIncludingGravity" (more widely available)
  const a = e.accelerationIncludingGravity || e.acceleration;

  if (!a) {
    vals.innerHTML = "No accelerometer data available.";
    return;
  }

  const x = (a.x ?? 0).toFixed(2);
  const y = (a.y ?? 0).toFixed(2);
  const z = (a.z ?? 0).toFixed(2);

  vals.innerHTML = `x: ${x}<br/>y: ${y}<br/>z: ${z}`;
}

async function start() {
  // iOS (Safari) requires permission via user gesture
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    const res = await DeviceMotionEvent.requestPermission();
    if (res !== "granted") {
      vals.innerHTML = "Permission denied.";
      return;
    }
  }

  window.addEventListener("devicemotion", onMotion);
  btn.disabled = true;
  btn.textContent = "Motion enabled";
}

btn.addEventListener("click", start);
