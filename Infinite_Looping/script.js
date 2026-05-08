const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const armsInput = document.getElementById('arms');
const ratioInput = document.getElementById('ratio');
const speedInput = document.getElementById('spd');
const trailInput = document.getElementById('trail');
const armsValue = document.getElementById('arms-v');
const ratioValue = document.getElementById('ratio-v');
const speedValue = document.getElementById('spd-v');
const trailValue = document.getElementById('trail-v');
const btnClear = document.getElementById('btn-clear');
const btnPause = document.getElementById('btn-pause');
const themeButtons = Array.from(document.querySelectorAll('[data-theme]'));

const THEMES = {
  neon:  ['#b57bee','#5ec9f5','#f55e9e','#7bf5c5','#f5c45e','#ee7bbb','#7bcdf5','#f57b7b'],
  ember: ['#f5844a','#f5c45e','#ee5e7b','#f5a33c','#e85588','#f5d080','#f0704a','#f59560'],
  ocean: ['#3ecccc','#4a9ef5','#5efaf0','#5e9af5','#1ad4a0','#2ae0d0','#60aff5','#40d4b0'],
  candy: ['#f55eb0','#c97bee','#ee5e5e','#f597ee','#ee7b9e','#d45ef5','#f57bb5','#ee9ef5'],
};

let theme = 'neon';
let paused = false;
let t = 0;
const trailPts = [];
const CANVAS_RATIO = 0.65;

function getConfig() {
  return {
    arms: +armsInput.value,
    ratio: +ratioInput.value,
    speed: +speedInput.value * 0.003,
    maxTrail: +trailInput.value,
  };
}

function setThemeAccent() {
  document.documentElement.style.setProperty('--accent', THEMES[theme][0]);
}

function setActiveThemeButton() {
  themeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.theme === theme);
  });
}

function setup() {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.parentElement.clientWidth;
  const height = Math.round(width * CANVAS_RATIO);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  clearTrail();
}

function clearTrail() {
  trailPts.length = 0;
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function updateSliderLabels() {
  armsValue.textContent = armsInput.value;
  ratioValue.textContent = ratioInput.value;
  speedValue.textContent = speedInput.value;
  trailValue.textContent = trailInput.value;
}

function draw() {
  requestAnimationFrame(draw);

  if (paused) return;

  
  const { arms, ratio, speed, maxTrail } = getConfig();
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(cx, cy) * 0.82;

  t += speed;

  const pts = [];
  for (let a = 0; a < arms; a += 1) {
    const phase = (a / arms) * Math.PI * 2;
    const r1 = R * 0.54;
    const r2 = R * 0.32;
    const x = cx + r1 * Math.cos(t + phase) + r2 * Math.cos(ratio * t + phase);
    const y = cy + r1 * Math.sin(t + phase) + r2 * Math.sin(ratio * t + phase);
    pts.push({ x, y });
  }

  trailPts.push(pts);
  if (trailPts.length > maxTrail) {
    trailPts.splice(0, trailPts.length - maxTrail);
  }

  ctx.fillStyle = 'rgba(8,8,16,0.14)';
  ctx.fillRect(0, 0, W, H);

  
  const colors = THEMES[theme];
  const len = trailPts.length;

  for (let i = 1; i < len; i += 1) {
    const alpha = i / len;
    const prev = trailPts[i - 1];
    const curr = trailPts[i];

    for (let a = 0; a < curr.length; a += 1) {
      if (!prev[a]) continue;
      const [r, g, b] = hexToRgb(colors[a % colors.length]);
      ctx.beginPath();
      ctx.moveTo(prev[a].x, prev[a].y);
      ctx.lineTo(curr[a].x, curr[a].y);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.9})`;
      ctx.lineWidth = 0.8 + alpha * 2.2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  const last = trailPts[trailPts.length - 1];
  if (last) {
    last.forEach((point, index) => {
      const [r, g, b] = hexToRgb(colors[index % colors.length]);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},1)`;
      ctx.shadowColor = colors[index % colors.length];
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }
}

function togglePause() {
  paused = !paused;
  btnPause.textContent = paused ? '▶ Resume' : '⏸ Pause';
  btnPause.classList.toggle('paused', paused);
}

function changeTheme(newTheme) {
  theme = newTheme;
  setThemeAccent();
  setActiveThemeButton();
  clearTrail();
}

function bindEvents() {
  [[armsInput, armsValue], [ratioInput, ratioValue], [speedInput, speedValue], [trailInput, trailValue]].forEach(([input, output]) => {
    input.addEventListener('input', () => {
      output.textContent = input.value;
      clearTrail();
    });
  });

  btnClear.addEventListener('click', clearTrail);
  btnPause.addEventListener('click', togglePause);

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => changeTheme(button.dataset.theme));
  });

  window.addEventListener('resize', setup);
}

function init() {
  setThemeAccent();
  setActiveThemeButton();
  updateSliderLabels();
  bindEvents();
  setup();
  draw();
}

document.addEventListener('DOMContentLoaded', init);