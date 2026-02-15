 // Get DOM elements
 const video = document.getElementById("webcam");
 const canvas = document.getElementById("canvas");
 const ctx = canvas.getContext("2d");
 const status = document.getElementById("status");
 const startBtn = document.getElementById("startBtn");
 const keypointList = document.getElementById("keypointList");

 let model = null;
 let isDetecting = false;

 // Define body part connections for skeleton (including facial features)
 const connections = [
     // Face connections
     ["nose", "leftEye"],
     ["nose", "rightEye"],
     ["leftEye", "leftEar"],
     ["rightEye", "rightEar"],
     
     // Torso
     ["leftShoulder", "rightShoulder"],
     ["leftShoulder", "leftElbow"],
     ["leftElbow", "leftWrist"],
     ["rightShoulder", "rightElbow"],
     ["rightElbow", "rightWrist"],
     
     // Neck to shoulders
     ["nose", "leftShoulder"],
     ["nose", "rightShoulder"],
     
     // Spine
     ["leftShoulder", "leftHip"],
     ["rightShoulder", "rightHip"],
     ["leftHip", "rightHip"],
     
     // Legs
     ["leftHip", "leftKnee"],
     ["leftKnee", "leftAnkle"],
     ["rightHip", "rightKnee"],
     ["rightKnee", "rightAnkle"]
 ];

 // Colors for different people
 const personColors = [
     { skeleton: "#00FF00", keypoint: "#FF0000" },  // Green/Red
     { skeleton: "#0088FF", keypoint: "#FF8800" },  // Blue/Orange
     { skeleton: "#FF00FF", keypoint: "#FFFF00" },  // Magenta/Yellow
     { skeleton: "#00FFFF", keypoint: "#FF0088" },  // Cyan/Pink
     { skeleton: "#88FF00", keypoint: "#8800FF" }   // Lime/Purple
 ];

 // Load the PoseNet model
 async function loadModel() {
     try {
         status.textContent = "Loading pose detection model...";
         model = await posenet.load({
             architecture: "MobileNetV1",
             outputStride: 16,
             inputResolution: { width: 640, height: 480 },
             multiplier: 0.75,
         });
         status.textContent = "Model loaded! Click 'Start Camera'";
         startBtn.disabled = false;
         console.log("PoseNet model loaded successfully!");
     } catch (error) {
         status.textContent = "Error loading model: " + error.message;
         console.error(error);
     }
 }

 // Start the webcam
 async function startCamera() {
     try {
         const stream = await navigator.mediaDevices.getUserMedia({
             video: { width: 640, height: 480 },
         });
         video.srcObject = stream;

         video.addEventListener("loadeddata", () => {
             status.textContent = "Tracking bodies...";
             startBtn.textContent = "Camera Running";
             startBtn.disabled = true;
             detectPose();
         });
     } catch (error) {
         status.textContent = "Error accessing camera: " + error.message;
         console.error(error);
     }
 }

 // Draw a keypoint (body part) with specific color
 function drawKeypoint(keypoint, color) {
     const { y, x, score } = keypoint;
     if (score > 0.5) {  // Increased threshold for better accuracy
         ctx.beginPath();
         ctx.arc(x, y, 8, 0, 2 * Math.PI);
         ctx.fillStyle = color;
         ctx.fill();
         ctx.strokeStyle = "#FFFFFF";
         ctx.lineWidth = 2;
         ctx.stroke();
     }
 }

 // Draw skeleton connections for one person with specific color
 function drawSkeleton(keypoints, color) {
     const keypointMap = {};
     keypoints.forEach((keypoint) => {
         keypointMap[keypoint.part] = keypoint;
     });

     connections.forEach(([part1, part2]) => {
         const kp1 = keypointMap[part1];
         const kp2 = keypointMap[part2];

         if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {  // Increased threshold
             ctx.beginPath();
             ctx.moveTo(kp1.position.x, kp1.position.y);
             ctx.lineTo(kp2.position.x, kp2.position.y);
             ctx.strokeStyle = color;
             ctx.lineWidth = 3;
             ctx.stroke();
         }
     });
 }

 // Main pose detection loop
 async function detectPose() {
     if (!model) return;

     isDetecting = true;

     // Estimate multiple poses (up to 5 people)
     const allPoses = await model.estimateMultiplePoses(video, {
         flipHorizontal: false,
         maxDetections: 5,
         scoreThreshold: 0.5,  // Increased from 0.3 to reduce false positives
         nmsRadius:50  // Increased to better separate people
     });
     
     // Filter out weak detections - require at least 8 keypoints with good confidence
     const poses = allPoses.filter(pose => {
         const goodKeypoints = pose.keypoints.filter(kp => kp.score > 0.5).length;
         return goodKeypoints >= 8;  // At least 8 strong keypoints to be considered a person
     });

     // Clear canvas
     ctx.clearRect(0, 0, canvas.width, canvas.height);

     // Draw each person with a different color
     let infoHTML = "";
     
     if (poses.length > 0) {
         infoHTML = `<div style="margin-bottom: 10px;"><strong>Tracking ${poses.length} person(s)</strong></div>`;
         
         poses.forEach((pose, index) => {
             const colors = personColors[index % personColors.length];
             
             // Draw skeleton for this person
             drawSkeleton(pose.keypoints, colors.skeleton);
             
             // Draw keypoints for this person
             pose.keypoints.forEach((keypoint) => {
                 drawKeypoint(keypoint, colors.keypoint);
             });
             
             // Add info for this person
             let visibleKeypoints = pose.keypoints.filter((kp) => kp.score > 0.5);  // Increased threshold
             infoHTML += `<div class="person-info" style="border-color: ${colors.skeleton};">`;
             infoHTML += `<strong>Person ${index + 1}</strong> (${visibleKeypoints.length} keypoints detected)<br>`;
             
             // Group keypoints by category
             const facePoints = visibleKeypoints.filter(kp => 
                 ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'].includes(kp.part)
             );
             const bodyPoints = visibleKeypoints.filter(kp => 
                 !['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'].includes(kp.part)
             );
             
             if (facePoints.length > 0) {
                 infoHTML += '<div style="margin: 5px 0;"><em>Face:</em> ';
                 facePoints.forEach((keypoint) => {
                     const confidence = (keypoint.score * 100).toFixed(0);
                     infoHTML += `<span class="keypoint-info">${keypoint.part}: ${confidence}%</span>`;
                 });
                 infoHTML += '</div>';
             }
             
             if (bodyPoints.length > 0) {
                 infoHTML += '<div style="margin: 5px 0;"><em>Body:</em> ';
                 bodyPoints.forEach((keypoint) => {
                     const confidence = (keypoint.score * 100).toFixed(0);
                     infoHTML += `<span class="keypoint-info">${keypoint.part}: ${confidence}%</span>`;
                 });
                 infoHTML += '</div>';
             }
             
             infoHTML += `</div>`;
         });
     } else {
         infoHTML = "<div>No people detected - step into frame!</div>";
     }

     keypointList.innerHTML = infoHTML;

     // Continue detection loop
     if (isDetecting) {
         requestAnimationFrame(detectPose);
     }
 }

 // Event listeners
 startBtn.addEventListener("click", startCamera);

 // Load model when page loads
 loadModel();