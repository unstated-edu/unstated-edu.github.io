const needle = document.getElementById("needle");
const value = document.getElementById("value");
const btn = document.getElementById("start");

let currentHeading = 0;

function handleOrientation(event) {
  // iOS Safari specific compass value
  let heading;

  if (event.webkitCompassHeading !== undefined) {
    heading = event.webkitCompassHeading; // iOS
  } else {
    heading = 360 - event.alpha; // Android
  }

  if (heading == null) return;

  currentHeading = heading;

  needle.style.transform = `rotate(${heading}deg)`;
  value.textContent = `Heading: ${heading.toFixed(1)}°`;
}

async function start() {
  // iOS permission
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission !== "granted") return;
  }

  window.addEventListener("deviceorientation", handleOrientation, true);
  btn.style.display = "none";
}

btn.addEventListener("click", start);
