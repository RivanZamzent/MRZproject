let canvas;
let ctx;
let intensitySlider;
let intensityValue;
let moodText;
let animationFrameId = null;

const BASE = {
  scale: 0.22,
  fitWidth: 1180,
  fitHeight: 760,
  uiFitHeight: 860
};

const DRAGON = {
  url: "https://winnipegwideweb.com/includes/images/codepen/dragon.png",
  scale: 3,
  x: 8,
  y: 0,
  mouthX: 31,
  mouthY: 15,
  sourceOffsetX: -10,
  sourceOffsetY: -10
};

const FIRE = {
  pixel: 3,
  emberPixel: 2,
  smokePixel: 3
};

let w = 0;
let h = 0;
let last = 0;
let time = 0;

let dragonX = 0;
let dragonY = 0;
let sourceX = 0;
let sourceY = 0;

let sceneScale = 1;
let dragonDrawScale = DRAGON.scale;
let dragonDrawW = 0;
let dragonDrawH = 0;

let firePixel = FIRE.pixel;
let emberPixel = FIRE.emberPixel;
let smokePixel = FIRE.smokePixel;

const flames = [];
const embers = [];
const smokes = [];

const dragonImg = new Image();
let dragonReady = false;

const state = {
  intensity: 20,
  fireRate: 950,
  emberRate: 90,
  smokeRate: 42,
  speedMin: 115,
  speedMax: 265,
  lifeMin: 0.34,
  lifeMax: 0.82,
  spread: 26,
  wind: 12,
  lift: -18,
  brightness: 1,
  bgFade: 0.86,
  glowBoost: 1,
  element: "fire"
};

