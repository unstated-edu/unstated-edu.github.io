const out = document.getElementById("out");
const onceBtn = document.getElementById("once");
const watchBtn = document.getElementById("watch");
const stopBtn = document.getElementById("stop");

let watchId = null;

function show(pos) {
  const { latitude, longitude, accuracy } = pos.coords;
  out.textContent =
    `lat: ${latitude}\n` +
    `lon: ${longitude}\n` +
    `accuracy: ±${Math.round(accuracy)} m\n` +
    `timestamp: ${new Date(pos.timestamp).toLocaleString()}`;
}

function showError(err) {
  out.textContent = `Error (${err.code}): ${err.message}`;
}

function getOnce() {
  if (!navigator.geolocation) {
    out.textContent = "Geolocation not supported in this browser.";
    return;
  }

  navigator.geolocation.getCurrentPosition(show, showError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });
}

function startWatch() {
  if (!navigator.geolocation) {
    out.textContent = "Geolocation not supported in this browser.";
    return;
  }

  if (watchId !== null) return;

  watchId = navigator.geolocation.watchPosition(show, showError, {
    enableHighAccuracy: true,
    maximumAge: 0,
  });

  stopBtn.disabled = false;
}

function stopWatch() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  stopBtn.disabled = true;
}

onceBtn.addEventListener("click", getOnce);
watchBtn.addEventListener("click", startWatch);
stopBtn.addEventListener("click", stopWatch);
