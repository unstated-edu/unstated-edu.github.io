const needle = document.getElementById("needle");
  const value = document.getElementById("value");
  const btn = document.getElementById("start");

  let smoothHeading = null;

  // Smooth circular angles (handles wrap-around at 0/360)
  // make the needle move smoothly
  function smoothAngle(prev, next, factor) {
    // shortest angular difference (-180..180)
    let delta = ((next - prev + 540) % 360) - 180;
    return (prev + delta * factor + 360) % 360;
  }

  // get the heading from the event ALPHA (device orientation)
  function getHeading(event) {
    // iOS real compass heading
    if (event.webkitCompassHeading !== undefined && event.webkitCompassAccuracy !== -1) {
      return event.webkitCompassHeading;
    }
    // Android / others (alpha is clockwise from device)
    if (event.alpha != null) return (360 - event.alpha) % 360;
    return null;
  }

  // update the compass
  function onOrientation(event) {
    const heading = getHeading(event);
    if (heading == null) return;

    if (smoothHeading == null) smoothHeading = heading;

    // smoothing factor: 0.05 = very smooth, 0.2 = more responsive
    smoothHeading = smoothAngle(smoothHeading, heading, 0.12);

    needle.style.transform = `rotate(${smoothHeading}deg)`;
    value.textContent = `Heading: ${smoothHeading.toFixed(1)}°`;
  }


  // start the compass
  async function start() {
    // iOS permission gate
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") return;
    }

    window.addEventListener("deviceorientation", onOrientation, true);
    btn.style.display = "none";
  }

  btn.addEventListener("click", start);