const GRAVITY = 0.62;
const MOVE_SPEED = 4.3;
const JUMP_POWER = 13;
const LEVEL_SCALE = 20;
const BASE_LEVEL_WIDTH = 1800;
const REQUIRED_STARS = 100;
const LEVEL_WIDTH = BASE_LEVEL_WIDTH * LEVEL_SCALE;
const LEVEL_HEIGHT = 540;

function buildLevel() {
  const platforms = [{ x: 0, y: 492, w: LEVEL_WIDTH, h: 48 }];
  const stars = [];
  const pattern = [390, 330, 405, 325, 372, 285, 420, 350, 302, 392];
  const platformCount = REQUIRED_STARS;
  const spacing = (LEVEL_WIDTH - 520) / platformCount;

  for (let i = 0; i < platformCount; i += 1) {
    const x = Math.round(230 + i * spacing + (i % 4) * 18);
    const y = pattern[i % pattern.length];
    const w = 145 + (i % 5) * 18;
    platforms.push({ x, y, w, h: 28 });
    stars.push({ x: x + Math.floor(w / 2), y: y - 60 });

    if (i % 6 === 3) {
      platforms.push({ x: x + 150, y: Math.max(260, y - 76), w: 92, h: 24 });
    }
  }

  return {
    width: LEVEL_WIDTH,
    height: LEVEL_HEIGHT,
    platforms,
    stars,
    gift: { x: LEVEL_WIDTH - 140, y: 420, w: 54, h: 72 }
  };
}

const level = buildLevel();

export class PixelPlatformer {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.keys = new Set();
    this.running = false;
    this.lastTime = 0;
    this.elapsed = 0;
    this.cameraX = 0;
    this.loop = this.loop.bind(this);
    this.bindInput();
    this.reset();
  }

  bindInput() {
    addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
    });
    addEventListener('keyup', (event) => this.keys.delete(event.code));
    document.querySelectorAll('[data-touch]').forEach((button) => {
      const code = { left: 'ArrowLeft', right: 'ArrowRight', jump: 'Space' }[button.dataset.touch];
      const press = (event) => { event.preventDefault(); this.keys.add(code); };
      const release = (event) => { event.preventDefault(); this.keys.delete(code); };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    });
  }

  reset() {
    this.player = { x: 64, y: 380, w: 36, h: 52, vx: 0, vy: 0, grounded: false, facing: 1 };
    this.stars = level.stars.map((star) => ({ ...star, collected: false }));
    this.collected = 0;
    this.elapsed = 0;
    this.cameraX = 0;
    this.won = false;
    this.ui.message.hidden = true;
    this.updateHud();
    this.draw();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  stop() { this.running = false; }

  loop(time) {
    if (!this.running) return;
    const delta = Math.min((time - this.lastTime) / 16.67, 2);
    this.lastTime = time;
    if (!this.won) {
      this.elapsed += delta / 60;
      this.update(delta);
    }
    this.draw();
    requestAnimationFrame(this.loop);
  }

  update(delta) {
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    const jump = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');

    this.player.vx = (right - left) * MOVE_SPEED;
    if (this.player.vx) this.player.facing = Math.sign(this.player.vx);
    if (jump && this.player.grounded) {
      this.player.vy = -JUMP_POWER;
      this.player.grounded = false;
    }

    this.player.vy += GRAVITY * delta;
    this.player.x += this.player.vx * delta;
    this.resolve('x');
    this.player.y += this.player.vy * delta;
    this.player.grounded = false;
    this.resolve('y');

    this.player.x = Math.max(0, Math.min(level.width - this.player.w, this.player.x));
    this.cameraX = Math.max(0, Math.min(level.width - this.canvas.width, this.player.x - this.canvas.width * 0.42));
    this.collectStars();
    this.checkGift();
    this.updateHud();
  }

  resolve(axis) {
    for (const platform of level.platforms) {
      if (!this.intersects(this.player, platform)) continue;
      if (axis === 'x') {
        if (this.player.vx > 0) this.player.x = platform.x - this.player.w;
        if (this.player.vx < 0) this.player.x = platform.x + platform.w;
      } else if (this.player.vy > 0) {
        this.player.y = platform.y - this.player.h;
        this.player.vy = 0;
        this.player.grounded = true;
      } else if (this.player.vy < 0) {
        this.player.y = platform.y + platform.h;
        this.player.vy = 0;
      }
    }
  }

  collectStars() {
    for (const star of this.stars) {
      if (!star.collected && this.intersects(this.player, { x: star.x - 14, y: star.y - 14, w: 28, h: 28 })) {
        star.collected = true;
        this.collected += 1;
      }
    }
  }

  checkGift() {
    if (this.collected >= REQUIRED_STARS && this.intersects(this.player, level.gift)) {
      this.won = true;
      this.ui.message.innerHTML = 'С днём рождения!<br>Пусть каждый уровень будет ярким, а бонусы — бесконечными ✨';
      this.ui.message.hidden = false;
    }
  }

  updateHud() {
    this.ui.stars.textContent = this.collected;
    const minutes = Math.floor(this.elapsed / 60).toString().padStart(2, '0');
    const seconds = Math.floor(this.elapsed % 60).toString().padStart(2, '0');
    this.ui.time.textContent = `${minutes}:${seconds}`;
  }

  intersects(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.drawWorld(ctx);
    ctx.restore();
  }

  drawWorld(ctx) {
    ctx.fillStyle = '#151a22'; ctx.fillRect(this.cameraX, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#243447';
    ctx.fillRect(this.cameraX, 0, this.canvas.width, 170);
    ctx.fillStyle = '#56616f';
    for (let i = 0; i < LEVEL_SCALE * 8; i++) ctx.fillRect(i * 260 + 45, 70 + (i % 3) * 28, 100, 24);
    level.platforms.forEach((p) => this.drawBlock(ctx, p.x, p.y, p.w, p.h, '#556b2f', '#0b0f14'));
    this.stars.filter((s) => !s.collected).forEach((s) => this.drawStar(ctx, s.x, s.y));
    this.drawGift(ctx, level.gift);
    this.drawPlayer(ctx);
  }

  drawBlock(ctx, x, y, w, h, fill, stroke) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.strokeStyle = stroke; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h); }
  drawStar(ctx, x, y) { ctx.fillStyle = '#ffd94d'; ctx.fillRect(x - 6, y - 18, 12, 36); ctx.fillRect(x - 18, y - 6, 36, 12); ctx.fillRect(x - 12, y - 12, 24, 24); ctx.strokeStyle = '#8d5d00'; ctx.strokeRect(x - 12, y - 12, 24, 24); }
  drawGift(ctx, g) { this.drawBlock(ctx, g.x, g.y, g.w, g.h, this.collected >= REQUIRED_STARS ? '#b15f2a' : '#56616f', '#0b0f14'); ctx.fillStyle = '#d9c58a'; ctx.fillRect(g.x + 22, g.y, 10, g.h); ctx.fillRect(g.x, g.y + 22, g.w, 10); }
  drawPlayer(ctx) { const p = this.player; this.drawBlock(ctx, p.x, p.y + 14, p.w, p.h - 14, '#2f5f8f', '#0b0f14'); ctx.fillStyle = '#d9c58a'; ctx.fillRect(p.x + 8, p.y, 22, 22); ctx.fillStyle = '#0b0f14'; ctx.fillRect(p.x + (p.facing > 0 ? 23 : 9), p.y + 8, 5, 5); ctx.fillStyle = '#1d2f45'; ctx.fillRect(p.x + 5, p.y + 38, 10, 14); ctx.fillRect(p.x + 22, p.y + 38, 10, 14); }
}