const ELEMENTS = {
  fire: {
    primary: [255, 91, 71],
    glow: [255, 120, 30],
    colors: [
      [255, 255, 235],
      [255, 236, 130],
      [255, 156, 30],
      [255, 88, 16],
      [145, 22, 6]
    ],
    ember: [
      [255, 220, 120],
      [255, 120, 30],
      [180, 40, 12]
    ]
  },
  ice: {
    primary: [71, 225, 255],
    glow: [30, 180, 255],
    colors: [
      [235, 255, 255],
      [130, 236, 255],
      [30, 156, 255],
      [16, 88, 255],
      [6, 22, 145]
    ],
    ember: [
      [120, 220, 255],
      [30, 120, 255],
      [12, 40, 180]
    ]
  },
  poison: {
    primary: [71, 255, 113],
    glow: [30, 255, 71],
    colors: [
      [235, 255, 235],
      [130, 255, 180],
      [30, 255, 71],
      [16, 180, 30],
      [6, 100, 12]
    ],
    ember: [
      [120, 255, 120],
      [30, 255, 30],
      [12, 140, 12]
    ]
  },
  lightning: {
    primary: [225, 71, 255],
    glow: [180, 30, 255],
    colors: [
      [255, 235, 255],
      [236, 130, 255],
      [156, 30, 255],
      [88, 16, 255],
      [60, 6, 145]
    ],
    ember: [
      [220, 120, 255],
      [120, 30, 255],
      [40, 12, 180]
    ]
  }
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function snap(v, step) {
  return Math.round(v / step) * step;
}

function snapSize(v, step, min = step) {
  return Math.max(min, Math.round(v / step) * step);
}

function resize() {
  const innerW = Math.max(1, window.innerWidth);
  const innerH = Math.max(1, window.innerHeight);

  canvas.width = Math.max(1, Math.floor(innerW * BASE.scale));
  canvas.height = Math.max(1, Math.floor(innerH * BASE.scale));
  canvas.style.width = `${innerW}px`;
  canvas.style.height = `${innerH}px`;

  w = canvas.width;
  h = canvas.height;

  ctx.imageSmoothingEnabled = false;

  
  sceneScale = clamp(
    Math.min(innerW / BASE.fitWidth, innerH / BASE.fitHeight, 1),
    0.58,
    1
  );

  const uiScale = clamp(
    Math.min(innerW / BASE.fitWidth, innerH / BASE.uiFitHeight, 1),
    0.72,
    1
  );

  document.documentElement.style.setProperty("--ui-scale", uiScale.toFixed(3));

  dragonDrawScale = DRAGON.scale * sceneScale;

  const sourceDragonW = dragonImg.width || 37;
  const sourceDragonH = dragonImg.height || 34;

  dragonDrawW = sourceDragonW * dragonDrawScale;
  dragonDrawH = sourceDragonH * dragonDrawScale;

  dragonX = Math.round(6 + DRAGON.x * sceneScale);
  dragonY = Math.floor(h * 0.58 - dragonDrawH * 0.5);

  sourceX = Math.round(
    dragonX + (DRAGON.mouthX * DRAGON.scale + DRAGON.sourceOffsetX) * sceneScale
  );
  sourceY = Math.round(
    dragonY + (DRAGON.mouthY * DRAGON.scale + DRAGON.sourceOffsetY) * sceneScale
  );

  firePixel = Math.max(2, Math.round(FIRE.pixel * sceneScale));
  emberPixel = Math.max(2, Math.round(FIRE.emberPixel * sceneScale));
  smokePixel = Math.max(2, Math.round(FIRE.smokePixel * sceneScale));
}



function getMood(value) {
  if (value < 20) return { text: "Calm", className: "mood-calm" };
  if (value < 40) return { text: "Upset", className: "mood-upset" };
  if (value < 60) return { text: "Mad", className: "mood-mad" };
  if (value < 80) return { text: "Angry", className: "mood-angry" };
  return { text: "Pissed", className: "mood-pissed" };
}

function updateMood(value) {
  const mood = getMood(value);
  moodText.textContent = mood.text;
  moodText.className = `status-value ${mood.className}`;
}

function applyIntensity(value) {
  const t = value / 100;
  state.intensity = value;

  state.fireRate = lerp(140, 1800, t);
  state.emberRate = lerp(14, 110, t);
  state.smokeRate = lerp(10, 52, t);
  state.speedMin = lerp(42, 165, t);
  state.speedMax = lerp(105, 390, t);
  state.lifeMin = lerp(0.18, 0.58, t);
  state.lifeMax = lerp(0.36, 1.32, t);
  state.spread = lerp(8, 34, t);
  state.wind = lerp(4, 18, t);
  state.lift = lerp(-7, -22, t);
  state.brightness = lerp(0.72, 1.28, t);
  state.bgFade = lerp(0.94, 0.8, t);
  state.glowBoost = lerp(0.65, 1.35, t);

  intensityValue.textContent = value;
  updateMood(value);
}

function firePulse(t) {
  return (
    0.9 +
    Math.sin(t * 7.5) * 0.12 +
    Math.sin(t * 17.0) * 0.06 +
    Math.sin(t * 31.0) * 0.025
  );
}

function spawnFlame() {
  const pulse = firePulse(time);
  const intensityNorm = state.intensity / 100;

  flames.push({
    x: sourceX + rand(-1, 2) * sceneScale,
    y: sourceY + rand(-6, 6) * sceneScale,
    vx: rand(state.speedMin, state.speedMax) * pulse * sceneScale,
    vy: rand(-state.spread, state.spread) * rand(0.45, 1.0) * sceneScale,
    size: rand(4, lerp(8, 13, intensityNorm)) * sceneScale,
    grow: rand(3, lerp(6, 10, intensityNorm)) * sceneScale,
    age: 0,
    life: rand(state.lifeMin, state.lifeMax),
    alpha: rand(0.52, 1),
    waveAmp: rand(2, lerp(6, 14, intensityNorm)) * sceneScale,
    waveSpeed: rand(7, 14),
    waveOffset: rand(0, Math.PI * 2)
  });

  if (state.element === "lightning" && Math.random() < 0.2) {
    const last = flames[flames.length - 1];
    last.vx *= 1.5;
    last.life *= 0.5;
  }
}

function spawnEmber() {
  embers.push({
    x: sourceX + rand(0, 4) * sceneScale,
    y: sourceY + rand(-4, 4) * sceneScale,
    vx: rand(state.speedMin * 0.7, state.speedMax * 0.84) * sceneScale,
    vy: rand(-35, 28) * sceneScale,
    size: rand(2, 4) * sceneScale,
    age: 0,
    life: rand(0.35, 1.1),
    alpha: rand(0.45, 1)
  });
}

function spawnSmoke() {
  smokes.push({
    x: sourceX + rand(-1, 3) * sceneScale,
    y: sourceY + rand(-4, 4) * sceneScale,
    vx: rand(14, state.speedMax * 0.28) * sceneScale,
    vy: rand(-18, 10) * sceneScale,
    size: rand(5, 9) * sceneScale,
    grow: rand(4, 10) * sceneScale,
    age: 0,
    life: rand(0.45, 1.5),
    alpha: rand(0.06, 0.18)
  });
}

function getElementColors() {
  return ELEMENTS[state.element] || ELEMENTS.fire;
}

function flameColor(t, a, brightness) {
  const theme = getElementColors();
  const colors = theme.colors;
  
  let c;
  if (t < 0.12) c = colors[0];
  else if (t < 0.3) c = colors[1];
  else if (t < 0.55) c = colors[2];
  else if (t < 0.78) c = colors[3];
  else c = colors[4];

  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a * brightness})`;
}

function emberColor(t, a, brightness) {
  const theme = getElementColors();
  const colors = theme.ember;
  
  let c;
  if (t < 0.4) c = colors[0];
  else if (t < 0.75) c = colors[1];
  else c = colors[2];

  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a * brightness})`;
}

