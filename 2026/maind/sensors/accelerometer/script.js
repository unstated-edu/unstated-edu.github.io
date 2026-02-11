const phone = document.getElementById("phone");
  const values = document.getElementById("values");
  const btn = document.getElementById("start");

  function handleOrientation(event) {
    const alpha = event.alpha || 0; // compass
    const beta = event.beta || 0;   // front/back tilt
    const gamma = event.gamma || 0; // left/right tilt

    // Rotate 3D phone
    phone.style.transform = `
      rotateX(${beta}deg)
      rotateY(${gamma}deg)
      rotateZ(${alpha}deg)
    `;

    values.innerHTML = `
      alpha: ${alpha.toFixed(1)}<br>
      beta: ${beta.toFixed(1)}<br>
      gamma: ${gamma.toFixed(1)}
    `;
  }

  async function start() {
    // iOS requires permission
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") return;
    }

    window.addEventListener("deviceorientation", handleOrientation);
    btn.style.display = "none";
  }

  btn.addEventListener("click", start);