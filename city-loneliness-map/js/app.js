import { initMap } from './map.js';
import { initUI } from './ui.js';
import { initReport } from './report.js';

/* ========== 粒子背景 ========== */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const saveData = navigator.connection?.saveData;
  const compactViewport = window.matchMedia('(max-width: 768px)').matches;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || saveData || compactViewport) {
    canvas.hidden = true;
    return;
  }

  const ctx = canvas.getContext('2d');
  let width, height;
  const particles = [];
  const PARTICLE_COUNT = 45;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.15;
      this.speedY = (Math.random() - 0.5) * 0.15;
      this.opacity = Math.random() * 0.25 + 0.05;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(157, 179, 201, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(157, 179, 201, ${0.04 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

function prioritizeDashboard() {
  const hero = document.getElementById('hero');
  const dashboard = document.getElementById('dashboard');
  if (hero && dashboard && hero.nextElementSibling !== dashboard) {
    hero.insertAdjacentElement('afterend', dashboard);
  }
}

/* ========== 应用初始化 ========== */
document.addEventListener('DOMContentLoaded', () => {
  prioritizeDashboard();
  initParticles();
  initMap();
  initUI();
  initReport();
});
