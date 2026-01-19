const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  });

// Fix: MUST WAIT for video dimensions before starting camera
video.onloadedmetadata = () => {
  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 640,
    height: 480,
  });
  camera.start();
};

// COUNT FINGERS
function countFingers(landmarks) {
  const tips = [8, 12, 16, 20];
  const dips = [6, 10, 14, 18];
  let fingers = 0;

  for (let i = 0; i < tips.length; i++) {
    if (landmarks[tips[i]].y < landmarks[dips[i]].y) {
      fingers++;
    }
  }

  // Thumb → check x-axis
  if (landmarks[4].x > landmarks[3].x) fingers++;

  return fingers;
}

// DRAW + MIRROR + DETECT
hands.onResults((results) => {
  // MIRROR CAMERA
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  // If hand found
  if (results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    // Draw hand points
    for (let point of landmarks) {
      const x = (1 - point.x) * canvas.width; // mirror fix
      const y = point.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }

    const fingerCount = countFingers(landmarks);
    document.getElementById("result").innerText =
      "Detected Number: " + fingerCount;
  }
});
