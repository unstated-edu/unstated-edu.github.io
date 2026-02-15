 // Get DOM elements
 const video = document.getElementById("webcam");
 const canvas = document.getElementById("canvas");
 const ctx = canvas.getContext("2d");
 const status = document.getElementById("status");
 const startBtn = document.getElementById("startBtn");
 const handList = document.getElementById("handList");
 const toggleNumbers = document.getElementById("toggleNumbers");

 let detector = null;
 let isDetecting = false;
 let showNumbers = true;

 // Colors for different hands
 const handColors = [
   "#FF0000", // Red
   "#00FF00", // Green
   "#0088FF", // Blue
   "#FF00FF", // Magenta
   "#FFFF00", // Yellow
   "#00FFFF", // Cyan
 ];

 // Hand landmark connections (finger bones)
 const HAND_CONNECTIONS = [
   // Thumb
   [0, 1],
   [1, 2],
   [2, 3],
   [3, 4],
   // Index finger
   [0, 5],
   [5, 6],
   [6, 7],
   [7, 8],
   // Middle finger
   [0, 9],
   [9, 10],
   [10, 11],
   [11, 12],
   // Ring finger
   [0, 13],
   [13, 14],
   [14, 15],
   [15, 16],
   // Pinky
   [0, 17],
   [17, 18],
   [18, 19],
   [19, 20],
 ];

 // Finger names for each landmark
 const LANDMARK_NAMES = [
   "Wrist",
   "Thumb CMC",
   "Thumb MCP",
   "Thumb IP",
   "Thumb Tip",
   "Index MCP",
   "Index PIP",
   "Index DIP",
   "Index Tip",
   "Middle MCP",
   "Middle PIP",
   "Middle DIP",
   "Middle Tip",
   "Ring MCP",
   "Ring PIP",
   "Ring DIP",
   "Ring Tip",
   "Pinky MCP",
   "Pinky PIP",
   "Pinky DIP",
   "Pinky Tip",
 ];

 // Load the Hand Detection model
 async function loadModel() {
   try {
     status.textContent = "Loading hand detection model...";

     await tf.setBackend("webgl");
     await tf.ready();

     detector = await handPoseDetection.createDetector(
       handPoseDetection.SupportedModels.MediaPipeHands,
       {
         runtime: "mediapipe",
         solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
         modelType: "full",
         maxHands: 4,
       },
     );

     status.textContent = "Model loaded! Click 'Start Camera'";
     startBtn.disabled = false;
     console.log("Hand detection model loaded successfully!");
   } catch (error) {
     status.textContent = "Error loading model: " + error.message;
     console.error(error);
   }
 }

 // Start the webcam
 async function startCamera() {
   try {
     const stream = await navigator.mediaDevices.getUserMedia({
       video: {
         width: { ideal: 480 },
         height: { ideal: 360 },
         facingMode: "user",
       },
     });
     video.srcObject = stream;

     video.addEventListener("loadeddata", () => {
       // Force canvas to match EXACT video dimensions
       const videoWidth = video.videoWidth;
       const videoHeight = video.videoHeight;

       canvas.width = videoWidth;
       canvas.height = videoHeight;

       // Also update the display size
       video.width = videoWidth;
       video.height = videoHeight;

       console.log(`Video dimensions: ${videoWidth}x${videoHeight}`);

       status.textContent = "Detecting hands...";
       startBtn.textContent = "Camera Running";
       startBtn.disabled = true;
       detectHands();
     });
   } catch (error) {
     status.textContent = "Error accessing camera: " + error.message;
     console.error(error);
   }
 }

 // Draw hand landmarks
 function drawHandLandmarks(keypoints, color) {
   // Draw all keypoints with numbers
   keypoints.forEach((point, index) => {
     // Draw the point
     ctx.beginPath();
     ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
     ctx.fillStyle = color;
     ctx.fill();
     ctx.strokeStyle = "#FFFFFF";
     ctx.lineWidth = 2;
     ctx.stroke();

     // Draw the number next to the point (if enabled)
     if (showNumbers) {
       ctx.fillStyle = color;
       ctx.font = "10px Arial";
       ctx.fillText(index, point.x + 8, point.y - 8);
     }
   });

   // Draw hand skeleton connections
   ctx.strokeStyle = color;
   ctx.lineWidth = 3;

   HAND_CONNECTIONS.forEach(([start, end]) => {
     const startPoint = keypoints[start];
     const endPoint = keypoints[end];

     ctx.beginPath();
     ctx.moveTo(startPoint.x, startPoint.y);
     ctx.lineTo(endPoint.x, endPoint.y);
     ctx.stroke();
   });
 }

 // Draw bounding box around hand
 function drawBoundingBox(keypoints, color, handedness) {
   const xs = keypoints.map((p) => p.x);
   const ys = keypoints.map((p) => p.y);

   const minX = Math.min(...xs);
   const maxX = Math.max(...xs);
   const minY = Math.min(...ys);
   const maxY = Math.max(...ys);

   ctx.strokeStyle = color;
   ctx.lineWidth = 3;
   ctx.strokeRect(
     minX - 10,
     minY - 10,
     maxX - minX + 20,
     maxY - minY + 20,
   );

   // Draw hand label
   ctx.fillStyle = color;
   ctx.font = "bold 16px Arial";
   ctx.fillText(handedness, minX - 10, minY - 15);
 }

 // Main hand detection loop
 async function detectHands() {
   if (!detector) return;

   isDetecting = true;

   // Detect hands
   const hands = await detector.estimateHands(video, {
     flipHorizontal: false,
   });

   // Clear canvas
   ctx.clearRect(0, 0, canvas.width, canvas.height);

   // Draw each hand with different color
   let infoHTML = "";

   if (hands.length > 0) {
     infoHTML = `<div style="margin-bottom: 10px;"><strong>Tracking ${hands.length} hand(s)</strong></div>`;

     hands.forEach((hand, index) => {
       const color = handColors[index % handColors.length];
       const handedness = hand.handedness || "Unknown";

       // Draw bounding box
       drawBoundingBox(hand.keypoints, color, handedness);

       // Draw hand landmarks
       drawHandLandmarks(hand.keypoints, color);

       // Add info for this hand
       const confidence = hand.score
         ? `${(hand.score * 100).toFixed(1)}%`
         : "High confidence";

       infoHTML += `<div class="hand-info" style="border-color: ${color};">`;
       infoHTML += `<strong>${handedness} Hand</strong> (${hand.keypoints.length} landmarks)<br>`;
       infoHTML += `<div style="margin: 5px 0;">`;
       infoHTML += `<span class="landmark-info">Detection: ${confidence}</span>`;
       infoHTML += `</div>`;
       infoHTML += `<div style="margin: 5px 0;">`;
       infoHTML += `<span class="landmark-info">✓ Thumb (5)</span>`;
       infoHTML += `<span class="landmark-info">✓ Index (4)</span>`;
       infoHTML += `<span class="landmark-info">✓ Middle (4)</span>`;
       infoHTML += `<span class="landmark-info">✓ Ring (4)</span>`;
       infoHTML += `<span class="landmark-info">✓ Pinky (4)</span>`;
       infoHTML += `</div>`;

       // Show key landmarks
       if (showNumbers) {
         infoHTML += `<div style="margin: 5px 0; font-size: 11px;">`;
         infoHTML += `<em>Key points:</em> `;
         [0, 4, 8, 12, 16, 20].forEach((idx) => {
           infoHTML += `<span class="landmark-info">${idx}: ${LANDMARK_NAMES[idx]}</span>`;
         });
         infoHTML += `</div>`;
       }

       infoHTML += `</div>`;
     });
   } else {
     infoHTML =
       "<div>No hands detected - show your hands to the camera!</div>";
   }

   handList.innerHTML = infoHTML;

   // Continue detection loop
   if (isDetecting) {
     requestAnimationFrame(detectHands);
   }
 }

 // Event listeners
 startBtn.addEventListener("click", startCamera);

 toggleNumbers.addEventListener("click", () => {
   showNumbers = !showNumbers;
   toggleNumbers.textContent = showNumbers
     ? "Hide Numbers"
     : "Show Numbers";
 });

 // Load model when page loads
 loadModel();