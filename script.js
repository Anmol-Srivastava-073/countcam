const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const result = document.getElementById("result");

canvas.width = 640;
canvas.height = 480;

// Initialize MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

// Start camera stream
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  });

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});
camera.start();

// Count raised fingers
function countFingers(landmarks) {
  const tips = [8, 12, 16, 20];  
  const dips = [6, 10, 14, 18];
  let fingers = 0;

  for (let i = 0; i < tips.length; i++) {
    if (landmarks[tips[i]].y < landmarks[dips[i]].y) {
      fingers++;
    }
  }

  // Thumb detection
  if (landmarks[4].x < landmarks[3].x) fingers++;

  return fingers;
}

// Draw & detect
hands.onResults((results) => {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    // Draw keypoints
    for (let point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }

    // Count fingers
    const fingerCount = countFingers(landmarks);
    result.innerText = "Detected Number: " + fingerCount;
  }
});
