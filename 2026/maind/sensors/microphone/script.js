const valueDisplay = document.getElementById("value");
    const debugEl = document.getElementById("debug");
    const startButton = document.getElementById("start");
    const body = document.body;

    let analyser, dataArray;
    let smoothed = 0;


    startButton.addEventListener("click", async () => {
      //request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      //get audio track
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();

      //create media stream source
      const source = audioContext.createMediaStreamSource(stream);

      //create analyser
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      //create silent gain
      //This is used to mute the audio output.
      // The silent gain node forces the graph to run without making any sound.
      // This is important because the analyser needs to process the audio data even if it’s not making any sound.
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;

      //connect source to analyser and silent gain
      source.connect(analyser);
      analyser.connect(silentGain);
      silentGain.connect(audioContext.destination);

      dataArray = new Float32Array(analyser.fftSize);

      update();
    });

    function update() {
      analyser.getFloatTimeDomainData(dataArray);

      //calculate rms
      //It’s a mathematical way to measure the average energy (power) of a signal.
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i]; // already -1..1
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // smoothing
      smoothed = smoothed * 0.85 + rms * 0.15;

      // map to 0..100 (increase multiplier if needed)
      const volume = Math.max(0, Math.min(100, Math.round(smoothed * 2000)));

      //update value display
      valueDisplay.textContent = volume;

      if(volume > 5) {
        body.style.backgroundColor = "black";
      } else {
        body.style.backgroundColor = "white";
      }
 
      requestAnimationFrame(update);
    }