function clearFrame() {
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(0,0,0,${state.bgFade})`;
  ctx.fillRect(0, 0, w, h);

  const hazeW = Math.floor(
    w * lerp(0.3, 0.78, state.intensity / 100) * sceneScale
  );
  const hazeH = Math.floor(
    h * lerp(0.16, 0.38, state.intensity / 100) * sceneScale
  );

  const theme = getElementColors();
  const bg = theme.primary;
  ctx.fillStyle = `rgba(${bg[0]}, ${bg[1] * 0.2}, ${bg[2] * 0.1}, ${lerp(0.06, 0.16, state.intensity / 100)})`;
  ctx.fillRect(
    snap(sourceX - 6 * sceneScale, firePixel),
    snap(sourceY - hazeH / 2, firePixel),
    snapSize(hazeW, firePixel, firePixel),
    snapSize(hazeH, firePixel, firePixel)
  );
}

function drawDragon() {
  if (!dragonReady) return;

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(dragonImg, dragonX, dragonY, dragonDrawW, dragonDrawH);
}

function drawMouthGlow() {
  const t = state.intensity / 100;
  const theme = getElementColors();
  const p = theme.primary;
  const g = theme.glow;

  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${lerp(0.08, 0.22, t)})`;
  ctx.fillRect(
    snap(sourceX - 3 * sceneScale, firePixel),
    snap(sourceY - 3 * sceneScale, firePixel),
    snapSize(9 * sceneScale, firePixel, firePixel),
    snapSize(6 * sceneScale, firePixel, firePixel)
  );

  ctx.fillStyle = `rgba(${g[0]}, ${g[1]}, ${g[2]}, ${lerp(0.05, 0.12, t)})`;
  ctx.fillRect(
    snap(sourceX - 1 * sceneScale, firePixel),
    snap(sourceY - 1 * sceneScale, firePixel),
    snapSize(4 * sceneScale, firePixel, firePixel),
    snapSize(3 * sceneScale, firePixel, firePixel)
  );
}

function updateAndDrawFlames(dt) {
  ctx.globalCompositeOperation = "lighter";

  for (let i = flames.length - 1; i >= 0; i--) {
    const p = flames[i];
    p.age += dt;

    if (p.age >= p.life || p.x > w + 60 || p.y < -40 || p.y > h + 40) {
      flames.splice(i, 1);
      continue;
    }

    const t = p.age / p.life;

    p.x += p.vx * dt;
    p.y +=
      p.vy * dt + Math.sin(p.waveOffset + p.age * p.waveSpeed) * p.waveAmp * dt;

    p.vx += state.wind * dt * sceneScale;
    p.vx *= 0.993;
    p.vy += state.lift * dt * sceneScale;

    p.size += p.grow * dt;

    const a = (1 - t) * p.alpha;
    const len = snapSize(
      p.size * (1.25 + p.vx * 0.014),
      firePixel,
      firePixel * 2
    );
    const thick = snapSize(p.size * (1.08 - t * 0.18), firePixel, firePixel);

    const x = snap(p.x - len * 0.22, firePixel);
    const y = snap(p.y - thick * 0.5, firePixel);

    ctx.fillStyle = flameColor(t, a, state.brightness);
    ctx.fillRect(x, y, len, thick);

    if (t < 0.36) {
      const coreLen = snapSize(len * 0.34, firePixel, firePixel);
      const coreThick = snapSize(thick * 0.5, firePixel, firePixel);

      ctx.fillStyle = `rgba(255,255,230,${a * 0.72 * state.glowBoost})`;
      ctx.fillRect(
        snap(p.x, firePixel),
        snap(p.y - thick * 0.25, firePixel),
        coreLen,
        coreThick
      );
    }

    if (Math.random() < 0.08) {
      const lickLen = snapSize(len * 0.42, firePixel, firePixel);
      const lickThick = snapSize(thick * 0.42, firePixel, firePixel);

      ctx.fillStyle = `rgba(255,110,20,${a * 0.2 * state.glowBoost})`;
      ctx.fillRect(
        snap(p.x - firePixel, firePixel),
        snap(p.y - thick, firePixel),
        lickLen,
        lickThick
      );
    }
  }
}

