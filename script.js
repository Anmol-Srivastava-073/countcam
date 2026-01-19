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
    maxNumHands: 2,
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

// ---- COUNT THUMB CORRECTLY (FRONT & BACK, LEFT & RIGHT) ----
function countThumb(hand, lm) {
    const tip = lm[4]; // thumb tip
    const ip = lm[3];  // thumb inner joint

    if (hand === "Right") {
        // thumb opens LEFT (low X)
        return tip.x < ip.x ? 1 : 0;
    } else {
        // Left hand → thumb opens RIGHT (high X)
        return tip.x > ip.x ? 1 : 0;
    }
}

// ---- COUNT ALL FINGERS OF ONE HAND ----
function countFingersSingleHand(hand, lm) {
    let fingers = 0;

    // 4 long fingers
    const tips = [8, 12, 16, 20];
    const dips = [6, 10, 14, 18];

    for (let i = 0; i < 4; i++) {
        if (lm[tips[i]].y < lm[dips[i]].y) fingers++;
    }

    // Thumb
    fingers += countThumb(hand, lm);

    return fingers;
}

// ---- MAIN DETECTION LOOP ----
hands.onResults((res) => {
    // Draw mirrored video
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
    res.multiHandLandmarks.forEach((lm, index) => {
        const hand = res.multiHandedness[index].label; // Left / Right

        // Draw landmarks
        lm.forEach((p) => {
            const x = canvas.width - p.x * canvas.width;
            const y = p.y * canvas.height;

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "red";
            ctx.fill();
        });

        // Count fingers of this hand
        totalFingers += countFingersSingleHand(hand, lm);
    });

    result.innerText = "Detected: " + totalFingers;
});
