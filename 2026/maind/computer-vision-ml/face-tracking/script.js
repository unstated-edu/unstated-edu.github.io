 // Get DOM elements
 const video = document.getElementById("webcam");
 const canvas = document.getElementById("canvas");
 const ctx = canvas.getContext("2d");
 const status = document.getElementById("status");
 const startBtn = document.getElementById("startBtn");
 const faceList = document.getElementById("faceList");
 const toggleNumbers = document.getElementById("toggleNumbers");

 let detector = null;
 let isDetecting = false;
 let showNumbers = true;  // Toggle for showing numbers

 // Colors for different faces
 const faceColors = [
     "#FF0000",  // Red
     "#00FF00",  // Green
     "#0088FF",  // Blue
     "#FF00FF",  // Magenta
     "#FFFF00",  // Yellow
     "#00FFFF"   // Cyan
 ];

 // Facial feature regions (indices for specific landmarks)
 const FACE_REGIONS = {
     leftEye: [33, 133, 160, 159, 158, 157, 173, 155, 154, 153, 145, 144, 163, 7],
     rightEye: [362, 263, 387, 386, 385, 384, 398, 382, 381, 380, 374, 373, 390, 249],
     lips: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
     leftEyebrow: [70, 63, 105, 66, 107, 55, 65],
     rightEyebrow: [336, 296, 334, 293, 300, 285, 295],
     nose: [1, 2, 98, 327, 168]
 };

 // Load the Face Landmarks Detection model
 async function loadModel() {
     try {
         status.textContent = "Loading face detection model...";
         
         await tf.setBackend('webgl');
         await tf.ready();
         
         detector = await faceLandmarksDetection.createDetector(
             faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
             {
                 runtime: 'mediapipe',
                 solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                 refineLandmarks: true,
                 maxFaces: 5
             }
         );
         
         status.textContent = "Model loaded! Click 'Start Camera'";
         startBtn.disabled = false;
         console.log("Face detection model loaded successfully!");
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
                 facingMode: "user"
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
             
             status.textContent = "Detecting faces...";
             startBtn.textContent = "Camera Running";
             startBtn.disabled = true;
             detectFaces();
         });
     } catch (error) {
         status.textContent = "Error accessing camera: " + error.message;
         console.error(error);
     }
 }

 // Draw facial landmarks
 function drawFaceLandmarks(keypoints, color) {
     // Draw all keypoints with numbers
     keypoints.forEach((point, index) => {
         // Draw the point
         ctx.beginPath();
         ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
         ctx.fillStyle = color;
         ctx.fill();
         
         // Draw the number next to the point (if enabled)
         if (showNumbers) {
             ctx.fillStyle = color;
             ctx.font = '8px Arial';
             ctx.fillText(index, point.x + 3, point.y - 3);
         }
     });

     // Draw face mesh connections
     ctx.strokeStyle = color;
     ctx.lineWidth = 1;

     // Draw eyes
     drawRegion(keypoints, FACE_REGIONS.leftEye, color);
     drawRegion(keypoints, FACE_REGIONS.rightEye, color);

     // Draw lips
     drawRegion(keypoints, FACE_REGIONS.lips, color);

     // Draw eyebrows
     drawRegion(keypoints, FACE_REGIONS.leftEyebrow, color);
     drawRegion(keypoints, FACE_REGIONS.rightEyebrow, color);

     // Draw nose
     drawRegion(keypoints, FACE_REGIONS.nose, color);
 }

 // Draw a specific facial region
 function drawRegion(keypoints, indices, color) {
     if (indices.length < 2) return;

     ctx.beginPath();
     ctx.strokeStyle = color;
     ctx.lineWidth = 2;

     for (let i = 0; i < indices.length; i++) {
         const point = keypoints[indices[i]];
         if (i === 0) {
             ctx.moveTo(point.x, point.y);
         } else {
             ctx.lineTo(point.x, point.y);
         }
     }
     ctx.closePath();
     ctx.stroke();
 }

 // Draw bounding box around face
 function drawBoundingBox(keypoints, color) {
     const xs = keypoints.map(p => p.x);
     const ys = keypoints.map(p => p.y);
     
     const minX = Math.min(...xs);
     const maxX = Math.max(...xs);
     const minY = Math.min(...ys);
     const maxY = Math.max(...ys);
     
     ctx.strokeStyle = color;
     ctx.lineWidth = 3;
     ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
 }

 // Main face detection loop
 async function detectFaces() {
     if (!detector) return;

     isDetecting = true;

     // Detect faces
     const faces = await detector.estimateFaces(video, {
         flipHorizontal: false
     });

     // Clear canvas
     ctx.clearRect(0, 0, canvas.width, canvas.height);

     // Draw each face with different color
     let infoHTML = "";

     if (faces.length > 0) {
         infoHTML = `<div style="margin-bottom: 10px;"><strong>Tracking ${faces.length} face(s)</strong></div>`;

         faces.forEach((face, index) => {
             const color = faceColors[index % faceColors.length];
             
             // Draw bounding box
             drawBoundingBox(face.keypoints, color);
             
             // Draw facial landmarks
             drawFaceLandmarks(face.keypoints, color);

             // Add info for this face
             const confidence = face.box ? 
                 `${(face.box.probability * 100).toFixed(1)}%` : 
                 "High confidence";

             infoHTML += `<div class="face-info" style="border-color: ${color};">`;
             infoHTML += `<strong>Face ${index + 1}</strong><br>`;
             infoHTML += `<div style="margin: 5px 0;">`;
             infoHTML += `<span class="feature-info">✓ Left Eye</span>`;
             infoHTML += `<span class="feature-info">✓ Right Eye</span>`;
             infoHTML += `<span class="feature-info">✓ Nose</span>`;
             infoHTML += `<span class="feature-info">✓ Mouth</span>`;
             infoHTML += `<span class="feature-info">✓ Eyebrows</span>`;
             infoHTML += `<span class="feature-info">✓ Face Contour</span>`;
             infoHTML += `</div>`;
             infoHTML += `</div>`;
         });
     } else {
         infoHTML = "<div>No faces detected - look at the camera!</div>";
     }

     faceList.innerHTML = infoHTML;

     // Continue detection loop
     if (isDetecting) {
         requestAnimationFrame(detectFaces);
     }
 }

 // Event listeners
 startBtn.addEventListener("click", startCamera);
 
 toggleNumbers.addEventListener("click", () => {
     showNumbers = !showNumbers;
     toggleNumbers.textContent = showNumbers ? "Hide Numbers" : "Show Numbers";
 });

 // Load model when page loads
 loadModel();