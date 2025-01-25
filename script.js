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
camera.position.z = 5;

// Maskottchen erstellen
const mascot = new THREE.Group(); // Hauptgruppe für das Maskottchen

// Körper
const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
mascot.add(body);

// Kopf
const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const head = new THREE.Mesh(headGeometry, headMaterial);
mascot.add(head);

// Funktion, um Gelenke hinzuzufügen
function createJoint(color) {
  const geometry = new THREE.SphereGeometry(0.2, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

// Gelenke erstellen
const leftShoulder = createJoint(0xff0000);
const rightShoulder = createJoint(0x0000ff);
const leftElbow = createJoint(0xff8800);
const rightElbow = createJoint(0x0088ff);
const leftHand = createJoint(0xffff00);
const rightHand = createJoint(0x88ff00);
const hip = createJoint(0x00ffff); // Hüfte
const leftKnee = createJoint(0xff00ff);
const rightKnee = createJoint(0x8800ff);
const leftFoot = createJoint(0xffffff);
const rightFoot = createJoint(0x888888);

mascot.add(
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
  rightFoot
);

// Linien für alle Verbindungen
function createLimbLine() {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
  ]);
  return new THREE.Line(geometry, material);
}

const headToBodyLine = createLimbLine(); // Verbindung vom Kopf zum Körper
const leftArmLine = createLimbLine();
const rightArmLine = createLimbLine();
const leftLegLine = createLimbLine();
const rightLegLine = createLimbLine();
const bodyLine = createLimbLine();

scene.add(
  headToBodyLine,
  leftArmLine,
  rightArmLine,
  leftLegLine,
  rightLegLine,
  bodyLine
);
scene.add(mascot);

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
    console.log("Pose-Daten erkannt:", results.poseLandmarks);

    // Kopf bewegen (Landmark 0)
    const nose = results.poseLandmarks[0];
    if (nose) {
      head.position.set(nose.x * 5 - 2.5, -nose.y * 5 + 3.0, 0);
    }

    // Hüfte bewegen (Mittelpunkt von Hüft-Landmarks 23 und 24)
    const leftHipData = results.poseLandmarks[23];
    const rightHipData = results.poseLandmarks[24];
    if (leftHipData && rightHipData) {
      const hipX = (leftHipData.x + rightHipData.x) / 2;
      const hipY = (leftHipData.y + rightHipData.y) / 2;
      hip.position.set(hipX * 5 - 2.5, -hipY * 5 + 2.5, 0);

      // Oberkörper verbinden (Hüfte mit Schultern)
      const leftShoulderData = results.poseLandmarks[11];
      const rightShoulderData = results.poseLandmarks[12];
      if (leftShoulderData && rightShoulderData) {
        const bodyCenterX =
          (leftShoulderData.x + rightShoulderData.x + hipX) / 3;
        const bodyCenterY =
          (leftShoulderData.y + rightShoulderData.y + hipY) / 3;

        body.position.set(bodyCenterX * 5 - 2.5, -bodyCenterY * 5 + 2.5, 0);

        bodyLine.geometry.setFromPoints([
          leftShoulder.position,
          hip.position,
          rightShoulder.position,
        ]);

        leftShoulder.position.set(
          leftShoulderData.x * 5 - 2.5,
          -leftShoulderData.y * 5 + 2.5,
          0
        );
        rightShoulder.position.set(
          rightShoulderData.x * 5 - 2.5,
          -rightShoulderData.y * 5 + 2.5,
          0
        );
      }
    }

    // Linie vom Kopf zum Körper
    if (nose) {
      headToBodyLine.geometry.setFromPoints([
        head.position,
        body.position, // Verbindung zum grünen Körper (Oberkörper)
      ]);
    }

    // Arme bewegen
    const leftElbowData = results.poseLandmarks[13];
    const rightElbowData = results.poseLandmarks[14];
    const leftHandData = results.poseLandmarks[15];
    const rightHandData = results.poseLandmarks[16];

    if (leftElbowData) {
      leftElbow.position.set(
        leftElbowData.x * 5 - 2.5,
        -leftElbowData.y * 5 + 2.5,
        0
      );
    }
    if (rightElbowData) {
      rightElbow.position.set(
        rightElbowData.x * 5 - 2.5,
        -rightElbowData.y * 5 + 2.5,
        0
      );
    }
    if (leftHandData) {
      leftHand.position.set(
        leftHandData.x * 5 - 2.5,
        -leftHandData.y * 5 + 2.5,
        0
      );
    }
    if (rightHandData) {
      rightHand.position.set(
        rightHandData.x * 5 - 2.5,
        -rightHandData.y * 5 + 2.5,
        0
      );
    }

    // Beine bewegen
    const leftKneeData = results.poseLandmarks[25];
    const rightKneeData = results.poseLandmarks[26];
    const leftFootData = results.poseLandmarks[27];
    const rightFootData = results.poseLandmarks[28];

    if (leftKneeData) {
      leftKnee.position.set(
        leftKneeData.x * 5 - 2.5,
        -leftKneeData.y * 5 + 2.5,
        0
      );
    }
    if (rightKneeData) {
      rightKnee.position.set(
        rightKneeData.x * 5 - 2.5,
        -rightKneeData.y * 5 + 2.5,
        0
      );
    }
    if (leftFootData) {
      leftFoot.position.set(
        leftFootData.x * 5 - 2.5,
        -leftFootData.y * 5 + 2.5,
        0
      );
    }
    if (rightFootData) {
      rightFoot.position.set(
        rightFootData.x * 5 - 2.5,
        -rightFootData.y * 5 + 2.5,
        0
      );
    }

    // Linien aktualisieren
    leftArmLine.geometry.setFromPoints([
      leftShoulder.position,
      leftElbow.position,
      leftHand.position,
    ]);
    rightArmLine.geometry.setFromPoints([
      rightShoulder.position,
      rightElbow.position,
      rightHand.position,
    ]);
    leftLegLine.geometry.setFromPoints([
      hip.position,
      leftKnee.position,
      leftFoot.position,
    ]);
    rightLegLine.geometry.setFromPoints([
      hip.position,
      rightKnee.position,
      rightFoot.position,
    ]);
  } else {
    console.log("Keine Pose-Daten erkannt");
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

// MediaPipe Kamera initialisieren
startCamera().then(() => {
  console.log("Starte MediaPipe Kamera...");
  const cameraFeed = new Camera(videoElement, {
    onFrame: async () => {
      console.log("Frame an MediaPipe gesendet");
      await pose.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });
  cameraFeed.start();
});
