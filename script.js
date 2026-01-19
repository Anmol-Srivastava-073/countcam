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
    const ip  = lm[3];
    const mcp = lm[2];

    // Calculate thumb angle at the IP joint
    const angle = angleBetweenPoints(tip, ip, mcp);

    // Open thumb angle threshold (industry standard ~40°)
    return angle > 40 ? 1 : 0;
}
function angleBetweenPoints(a, b, c) {
    // angle at point B, between BA and BC
    const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const cb = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

    const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
    const magAB = Math.sqrt(ab.x**2 + ab.y**2 + ab.z**2);
    const magCB = Math.sqrt(cb.x**2 + cb.y**2 + cb.z**2);

    const angle = Math.acos(dot / (magAB * magCB));
    return angle * (180 / Math.PI); // convert to degrees
}

// ------------------------
// COUNT ALL FINGERS (1 HAND)
// ------------------------
function countFingersSingleHand(hand, lm) {
    let fingers = 0;

    const tips = [8, 12, 16, 20];
    const dips = [6, 10, 14, 18];

    // Long fingers
    for (let i = 0; i < 4; i++) {
        if (lm[tips[i]].y < lm[dips[i]].y) fingers++;
    }

    // New ANGLE-BASED thumb detection
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
