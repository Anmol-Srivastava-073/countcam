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

// ------------------------
//  UNIVERSAL THUMB LOGIC
// ------------------------
function detectThumb(hand, lm) {
    const tip = lm[4];
    const ip = lm[3];
    const mcp = lm[2];

    // Vector thumb direction
    const vx = tip.x - mcp.x;
    const vz = tip.z - mcp.z;  // depth detection (IMPORTANT)

    // If the thumb points toward/away from camera
    const depthOpen = Math.abs(vz) > 0.03;

    if (hand === "Right") {
        return (vx < -0.02 || depthOpen) ? 1 : 0;
    } else { // Left hand
        return (vx > 0.02 || depthOpen) ? 1 : 0;
    }
}

// ------------------------
// COUNT ALL FINGERS (1 HAND)
// ------------------------
function countFingersSingleHand(hand, lm) {
    let fingers = 0;

    const tips = [8, 12, 16, 20];
    const dips = [6, 10, 14, 18];

    // Count index, middle, ring, little
    for (let i = 0; i < 4; i++) {
        if (lm[tips[i]].y < lm[dips[i]].y) fingers++;
    }

    // Count thumb using new universal logic
    fingers += detectThumb(hand, lm);

    return fingers;
}

// ------------------------
// MAIN DETECTION
// ------------------------
hands.onResults((res) => {
    // Draw mirrored camera
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!res.multiHandLandmarks.length) {
        result.innerText = "Detecting...";
        return;
    }

    let totalFingers = 0;

    // Loop through detected hands
    res.multiHandLandmarks.forEach((lm, index) => {
        const hand = res.multiHandedness[index].label; // "Left" or "Right"

        // draw red dots
        lm.forEach((p) => {
            const x = canvas.width - p.x * canvas.width;
            const y = p.y * canvas.height;

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "red";
            ctx.fill();
        });

        totalFingers += countFingersSingleHand(hand, lm);
    });

    result.innerText = "Detected: " + totalFingers;
});
