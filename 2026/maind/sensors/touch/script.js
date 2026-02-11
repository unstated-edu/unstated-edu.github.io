const info = document.getElementById("info");
const area = document.getElementById("area");

function update(e) {
  // prevent page scrolling while touching
  e.preventDefault();

  const t = e.touches; // all current touches on the screen
  let text = `fingers: ${t.length}<br />`;

  for (let i = 0; i < t.length; i++) {
    text += `#${i + 1}: x=${Math.round(t[i].clientX)} y=${Math.round(t[i].clientY)}<br />`;
  }

  info.innerHTML = text.trim();
}

function end() {
  info.innerHTML = "fingers: 0";
}

area.addEventListener("touchstart", update, { passive: false });
area.addEventListener("touchmove", update, { passive: false });
area.addEventListener("touchend", update, { passive: false });
area.addEventListener("touchcancel", end, { passive: false });