function updateAndDrawEmbers(dt) {
  ctx.globalCompositeOperation = "lighter";

  for (let i = embers.length - 1; i >= 0; i--) {
    const p = embers[i];
    p.age += dt;

    if (p.age >= p.life || p.x > w + 30 || p.y < -20 || p.y > h + 20) {
      embers.splice(i, 1);
      continue;
    }

    const t = p.age / p.life;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    p.vx *= 0.997;
    p.vy += (-12 + Math.sin(p.age * 16) * 4) * dt * sceneScale;

    const a = (1 - t) * p.alpha;
    const s = snapSize(p.size, emberPixel, emberPixel);

    ctx.fillStyle = emberColor(t, a, state.brightness);
    ctx.fillRect(snap(p.x, emberPixel), snap(p.y, emberPixel), s, s);
  }
}

function updateAndDrawSmoke(dt) {
  ctx.globalCompositeOperation = "source-over";

  for (let i = smokes.length - 1; i >= 0; i--) {
    const p = smokes[i];
    p.age += dt;

    if (p.age >= p.life || p.x > w + 40 || p.y < -30 || p.y > h + 30) {
      smokes.splice(i, 1);
      continue;
    }

    const t = p.age / p.life;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    p.vx *= 0.992;
    p.vy += (-7 + Math.sin(p.age * 6) * 2) * dt * sceneScale;
    p.size += p.grow * dt;

    const a = (1 - t) * p.alpha;
    const s = snapSize(p.size, smokePixel, smokePixel * 2);

    ctx.fillStyle = `rgba(70,70,70,${a})`;
    ctx.fillRect(
      snap(p.x - s * 0.5, smokePixel),
      snap(p.y - s * 0.5, smokePixel),
      s,
      snapSize(s * 0.75, smokePixel, smokePixel)
    );
  }
}

function spawn(dt) {
  const pulse = clamp(firePulse(time), 0.68, 1.2);
  const intensityNorm = state.intensity / 100;

  let flameCount = Math.floor(state.fireRate * pulse * dt);
  let emberCount = Math.floor(state.emberRate * pulse * dt);
  let smokeCount = Math.floor(state.smokeRate * dt);

  if (Math.random() < lerp(0.08, 0.45, intensityNorm)) flameCount += 1;
  if (Math.random() < lerp(0.04, 0.18, intensityNorm)) emberCount += 1;
  if (Math.random() < lerp(0.02, 0.08, intensityNorm)) smokeCount += 1;

  for (let i = 0; i < flameCount; i++) spawnFlame();
  for (let i = 0; i < emberCount; i++) spawnEmber();
  for (let i = 0; i < smokeCount; i++) spawnSmoke();
}

function animate(now) {
  if (!last) last = now;
  let dt = (now - last) / 1000;
  last = now;

  dt = Math.min(dt, 0.033);
  time += dt;

  clearFrame();
  spawn(dt);
  updateAndDrawSmoke(dt);
  drawDragon();
  updateAndDrawFlames(dt);
  updateAndDrawEmbers(dt);
  drawMouthGlow();

  animationFrameId = requestAnimationFrame(animate);
}

function startAnimation() {
  if (animationFrameId === null) {
    animationFrameId = requestAnimationFrame(animate);
  }
}

function stopAnimation() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  last = 0;
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

function initialize() {
  canvas = document.getElementById("c");
  intensitySlider = document.getElementById("intensity");
  intensityValue = document.getElementById("intensityValue");
  moodText = document.getElementById("moodText");

  if (!canvas || !intensitySlider || !intensityValue || !moodText) return;
  ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  intensitySlider.addEventListener("input", () => {
    applyIntensity(parseInt(intensitySlider.value, 10));
  });

  const elementBtns = document.querySelectorAll(".element-btn");
  elementBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      elementBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.element = btn.dataset.element;
      
      
      const theme = ELEMENTS[state.element];
      document.documentElement.style.setProperty("--theme-color", `rgb(${theme.primary.join(',')})`);
      document.documentElement.style.setProperty("--theme-glow", `rgba(${theme.glow.join(',')}, 0.4)`);
    });
  });

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  dragonImg.onload = () => {
    dragonReady = true;
    resize();
  };
  dragonImg.onerror = () => {
    dragonReady = false;
    console.warn('Dragon image failed to load:', DRAGON.url);
    resize();
  };

  state.intensity = parseInt(intensitySlider.value, 10) || state.intensity;
  applyIntensity(state.intensity);
  resize();
  dragonImg.src = DRAGON.url;
  startAnimation();
}

document.addEventListener("DOMContentLoaded", initialize);
