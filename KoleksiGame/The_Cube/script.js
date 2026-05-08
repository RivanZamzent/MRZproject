/**
 * The Cube – 3D Rubik's Cube Puzzle
 * Built with Three.js | Verlet-style smooth rotation engine
 */

'use strict';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const COLORS = {
    U: 0xffffff,  // White  – Up
    D: 0xffdd00,  // Yellow – Down
    F: 0xff4422,  // Red    – Front
    B: 0xff8800,  // Orange – Back
    R: 0x2266ff,  // Blue   – Right
    L: 0x22cc44,  // Green  – Left
    inner: 0x0d0e1a,
};

const FACE_COLORS = ['U', 'D', 'F', 'B', 'R', 'L']; // map to BoxGeometry materials order: +Y,-Y,+Z,-Z,+X,-X
// BoxGeometry face order: +X(R), -X(L), +Y(U), -Y(D), +Z(F), -Z(B)
// Material indices:          0      1      2      3      4      5

const FACE_MATERIALS_ORDER = ['R', 'L', 'U', 'D', 'F', 'B'];

const MOVE_DEFINITIONS = {
    U:  { axis: 'y', layer:  1, dir:  1 },
    Ui: { axis: 'y', layer:  1, dir: -1 },
    D:  { axis: 'y', layer: -1, dir: -1 },
    Di: { axis: 'y', layer: -1, dir:  1 },
    R:  { axis: 'x', layer:  1, dir: -1 },
    Ri: { axis: 'x', layer:  1, dir:  1 },
    L:  { axis: 'x', layer: -1, dir:  1 },
    Li: { axis: 'x', layer: -1, dir: -1 },
    F:  { axis: 'z', layer:  1, dir: -1 },
    Fi: { axis: 'z', layer:  1, dir:  1 },
    B:  { axis: 'z', layer: -1, dir:  1 },
    Bi: { axis: 'z', layer: -1, dir: -1 },
};

const SCRAMBLE_MOVES = Object.keys(MOVE_DEFINITIONS);
const ROTATION_DURATION = 280; // ms

// ─── STATE ───────────────────────────────────────────────────────────────────

let scene, camera, renderer, raycaster;
let cubelets = [];       // 27 small cubes
let isAnimating = false;
let moveQueue = [];
let moveCount = 0;
let timerInterval = null;
let timerStart = null;
let timerRunning = false;

// Orbit state
const orbit = { active: false, prevX: 0, prevY: 0 };
const cubeGroup = new THREE.Group();

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
    const container = document.getElementById('scene-container');

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(5.5, 4.5, 5.5);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dir1.position.set(5, 10, 7);
    dir1.castShadow = true;
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x8899ff, 0.4);
    dir2.position.set(-5, -5, -5);
    scene.add(dir2);

    // Point lights for flair
    const ptBlue = new THREE.PointLight(0x4f8aff, 1.5, 12);
    ptBlue.position.set(-4, 4, 0);
    scene.add(ptBlue);

    const ptPurple = new THREE.PointLight(0xb060ff, 1.0, 12);
    ptPurple.position.set(4, -4, 0);
    scene.add(ptPurple);

    // Raycaster
    raycaster = new THREE.Raycaster();

    // Build cube
    scene.add(cubeGroup);
    buildCube();

    // Events
    window.addEventListener('resize', onResize);
    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    // UI buttons
    document.querySelectorAll('.move-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const move = btn.dataset.move;
            enqueueMove(move);
            flashBtn(btn);
        });
    });
    document.getElementById('btn-scramble').addEventListener('click', scramble);
    document.getElementById('btn-reset').addEventListener('click', resetCube);
    document.getElementById('btn-play-again').addEventListener('click', () => {
        document.getElementById('win-screen').classList.add('hidden');
        resetCube();
        setTimeout(scramble, 400);
    });

    // Hide loading
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 800);
    }, 1200);

    animate();
}

// ─── CUBE CONSTRUCTION ────────────────────────────────────────────────────────

