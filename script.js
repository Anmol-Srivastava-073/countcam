const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const result = document.getElementById("result");

// ask for webcam permission
navigator.mediaDevices.getUserMedia({
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
    }
}).then((stream) => {
    video.srcObject = stream;
});

// resize canvas when video loads
video.addEventListener("loadedmetadata", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
});

// MediaPipe Hands
const hands = new Hands({
    locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
});

hands.setOptions({
    maxNumHands: 2,                // allow two hands
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
    modelComplexity: 1,
});

// Start processing frames
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
});
camera.start();

// Count FINGERS for ONE hand
function countFingersSingleHand(lm) {
    let fingers = 0;

    const tips = [8, 12, 16, 20];
    const dips = [6, 10, 14, 18];

    // 4 tall fingers
    for (let i = 0; i < 4; i++) {
        if (lm[tips[i]].y < lm[dips[i]].y) fingers++;
    }

    // Thumb (mirror-aware)
    if (lm[4].x < lm[3].x) fingers++;

    return fingers;
}

// Draw + Detect 0–10 fingers
hands.onResults((res) => {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!res.multiHandLandmarks.length) {
        result.innerText = "Detecting...";
        return;
    }

    let totalFingers = 0;

    // Loop through BOTH hands
    res.multiHandLandmarks.forEach((lm) => {

        // draw landmarks
        lm.forEach((p) => {
            const x = canvas.width - p.x * canvas.width;
            const y = p.y * canvas.height;

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "red";
            ctx.fill();
        });

        // add finger count for this hand
        totalFingers += countFingersSingleHand(lm);
    });

    result.innerText = "Detected: " + totalFingers;
});
