const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const result = document.getElementById("result");

// Auto resize canvas to match video wrapper
function resizeCanvas() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
}

// Start webcam automatically
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;

    video.onloadedmetadata = () => {
        resizeCanvas();
    };
});

// MediaPipe setup
const hands = new Hands({
    locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
});

// Auto-start camera processing
const cam = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
});
cam.start(); // ← Auto-start gestures

// Count finger logic
function countFingers(lm) {
    let fingers = 0;

    const tips = [8, 12, 16, 20];
    const dips = [6, 10, 14, 18];

    for (let i = 0; i < tips.length; i++) {
        if (lm[tips[i]].y < lm[dips[i]].y) fingers++;
    }

    // Thumb (mirror fixed)
    if (lm[4].x < lm[3].x) fingers++;

    return fingers;
}

// Draw results on canvas
hands.onResults((res) => {
    if (canvas.width !== video.videoWidth) resizeCanvas();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!res.multiHandLandmarks.length) {
        result.innerText = "Detecting...";
        return;
    }

    const lm = res.multiHandLandmarks[0];

    // Draw keypoints
    lm.forEach((p) => {
        const x = canvas.width - p.x * canvas.width; // Mirror fix
        const y = p.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
    });

    const fingers = countFingers(lm);
    result.innerText = `Detected: ${fingers}`;
});
