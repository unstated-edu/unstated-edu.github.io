// Elements
const video = document.getElementById("video");
const captureButton = document.getElementById("capture");
const saveButton = document.getElementById("save");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const filters = document.querySelectorAll(".filters button");
let currentFilter = "none";

// Start camera
startCamera();

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    video.srcObject = stream;
  } catch (err) {
    console.error("Error accessing camera:", err);
  }
}
// start camera
startCamera();

// Filters buttons
filters.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    video.style.filter = currentFilter;
  });
});

// Capture
captureButton.addEventListener("click", () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0);
  saveButton.style.visibility = "visible";
});

// Save image
saveButton.addEventListener("click", () => {
  const image = canvas.toDataURL("image/jpeg", 0.9);
  const link = document.createElement("a");
  link.href = image;
  link.download = "photo.jpg";
  link.click();
});
