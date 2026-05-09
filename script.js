/* ══════════════════════════════════════
   MOUSE TRACKER + PARTICLE BACKGROUND
══════════════════════════════════════ */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
const cursorGlow = document.getElementById('cursorGlow');

let W = window.innerWidth, H = window.innerHeight;
let mouse = { x: W / 2, y: H / 2 };

canvas.width = W;
canvas.height = H;

window.addEventListener('resize', () => {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
});

/* ── Cursor glow follow ── */
let targetX = W / 2, targetY = H / 2;
let currentX = W / 2, currentY = H / 2;

document.addEventListener('mousemove', (e) => {
  targetX = e.clientX;
  targetY = e.clientY;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/* ── Particles ── */
const PARTICLE_COUNT = 60;
const particles = [];

class Particle {
  constructor() { this.reset(true); }

  reset(initial = false) {
    this.x = Math.random() * W;
    this.y = initial ? Math.random() * H : H + 10;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -(Math.random() * 0.5 + 0.2);
    this.size = Math.random() * 1.8 + 0.4;
    this.alpha = Math.random() * 0.6 + 0.1;
    this.life = 0;
    this.maxLife = Math.random() * 300 + 150;
    this.color = Math.random() > 0.3 ? '#00c3ff' : '#0077ff';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    if (this.life > this.maxLife || this.y < -10) this.reset();

    /* repel from mouse */
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      const force = (120 - dist) / 120;
      this.vx += (dx / dist) * force * 0.3;
      this.vy += (dy / dist) * force * 0.3;
    }

    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  draw() {
    const fade = Math.min(this.life / 40, 1) * Math.min((this.maxLife - this.life) / 40, 1);
    ctx.save();
    ctx.globalAlpha = this.alpha * fade;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

/* ── Mouse trail ── */
const trail = [];
const TRAIL_MAX = 24;

/* ── Mouse ripples ── */
const ripples = [];

document.addEventListener('mousemove', () => {
  trail.push({ x: mouse.x, y: mouse.y, life: 1 });
  if (trail.length > TRAIL_MAX) trail.shift();

  if (Math.random() > 0.92) {
    ripples.push({ x: mouse.x, y: mouse.y, r: 0, alpha: 0.5 });
  }
});

/* ── Main render loop ── */
function render() {
  ctx.clearRect(0, 0, W, H);

  /* subtle radial bg under cursor */
  const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 400);
  grad.addColorStop(0, 'rgba(0,100,200,0.04)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  /* corner vignettes */
  ['top-left','top-right','bottom-left','bottom-right'].forEach((pos, i) => {
    const cx2 = i % 2 === 0 ? 0 : W;
    const cy2 = i < 2 ? 0 : H;
    const vg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 350);
    vg.addColorStop(0, 'rgba(0,60,150,0.04)');
    vg.addColorStop(1, 'transparent');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  });

  /* particles */
  particles.forEach(p => { p.update(); p.draw(); });

  /* connection lines between nearby particles */
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 100) {
        ctx.save();
        ctx.globalAlpha = (1 - d / 100) * 0.12;
        ctx.strokeStyle = '#00c3ff';
        ctx.lineWidth = 0.5;
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#00c3ff';
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /* mouse trail */
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const ratio = i / trail.length;
    ctx.save();
    ctx.globalAlpha = ratio * 0.25;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00c3ff';
    ctx.fillStyle = '#00c3ff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, ratio * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ripples */
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.r += 2.5;
    rp.alpha -= 0.018;
    if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = rp.alpha;
    ctx.strokeStyle = '#00c3ff';
    ctx.lineWidth = 0.8;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00c3ff';
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* smooth cursor glow follow */
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;
  cursorGlow.style.left = currentX + 'px';
  cursorGlow.style.top  = currentY + 'px';

  requestAnimationFrame(render);
}

render();

/* ── Entry animations ── */
document.querySelectorAll('.link-btn').forEach((btn, i) => {
  btn.style.opacity = '0';
  btn.style.transform = 'translateY(20px)';
  btn.style.transition = `opacity 0.5s ease ${0.1 + i * 0.08}s, transform 0.5s ease ${0.1 + i * 0.08}s, border-color 0.3s, box-shadow 0.3s`;
  setTimeout(() => {
    btn.style.opacity = '1';
    btn.style.transform = 'translateY(0)';
  }, 50);
});
