const out = document.getElementById("out");

async function initBattery() {
  if (!navigator.getBattery) {
    out.textContent =
      "Battery API not supported in this browser (common on iOS Safari).";
    return;
  }

  const battery = await navigator.getBattery();

  function render() {
    const level = Math.round(battery.level * 100);
    const charging = battery.charging ? "yes" : "no";

    const chargingTime =
      battery.chargingTime === Infinity
        ? "—"
        : `${Math.round(battery.chargingTime / 60)} min`;

    const dischargingTime =
      battery.dischargingTime === Infinity
        ? "—"
        : `${Math.round(battery.dischargingTime / 60)} min`;

    out.innerHTML =
      `level: ${level}%<br/>` +
      `charging: ${charging}<br/>` +
      `chargingTime: ${chargingTime}<br/>` +
      `dischargingTime: ${dischargingTime}`;
  }

  // initial render
  render();

  // live updates
  battery.addEventListener("levelchange", render);
  battery.addEventListener("chargingchange", render);
  battery.addEventListener("chargingtimechange", render);
  battery.addEventListener("dischargingtimechange", render);
}

initBattery();
