const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const result = document.getElementById("result");

// Resize canvas when video is ready
video.addEventListener("loadedmetadata", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
});

// Start webcam instantly
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; });

// MediaPipe setup
const hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

// Auto-start processing
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
});
camera.start();

// Count fingers
function countFingers(lm) {
    let fingers = 0;

    const tips = [8, 12, 16, 20];
    const dips = [6, 10, 14, 18];

    // 4 fingers
    for (let i = 0; i < 4; i++) {
        if (lm[tips[i]].y < lm[dips[i]].y) {
            fingers++;
        }
    }

    // Thumb (mirror-aware)
    if (lm[4].x < lm[3].x) fingers++;

    return fingers;
}

// Draw & detect
hands.onResults(res => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!res.multiHandLandmarks.length) {
        result.innerText = "Detecting...";
        return;
    }

    const lm = res.multiHandLandmarks[0];

    // Draw points
    lm.forEach(p => {
        const x = canvas.width - (p.x * canvas.width);
        const y = p.y * canvas.height;

/ottery
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
    });

    const count = countFingers(lm);
    result.innerText = `Detected: ${count}`;
});
