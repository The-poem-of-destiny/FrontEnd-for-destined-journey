export interface ParticleEngine {
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

interface CreateParticleEngineOptions {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  tier: number;
  colorHex: string;
  isIOSSafari?: boolean;
}

export function createParticleEngine(options: CreateParticleEngineOptions): ParticleEngine {
  const { canvas, host, tier, colorHex, isIOSSafari = false } = options;
  const context = canvas.getContext('2d');

  if (!context) {
    return {
      start: () => {},
      stop: () => {},
      destroy: () => {},
    };
  }

  const ctx: CanvasRenderingContext2D = context;

  let mode = 0;
  const t = parseInt(String(tier), 10);

  if (t === 3 || t === 4) mode = 1;
  else if (t === 5) mode = 2;
  else if (t === 6) mode = 3;
  else if (t >= 7) mode = 4;

  if (mode === 0) mode = 1;

  const baseParticleCount = window.innerWidth < 600 ? 15 : 30;
  const PARTICLE_COUNT = t <= 2 ? Math.max(8, Math.floor(baseParticleCount * 0.55)) : baseParticleCount;

  let r = 255;
  let g = 255;
  let b = 255;

  const hexColor = (colorHex || '#ffffff').replace(/^#/, '');
  if (hexColor.length === 6) {
    r = parseInt(hexColor.substring(0, 2), 16);
    g = parseInt(hexColor.substring(2, 4), 16);
    b = parseInt(hexColor.substring(4, 6), 16);
  }

  let raf = 0;
  let isRunning = false;
  let isVisible = true;

  class Particle {
    x = 0;
    y = 0;
    size = 2;
    speedY = 0.2;
    sway = 0.2;
    opacity = 0.2;

    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.opacity = Math.random() * 0.4 + 0.1;
      if (isIOSSafari) this.opacity = Math.min(0.9, this.opacity + 0.18);

      if (mode === 1) {
        this.y = initial ? Math.random() * canvas.height : canvas.height + 20;
        this.size = Math.random() * 4 + 2;
        this.speedY = Math.random() * 0.4 + 0.1;
        this.sway = Math.random() * 0.2;
      } else if (mode === 2) {
        this.y = initial ? Math.random() * canvas.height : -10;
        this.size = Math.random() * 5 + 3;
        this.speedY = Math.random() * 1 + 0.5;
        this.sway = Math.random() * 0.5;
      } else if (mode === 3) {
        this.y = initial ? Math.random() * canvas.height : canvas.height + 20;
        this.size = Math.random() * 4 + 2;
        this.speedY = Math.random() * 0.8 + 0.2;
        this.sway = Math.random() * 0.1;
      } else {
        this.y = initial ? Math.random() * canvas.height : canvas.height + 20;
        this.size = Math.random() * 8 + 4;
        this.speedY = Math.random() * 1 + 0.5;
        this.sway = Math.random() * 0.2;
      }
    }

    update() {
      if (mode === 2) {
        this.y += this.speedY;
        this.x += Math.sin(this.y * 0.02) * this.sway;
        if (this.y > canvas.height) this.reset(false);
      } else {
        this.y -= this.speedY;
        this.x += Math.sin(this.y * 0.01) * (this.sway || 0.2);
        if (this.y < -50) this.reset(false);
      }
    }

    draw() {
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      if (mode === 4 || mode === 1) {
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity})`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      } else {
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity})`);
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

  const resize = () => {
    canvas.width = host.offsetWidth;
    canvas.height = host.offsetHeight;
  };

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(host);
  resize();

  const visibilityObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible && isRunning) loop();
      });
    },
    { rootMargin: '50px' },
  );
  visibilityObserver.observe(host);

  const loop = () => {
    if (!isRunning || !isVisible) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    raf = requestAnimationFrame(loop);
  };

  return {
    start() {
      if (isRunning) return;
      isRunning = true;
      loop();
    },
    stop() {
      isRunning = false;
      if (raf) cancelAnimationFrame(raf);
    },
    destroy() {
      this.stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
