 // Get DOM elements
 const video = document.getElementById('webcam');
 const canvas = document.getElementById('canvas');
 const ctx = canvas.getContext('2d');
 const status = document.getElementById('status');
 const startBtn = document.getElementById('startBtn');
 const detectionList = document.getElementById('detectionList');
 
 let model = null;
 let isDetecting = false;

 // Load the COCO-SSD model
 async function loadModel() {
     try {
         status.textContent = 'Loading AI model...';
         model = await cocoSsd.load();
         status.textContent = 'Model loaded! Click "Start Camera" to begin';
         startBtn.disabled = false;
         console.log('Model loaded successfully!');
     } catch (error) {
         status.textContent = 'Error loading model: ' + error.message;
         console.error(error);
     }
 }

 // Start the webcam
 async function startCamera() {
     try {
         const stream = await navigator.mediaDevices.getUserMedia({ 
             video: { width: 640, height: 480 } 
         });
         video.srcObject = stream;
         
         video.addEventListener('loadeddata', () => {
             status.textContent = 'Camera ready! Detecting objects...';
             startBtn.textContent = 'Camera Running';
             startBtn.disabled = true;
             detectObjects();
         });
     } catch (error) {
         status.textContent = 'Error accessing camera: ' + error.message;
         console.error(error);
     }
 }

 // Main detection loop
 async function detectObjects() {
     if (!model) return;
     
     isDetecting = true;
     
     // Perform detection
     const predictions = await model.detect(video);
     
     // Clear canvas
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     
     // Draw bounding boxes and labels
     let detectionText = '';
     predictions.forEach(prediction => {

        console.log(prediction);


        
         // Draw bounding box
         ctx.strokeStyle = '#00FF00';
         ctx.lineWidth = 3;
         ctx.strokeRect(
             prediction.bbox[0],
             prediction.bbox[1],
             prediction.bbox[2],
             prediction.bbox[3]
         );
         
         // Draw label background
         ctx.fillStyle = '#00FF00';
         const textWidth = ctx.measureText(prediction.class).width;
         ctx.fillRect(
             prediction.bbox[0],
             prediction.bbox[1] - 25,
             textWidth + 10,
             25
         );
         
         // Draw label text
         ctx.fillStyle = '#000000';
         ctx.font = '18px Arial';
         ctx.fillText(
             prediction.class,
             prediction.bbox[0] + 5,
             prediction.bbox[1] - 7
         );
         
         // Add to detection list
         const confidence = (prediction.score * 100).toFixed(1);
         detectionText += `${prediction.class} (${confidence}%)<br>`;
     });
     
     // Update detection list
     if (detectionText) {
         detectionList.innerHTML = detectionText;
     } else {
         detectionList.innerHTML = 'No objects detected';
     }
     
     // Continue detection loop
     if (isDetecting) {
         requestAnimationFrame(detectObjects);
     }
 }

 // Event listeners
 startBtn.addEventListener('click', startCamera);

 // Load model when page loads
 loadModel();