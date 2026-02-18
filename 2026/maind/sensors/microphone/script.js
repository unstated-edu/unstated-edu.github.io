const startButton = document.getElementById("start");

startButton.addEventListener("click", async () => {
  // ask permission to use the microphone
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // create an audio context (the engine that processes audio)
  const audioContext = new AudioContext();

  // connect the microphone to the audio context
  const source = audioContext.createMediaStreamSource(stream);

  // create an analyser (reads the audio data)
  const analyser = audioContext.createAnalyser();
  source.connect(analyser);

  // a container to store the audio data
  const dataArray = new Float32Array(analyser.fftSize);

  function update() {
    // fill dataArray with the current audio data
    analyser.getFloatTimeDomainData(dataArray);

    // calculate the volume (0 to 100)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }

    // Average energy of the signal, scaled to a readable number
    const volume = Math.round(Math.sqrt(sum / dataArray.length) * 500);

    // use the volume here
    document.getElementById("value").textContent = volume;
    document.body.style.backgroundColor = volume > 40 ? "gray" : "white";

    // loop
    requestAnimationFrame(update);
  }

  update();
});