function makeMaterials(x, y, z) {
    // face order for BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
    const faceMap = ['R', 'L', 'U', 'D', 'F', 'B'];
    const positions = [x, -x, y, -y, z, -z]; // which face is "outward" for each side

    return faceMap.map((face, i) => {
        const isVisible = positions[i] > 0.5;
        const color = isVisible ? COLORS[face] : COLORS.inner;
        return new THREE.MeshStandardMaterial({
            color,
            roughness: isVisible ? 0.25 : 1.0,
            metalness: isVisible ? 0.1 : 0.0,
        });
    });
}

function buildCube() {
    // Remove old cubelets
    cubelets.forEach(c => cubeGroup.remove(c));
    cubelets = [];
    cubeGroup.rotation.set(0.35, -0.6, 0);

    const geo = new THREE.BoxGeometry(0.95, 0.95, 0.95);

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const materials = makeMaterials(x, y, z);
                const mesh = new THREE.Mesh(geo, materials);
                mesh.position.set(x, y, z);
                mesh.castShadow = true;
                mesh.userData = { initX: x, initY: y, initZ: z };
                cubeGroup.add(mesh);
                cubelets.push(mesh);
            }
        }
    }
}

// ─── MOVE ENGINE ─────────────────────────────────────────────────────────────

function enqueueMove(moveName) {
    moveQueue.push(moveName);
    if (!isAnimating) processQueue();
}

function processQueue() {
    if (moveQueue.length === 0) { isAnimating = false; return; }
    isAnimating = true;
    const move = moveQueue.shift();
    executeMove(move, () => {
        isAnimating = false;
        processQueue();
    });
}

function executeMove(moveName, onDone) {
    const def = MOVE_DEFINITIONS[moveName];
    if (!def) { if (onDone) onDone(); return; }

    const { axis, layer, dir } = def;

    // Select cubelets on this layer
    const affected = cubelets.filter(c => {
        const pos = new THREE.Vector3();
        c.getWorldPosition(pos);
        cubeGroup.worldToLocal(pos);
        return Math.round(pos[axis]) === layer;
    });

    // Rotate group
    const pivot = new THREE.Group();
    cubeGroup.add(pivot);
    affected.forEach(c => {
        pivot.attach(c);
    });

    const targetAngle = (Math.PI / 2) * dir;
    const start = performance.now();

    function tick(now) {
        const t = Math.min((now - start) / ROTATION_DURATION, 1);
        const eased = easeInOut(t);
        const angle = eased * targetAngle;
        pivot.rotation[axis] = angle;
        renderer.render(scene, camera);

        if (t < 1) {
            requestAnimationFrame(tick);
        } else {
            pivot.rotation[axis] = targetAngle;

            // Detach cubelets back to cubeGroup
            affected.forEach(c => {
                cubeGroup.attach(c);
                // Snap positions & quaternions to avoid float drift
                c.position.set(
                    Math.round(c.position.x),
                    Math.round(c.position.y),
                    Math.round(c.position.z)
                );
            });
            cubeGroup.remove(pivot);
            if (onDone) onDone();
        }
    }
    requestAnimationFrame(tick);

    // Increment move counter (not for scramble internal moves)
    if (!scrambling) {
        moveCount++;
        document.getElementById('move-count').textContent = moveCount;
        if (!timerRunning) startTimer();
        checkSolved();
    }
}

function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─── SCRAMBLE & RESET ─────────────────────────────────────────────────────────

let scrambling = false;

function scramble() {
    resetCube();
    scrambling = true;
    const n = 20;
    const moves = [];
    for (let i = 0; i < n; i++) {
        moves.push(SCRAMBLE_MOVES[Math.floor(Math.random() * SCRAMBLE_MOVES.length)]);
    }
    let i = 0;
    function next() {
        if (i >= moves.length) {
            scrambling = false;
            moveCount = 0;
            document.getElementById('move-count').textContent = '0';
            startTimer();
            return;
        }
        executeMove(moves[i++], next);
    }
    next();
}

function resetCube() {
    stopTimer();
    moveCount = 0;
    moveQueue = [];
    isAnimating = false;
    scrambling = false;
    document.getElementById('move-count').textContent = '0';
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('win-screen').classList.add('hidden');
    buildCube();
}

