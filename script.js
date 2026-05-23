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

/* ══════════════════════════════════════
   3D TILT + PARALLAX + CARD SHINE
══════════════════════════════════════ */
const tiltWrapper = document.getElementById('tiltWrapper');
const profileEl   = document.getElementById('profileEl');
const avatarEl    = document.getElementById('avatarEl');
const cards       = document.querySelectorAll('.link-btn');

// Global page tilt (whole content block tilts with mouse)
let tiltX = 0, tiltY = 0;
let tiltTargetX = 0, tiltTargetY = 0;

document.addEventListener('mousemove', (e) => {
  // Normalize mouse position -1 to +1 relative to viewport center
  const nx = (e.clientX / W - 0.5) * 2;
  const ny = (e.clientY / H - 0.5) * 2;

  // Global tilt: subtle, max ±6deg
  tiltTargetY =  nx * 6;
  tiltTargetX = -ny * 6;

  // Parallax for profile (floats opposite direction slightly)
  profileEl.style.transform = `translate(${nx * -8}px, ${ny * -8}px)`;
  avatarEl.style.transform  = `translate(${nx * -4}px, ${ny * -4}px) scale(1.02)`;
});

// Smooth tilt animation loop
function updateTilt() {
  tiltX += (tiltTargetX - tiltX) * 0.07;
  tiltY += (tiltTargetY - tiltY) * 0.07;
  tiltWrapper.style.transform =
    `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  requestAnimationFrame(updateTilt);
}
updateTilt();

// Reset tilt when mouse leaves window
document.addEventListener('mouseleave', () => {
  tiltTargetX = 0;
  tiltTargetY = 0;
  profileEl.style.transform = '';
  avatarEl.style.transform  = '';
});

// Per-card 3D tilt + shine on hover
cards.forEach(card => {
  const shine = card.querySelector('.shine');

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const nx = (cx / rect.width  - 0.5) * 2; // -1 to +1
    const ny = (cy / rect.height - 0.5) * 2;

    // Card tilts up to ±10deg
    const rotX = -ny * 10;
    const rotY =  nx * 10;

    card.style.transform =
      `translateY(-4px) scale(1.02) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    card.style.transition = 'box-shadow 0.3s, border-color 0.3s';

    // Shine follows cursor inside card
    if (shine) {
      const px = (cx / rect.width  * 100).toFixed(1);
      const py = (cy / rect.height * 100).toFixed(1);
      shine.style.background =
        `radial-gradient(circle at ${px}% ${py}%, rgba(0,195,255,0.18) 0%, transparent 55%)`;
    }
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform  = '';
    card.style.transition = 'transform 0.5s ease, box-shadow 0.3s, border-color 0.3s';
    if (shine) shine.style.background = '';
  });
});

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
