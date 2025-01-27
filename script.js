const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");

// Three.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ canvas: canvasElement });
renderer.setSize(window.innerWidth, window.innerHeight);

// Kamera-Position erhöhen und weiter nach hinten setzen
camera.position.set(0, 2, 8);

// Maskottchen erstellen
const mascot = new THREE.Group();

// Körper (kleiner gemacht)
const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 32); // Kleinere Breite und Höhe
const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
mascot.add(body);

// Kopf
const headGeometry = new THREE.SphereGeometry(0.3, 32, 32); // Kopf etwas kleiner
const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const head = new THREE.Mesh(headGeometry, headMaterial);
head.position.y = 1.5; // Kopf über dem Körper platzieren
mascot.add(head);

// Funktion, um Gelenke hinzuzufügen
function createJoint(color, size = 0.1) {
  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

// Gelenke erstellen
const joints = {
  leftShoulder: createJoint(0xff0000, 0.08),
  rightShoulder: createJoint(0x0000ff, 0.08),
  leftElbow: createJoint(0xff8800, 0.08),
  rightElbow: createJoint(0x0088ff, 0.08),
  leftHand: createJoint(0xffff00, 0.08),
  rightHand: createJoint(0x88ff00, 0.08),
  hip: createJoint(0x00ffff, 0.08),
  leftKnee: createJoint(0xff00ff, 0.08),
  rightKnee: createJoint(0x8800ff, 0.08),
  leftFoot: createJoint(0xffffff, 0.08),
  rightFoot: createJoint(0x888888, 0.08),
};

Object.values(joints).forEach((joint) => mascot.add(joint));
scene.add(mascot);

// Linien für alle Verbindungen
function createLimbLine() {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
  ]);
  return new THREE.Line(geometry, material);
}

const lines = {
  headToBody: createLimbLine(),
  leftArm: createLimbLine(),
  rightArm: createLimbLine(),
  leftLeg: createLimbLine(),
  rightLeg: createLimbLine(),
  bodyLine: createLimbLine(),
};

Object.values(lines).forEach((line) => scene.add(line));

// Three.js Animation
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// MediaPipe Pose Detection
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1,
  enableSegmentation: false,
  smoothLandmarks: true,
});

pose.onResults((results) => {
  if (results.poseLandmarks) {
    const flipX = (x) => -x + 1; // Spiegelung der Figur

    const updateJoint = (joint, data) => {
      joint.position.set(flipX(data.x) * 5 - 2.5, -data.y * 5 + 2.5, 0);
    };

    const {
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      leftHand,
      rightHand,
      hip,
      leftKnee,
      rightKnee,
      leftFoot,
      rightFoot,
    } = joints;

    // Gelenke aktualisieren
    updateJoint(joints.leftShoulder, results.poseLandmarks[11]);
    updateJoint(joints.rightShoulder, results.poseLandmarks[12]);
    updateJoint(joints.leftElbow, results.poseLandmarks[13]);
    updateJoint(joints.rightElbow, results.poseLandmarks[14]);
    updateJoint(joints.leftHand, results.poseLandmarks[15]);
    updateJoint(joints.rightHand, results.poseLandmarks[16]);
    updateJoint(joints.hip, results.poseLandmarks[23]);
    updateJoint(joints.leftKnee, results.poseLandmarks[25]);
    updateJoint(joints.rightKnee, results.poseLandmarks[26]);
    updateJoint(joints.leftFoot, results.poseLandmarks[27]);
    updateJoint(joints.rightFoot, results.poseLandmarks[28]);

    // Dynamische Körperposition (Mittelpunkte von Schultern und Hüfte)
    const leftShoulderData = results.poseLandmarks[11];
    const rightShoulderData = results.poseLandmarks[12];
    const leftHipData = results.poseLandmarks[23];
    const rightHipData = results.poseLandmarks[24];

    if (leftShoulderData && rightShoulderData && leftHipData && rightHipData) {
      const centerX =
        (leftShoulderData.x +
          rightShoulderData.x +
          leftHipData.x +
          rightHipData.x) /
        4;
      const centerY =
        (leftShoulderData.y +
          rightShoulderData.y +
          leftHipData.y +
          rightHipData.y) /
        4;

      body.position.set(flipX(centerX) * 5 - 2.5, -centerY * 5 + 2.5, 0);
    }

    // Kopf positionieren
    const nose = results.poseLandmarks[0];
    if (nose) {
      head.position.set(flipX(nose.x) * 5 - 2.5, -nose.y * 5 + 3.0, 0);
    }

    // Linien aktualisieren
    lines.headToBody.geometry.setFromPoints([head.position, body.position]);
    lines.leftArm.geometry.setFromPoints([
      joints.leftShoulder.position,
      joints.leftElbow.position,
      joints.leftHand.position,
    ]);
    lines.rightArm.geometry.setFromPoints([
      joints.rightShoulder.position,
      joints.rightElbow.position,
      joints.rightHand.position,
    ]);
    lines.leftLeg.geometry.setFromPoints([
      joints.hip.position,
      joints.leftKnee.position,
      joints.leftFoot.position,
    ]);
    lines.rightLeg.geometry.setFromPoints([
      joints.hip.position,
      joints.rightKnee.position,
      joints.rightFoot.position,
    ]);
    lines.bodyLine.geometry.setFromPoints([
      joints.leftShoulder.position,
      joints.hip.position,
      joints.rightShoulder.position,
    ]);
  }
});

// Kamera starten
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      console.log("Kamera erfolgreich gestartet");
    };
  } catch (error) {
    console.error("Fehler beim Zugriff auf die Kamera:", error);
  }
}

// Fortschrittsanzeige-Logik
// Fortschrittsanzeige-Logik
const progressSteps = document.querySelectorAll(".progress-step");
const progressLines = document.querySelectorAll(".progress-line");

let currentStep = 1; // Startet bei Schritt 1

// Fortschrittsanzeige aktualisieren
function updateProgressBar(step) {
  progressSteps.forEach((progressStep, index) => {
    if (index < step) {
      progressStep.classList.add("active");
    } else {
      progressStep.classList.remove("active");
    }
  });

  progressLines.forEach((progressLine, index) => {
    if (index < step - 1) {
      progressLine.classList.add("active");
    } else {
      progressLine.classList.remove("active");
    }
  });
}

// Bewegungssimulation für die Fortschrittsanzeige (dynamisch durch Bewegung erweiterbar)
function simulateMotion() {
  currentStep = (currentStep % 4) + 1; // Zyklisch von 1 bis 4
  updateProgressBar(currentStep);
}

// Starte die Fortschrittsanzeige
setInterval(simulateMotion, 2000); // Fortschritt alle 2 Sekunden

// Starte Kamera und MediaPipe
startCamera().then(() => {
  console.log("Starte MediaPipe Kamera...");
  const cameraFeed = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });
  cameraFeed.start();
});