// ─── TIMER ───────────────────────────────────────────────────────────────────

function startTimer() {
    stopTimer();
    timerStart = Date.now();
    timerRunning = true;
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - timerStart) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${m}:${s}`;
}

// ─── SOLVED CHECK ─────────────────────────────────────────────────────────────

function checkSolved() {
    // Give a tick to let positions settle
    setTimeout(() => {
        const faceCenters = {
            U: [], D: [], F: [], B: [], R: [], L: []
        };

        cubelets.forEach(c => {
            const x = Math.round(c.position.x);
            const y = Math.round(c.position.y);
            const z = Math.round(c.position.z);

            // Check face colors by material slots
            const mats = c.material; // array of 6 materials
            if (y ===  1) faceCenters.U.push(mats[2].color.getHex());
            if (y === -1) faceCenters.D.push(mats[3].color.getHex());
            if (z ===  1) faceCenters.F.push(mats[4].color.getHex());
            if (z === -1) faceCenters.B.push(mats[5].color.getHex());
            if (x ===  1) faceCenters.R.push(mats[0].color.getHex());
            if (x === -1) faceCenters.L.push(mats[1].color.getHex());
        });

        const allSolved = Object.values(faceCenters).every(face => {
            if (face.length === 0) return true;
            return face.every(c => c === face[0]);
        });

        if (allSolved && moveCount > 0) {
            showWin();
        }
    }, 50);
}

function showWin() {
    stopTimer();
    const timeEl = document.getElementById('timer').textContent;
    document.getElementById('win-stats').textContent =
        `Solved in ${moveCount} moves • ${timeEl}`;
    document.getElementById('win-screen').classList.remove('hidden');
}

// ─── ORBIT CONTROL ───────────────────────────────────────────────────────────

function onPointerDown(e) {
    orbit.active = true;
    orbit.prevX = e.clientX;
    orbit.prevY = e.clientY;
}

function onPointerMove(e) {
    if (!orbit.active) return;
    const dx = e.clientX - orbit.prevX;
    const dy = e.clientY - orbit.prevY;
    orbit.prevX = e.clientX;
    orbit.prevY = e.clientY;
    cubeGroup.rotation.y += dx * 0.012;
    cubeGroup.rotation.x += dy * 0.012;
    // Clamp X rotation
    cubeGroup.rotation.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, cubeGroup.rotation.x));
}

function onPointerUp() { orbit.active = false; }

function onTouchStart(e) {
    e.preventDefault();
    orbit.active = true;
    orbit.prevX = e.touches[0].clientX;
    orbit.prevY = e.touches[0].clientY;
}
function onTouchMove(e) {
    e.preventDefault();
    if (!orbit.active) return;
    const dx = e.touches[0].clientX - orbit.prevX;
    const dy = e.touches[0].clientY - orbit.prevY;
    orbit.prevX = e.touches[0].clientX;
    orbit.prevY = e.touches[0].clientY;
    cubeGroup.rotation.y += dx * 0.012;
    cubeGroup.rotation.x += dy * 0.012;
    cubeGroup.rotation.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, cubeGroup.rotation.x));
}

// ─── KEYBOARD ─────────────────────────────────────────────────────────────────

function onKeyDown(e) {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toUpperCase();
    const shift = e.shiftKey;
    const map = { U: 'U', D: 'D', R: 'R', L: 'L', F: 'F', B: 'B' };
    if (map[k]) {
        e.preventDefault();
        const move = shift ? map[k] + 'i' : map[k];
        enqueueMove(move);
        const btn = document.getElementById(`btn-${move}`);
        if (btn) flashBtn(btn);
    }
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────

function flashBtn(btn) {
    btn.classList.remove('flash');
    void btn.offsetWidth; // force reflow
    btn.classList.add('flash');
}

// ─── RENDER LOOP ──────────────────────────────────────────────────────────────

function animate() {
    requestAnimationFrame(animate);
    if (!orbit.active && !isAnimating) {
        cubeGroup.rotation.y += 0.003;
    }
    renderer.render(scene, camera);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ─── START ────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
