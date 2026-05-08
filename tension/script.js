/**
 * Tension - Physics Visualization
 * A Verlet-integration based grid simulation exploring structural tension.
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tensionBar = document.getElementById('tension-bar');

let width, height;
let points = [];
let constraints = [];
const spacing = 45;
const iterations = 5;
const mouseForce = 0.5;
const mouseRadius = 150;
const friction = 0.98;
const gravity = 0.15;

const mouse = {
    x: -1000,
    y: -1000,
    down: false,
    active: false
};

// --- Initialization ---

function init() {
    resize();
    createGrid();
    animate();
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Re-initialize grid on large resize
    if (points.length > 0) createGrid();
}

class Point {
    constructor(x, y, pinned = false) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.pinned = pinned;
    }

    update() {
        if (this.pinned) return;

        let velX = (this.x - this.oldX) * friction;
        let velY = (this.y - this.oldY) * friction;

        this.oldX = this.x;
        this.oldY = this.y;

        this.x += velX;
        this.y += velY;
        this.y += gravity;

        // Mouse interaction
        if (mouse.active) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouseRadius) {
                const force = (mouseRadius - dist) / mouseRadius;
                if (mouse.down) {
                    // Pull towards mouse
                    this.x -= dx * force * 0.1;
                    this.y -= dy * force * 0.1;
                } else {
                    // Subtle repulsion
                    this.x += dx * force * 0.02;
                    this.y += dy * force * 0.02;
                }
            }
        }

        // Boundary constraints
        if (this.x > width) this.x = width;
        if (this.x < 0) this.x = 0;
        if (this.y > height) this.y = height;
        if (this.y < 0) this.y = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
        ctx.fill();
    }
}

class Constraint {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.length = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        this.tension = 0;
    }

    resolve() {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const diff = (this.length - dist) / dist;

        this.tension = Math.abs(dist - this.length) / this.length;

        const offsetX = dx * diff * 0.5;
        const offsetY = dy * diff * 0.5;

        if (!this.p1.pinned) {
            this.p1.x -= offsetX;
            this.p1.y -= offsetY;
        }
        if (!this.p2.pinned) {
            this.p2.x += offsetX;
            this.p2.y += offsetY;
        }
    }

    draw() {
        const t = Math.min(this.tension * 5, 1);
        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        
        // Color based on tension: Cyan (low) -> Purple/Red (high)
        const r = Math.floor(0 + t * 255);
        const g = Math.floor(242 * (1 - t));
        const b = Math.floor(255);
        
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + t * 0.6})`;
        ctx.lineWidth = 1 + t * 2;
        ctx.stroke();
    }
}

function createGrid() {
    points = [];
    constraints = [];

    const cols = Math.floor(width / spacing) + 1;
    const rows = Math.floor(height / spacing) + 1;
    const offsetX = (width - (cols - 1) * spacing) / 2;
    const offsetY = (height - (rows - 1) * spacing) / 2;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            // Pin the top row
            const isPinned = y === 0;
            const p = new Point(offsetX + x * spacing, offsetY + y * spacing, isPinned);
            points.push(p);

            if (x > 0) {
                constraints.push(new Constraint(points[points.length - 2], p));
            }
            if (y > 0) {
                constraints.push(new Constraint(points[points.length - cols - 1], p));
            }
        }
    }
}

// --- Animation Loop ---

let totalTension = 0;

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Update physics
    points.forEach(p => p.update());

    for (let i = 0; i < iterations; i++) {
        constraints.forEach(c => c.resolve());
    }

    // Draw
    let currentTotalTension = 0;
    constraints.forEach(c => {
        c.draw();
        currentTotalTension += c.tension;
    });
    
    // Smooth tension bar update
    const avgTension = (currentTotalTension / constraints.length) * 1000;
    totalTension += (avgTension - totalTension) * 0.1;
    const barWidth = Math.min(totalTension * 2, 100);
    tensionBar.style.width = barWidth + '%';

    requestAnimationFrame(animate);
}

// --- Event Listeners ---

window.addEventListener('resize', resize);

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});

window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);

window.addEventListener('touchstart', (e) => {
    mouse.down = true;
    mouse.active = true;
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
}, { passive: false });

window.addEventListener('touchend', () => {
    mouse.down = false;
    mouse.active = false;
});

// Start the simulation
init();
