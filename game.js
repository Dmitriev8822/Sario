/*
  Мини-игра-платформер для сайта-подарка.
  Всё редактируется в CONFIG ниже. Backend, npm и внешние библиотеки не нужны.
*/

const CONFIG = {
  birthdayName: "Именинник",
  finalTitle: "С днём рождения!",
  finalText:
    "Ты прошёл этот путь. Дальше — ещё больше хороших событий, сильных решений и людей рядом.",
  worldWidth: 9800,
  gravity: 2100,
  moveSpeed: 390,
  jumpSpeed: 820,
  player: {
    name: "Друг",
    shirt: "#2563eb",
    pants: "#1e293b",
    skin: "#f2c49b",
    hair: "#2b2118",
  },
  events: [
    {
      x: 520,
      title: "Старт пути",
      text: "Всё начинается с первого шага. Дальше — только вперёд.",
      kind: "start",
    },
    {
      x: 1400,
      title: "Первый универ",
      text: "Новая глава, новые люди и первые серьёзные решения.",
      kind: "university",
    },
    {
      x: 2400,
      title: "Второй универ",
      text: "Маршрут меняется, но движение продолжается.",
      kind: "university2",
    },
    {
      x: 3400,
      title: "Третий универ",
      text: "Опыт копится, история становится интереснее.",
      kind: "university3",
    },
    {
      x: 4550,
      title: "Работа в Сбере",
      text: "Появляется работа, ответственность и взрослые задачи.",
      kind: "work",
    },
    {
      x: 5650,
      title: "Встреча с другом",
      text: "Некоторые встречи становятся частью маршрута надолго.",
      kind: "friend",
    },
    {
      x: 6750,
      title: "Покатушки",
      text: "Дороги, разговоры и хорошие воспоминания в движении.",
      kind: "car",
    },
    {
      x: 7850,
      title: "Самолёт",
      text: "Иногда нужно взлететь, чтобы увидеть путь шире.",
      kind: "plane",
    },
    {
      x: 8850,
      title: "Переезд",
      text: "Новая точка на карте и ещё одна важная глава.",
      kind: "home",
    },
  ],
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameShell = document.getElementById("gameShell");
const finishScreen = document.getElementById("finishScreen");
const startButton = document.getElementById("startButton");
const howToButton = document.getElementById("howToButton");
const howToBox = document.getElementById("howToBox");
const restartButton = document.getElementById("restartButton");
const playAgainButton = document.getElementById("playAgainButton");
const scoreLabel = document.getElementById("scoreLabel");
const eventLabel = document.getElementById("eventLabel");
const eventCard = document.getElementById("eventCard");
const eventTitle = document.getElementById("eventTitle");
const eventText = document.getElementById("eventText");
const finishTitle = document.getElementById("finishTitle");
const finishText = document.getElementById("finishText");
const finishStats = document.getElementById("finishStats");

const VIEW = { width: 1280, height: 720 };
const FLOOR_Y = 612;
const PIXEL = 2;
const PALETTE = {
  ink: "#111827",
  sky1: "#60a5fa",
  sky2: "#7dd3fc",
  sky3: "#bae6fd",
  grass: "#4ade80",
  grassDark: "#15803d",
  dirt: "#92400e",
  dirtDark: "#713f12",
  wood: "#78350f",
  gold: "#facc15",
  goldDark: "#b45309",
  cloud: "#f8fafc",
};

ctx.imageSmoothingEnabled = false;

let keys = { left: false, right: false, jump: false };
let cameraX = 0;
let lastTime = 0;
let rafId = null;
let running = false;
let activeEventIndex = -1;
let eventCardTimer = 0;
let totalCoins = 0;

const state = {
  player: null,
  platforms: [],
  coins: [],
  checkpoints: [],
  particles: [],
  finished: false,
  startedAt: 0,
};

function createPlayer() {
  return {
    x: 80,
    y: FLOOR_Y - 96,
    w: 48,
    h: 86,
    vx: 0,
    vy: 0,
    grounded: false,
    direction: 1,
    checkpointX: 80,
    checkpointY: FLOOR_Y - 96,
    coins: 0,
    walkTime: 0,
  };
}

function createPlatforms() {
  const p = [];

  // Основная земля с небольшими разрывами.
  p.push({ x: -200, y: FLOOR_Y, w: 1350, h: 90, type: "ground" });
  p.push({ x: 1250, y: FLOOR_Y, w: 880, h: 90, type: "ground" });
  p.push({ x: 2250, y: FLOOR_Y, w: 950, h: 90, type: "ground" });
  p.push({ x: 3300, y: FLOOR_Y, w: 940, h: 90, type: "ground" });
  p.push({ x: 4350, y: FLOOR_Y, w: 980, h: 90, type: "ground" });
  p.push({ x: 5420, y: FLOOR_Y, w: 940, h: 90, type: "ground" });
  p.push({ x: 6500, y: FLOOR_Y, w: 920, h: 90, type: "ground" });
  p.push({ x: 7540, y: FLOOR_Y, w: 920, h: 90, type: "ground" });
  p.push({ x: 8580, y: FLOOR_Y, w: 1500, h: 90, type: "ground" });

  // Платформы, по которым нужно немного попрыгать.
  const floating = [
    [720, 500, 170],
    [1020, 425, 150],
    [1690, 485, 210],
    [2050, 410, 170],
    [2680, 490, 180],
    [3020, 425, 160],
    [3770, 485, 210],
    [4120, 415, 170],
    [4890, 492, 190],
    [5230, 430, 160],
    [6000, 492, 220],
    [6340, 422, 180],
    [7050, 500, 200],
    [7425, 430, 160],
    [8140, 490, 190],
    [8460, 420, 180],
    [9180, 492, 220],
  ];

  floating.forEach(([x, y, w]) => p.push({ x, y, w, h: 28, type: "platform" }));
  return p;
}

function createCoins() {
  const coins = [];
  CONFIG.events.forEach((event, index) => {
    for (let i = 0; i < 4; i += 1) {
      coins.push({
        x: event.x + 120 + i * 75,
        y: 360 + (i % 2) * 45,
        r: 15,
        collected: false,
        label: index + 1,
      });
    }
  });
  totalCoins = coins.length;
  return coins;
}

function resetGame() {
  cancelAnimationFrame(rafId);
  state.player = createPlayer();
  state.platforms = createPlatforms();
  state.coins = createCoins();
  state.checkpoints = CONFIG.events.map((event) => ({ x: event.x - 80, y: FLOOR_Y - 96 }));
  state.particles = [];
  state.finished = false;
  state.startedAt = performance.now();
  cameraX = 0;
  lastTime = 0;
  activeEventIndex = -1;
  eventCardTimer = 0;
  updateHud();
  hideEventCard();
}

function startGame() {
  resetGame();
  startScreen.hidden = true;
  finishScreen.hidden = true;
  gameShell.hidden = false;
  running = true;
  rafId = requestAnimationFrame(loop);
}

function finishGame() {
  running = false;
  state.finished = true;
  cancelAnimationFrame(rafId);
  const seconds = Math.round((performance.now() - state.startedAt) / 1000);
  gameShell.hidden = true;
  finishScreen.hidden = false;
  finishTitle.textContent = `${CONFIG.finalTitle} ${CONFIG.birthdayName}!`;
  finishText.textContent = CONFIG.finalText;
  finishStats.textContent = `Собрано воспоминаний: ${state.player.coins} / ${totalCoins}. Время прохождения: ${seconds} сек.`;
}

function loop(time) {
  if (!running) return;
  if (!lastTime) lastTime = time;
  const dt = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;
  update(dt);
  draw();
  rafId = requestAnimationFrame(loop);
}

function update(dt) {
  const player = state.player;
  const acceleration = 2800;
  const friction = player.grounded ? 0.82 : 0.94;

  if (keys.left) {
    player.vx -= acceleration * dt;
    player.direction = -1;
  }
  if (keys.right) {
    player.vx += acceleration * dt;
    player.direction = 1;
  }

  if (!keys.left && !keys.right) player.vx *= friction;

  player.vx = clamp(player.vx, -CONFIG.moveSpeed, CONFIG.moveSpeed);

  if (keys.jump && player.grounded) {
    player.vy = -CONFIG.jumpSpeed;
    player.grounded = false;
    spawnDust(player.x + player.w / 2, player.y + player.h);
  }

  player.vy += CONFIG.gravity * dt;

  movePlayer(player, dt);
  collectCoins(player);
  updateCamera();
  updateEvents(dt);
  updateParticles(dt);
  updateHud();

  if (player.y > VIEW.height + 240) respawn();
  if (player.x > CONFIG.worldWidth - 240) finishGame();
}

function movePlayer(player, dt) {
  player.grounded = false;

  player.x += player.vx * dt;
  resolveCollisions(player, "x");

  player.y += player.vy * dt;
  resolveCollisions(player, "y");

  player.x = clamp(player.x, 0, CONFIG.worldWidth - player.w);

  if (Math.abs(player.vx) > 10 && player.grounded) {
    player.walkTime += dt * 14;
  }
}

function resolveCollisions(player, axis) {
  for (const platform of state.platforms) {
    if (!rectsOverlap(player, platform)) continue;

    if (axis === "x") {
      if (player.vx > 0) player.x = platform.x - player.w;
      if (player.vx < 0) player.x = platform.x + platform.w;
      player.vx = 0;
    }

    if (axis === "y") {
      if (player.vy > 0) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
      } else if (player.vy < 0) {
        player.y = platform.y + platform.h;
        player.vy = 0;
      }
    }
  }
}

function collectCoins(player) {
  for (const coin of state.coins) {
    if (coin.collected) continue;
    const cx = coin.x;
    const cy = coin.y;
    const closestX = clamp(cx, player.x, player.x + player.w);
    const closestY = clamp(cy, player.y, player.y + player.h);
    const dx = cx - closestX;
    const dy = cy - closestY;

    if (dx * dx + dy * dy <= coin.r * coin.r) {
      coin.collected = true;
      player.coins += 1;
      spawnSparkles(coin.x, coin.y);
    }
  }
}

function updateCamera() {
  const target = state.player.x - VIEW.width * 0.42;
  cameraX += (target - cameraX) * 0.12;
  cameraX = clamp(cameraX, 0, CONFIG.worldWidth - VIEW.width);
}

function updateEvents(dt) {
  const playerCenter = state.player.x + state.player.w / 2;
  let currentIndex = -1;

  CONFIG.events.forEach((event, index) => {
    if (Math.abs(playerCenter - event.x) < 360) currentIndex = index;
    if (playerCenter > event.x - 60) {
      state.player.checkpointX = event.x - 120;
      state.player.checkpointY = FLOOR_Y - state.player.h;
    }
  });

  if (currentIndex !== -1 && currentIndex !== activeEventIndex) {
    activeEventIndex = currentIndex;
    showEventCard(CONFIG.events[currentIndex]);
    eventCardTimer = 5.5;
  }

  if (eventCardTimer > 0) {
    eventCardTimer -= dt;
    if (eventCardTimer <= 0) hideEventCard();
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 800 * dt;
    p.life -= dt;
    return p.life > 0;
  });
}

function respawn() {
  const p = state.player;
  p.x = p.checkpointX;
  p.y = p.checkpointY;
  p.vx = 0;
  p.vy = 0;
  spawnDust(p.x + p.w / 2, p.y + p.h);
}

function updateHud() {
  scoreLabel.textContent = `${state.player?.coins ?? 0} / ${totalCoins}`;
  eventLabel.textContent = activeEventIndex >= 0 ? CONFIG.events[activeEventIndex].title : "Старт";
}

function showEventCard(event) {
  eventTitle.textContent = event.title;
  eventText.textContent = event.text;
  eventCard.hidden = false;
}

function hideEventCard() {
  eventCard.hidden = true;
}

function draw() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawSky();
  drawParallax();
  drawEventScenes();
  drawFinishGate();
  drawPlatforms();
  drawCoins();
  drawParticles();
  drawPlayer();
  drawForeground();
}

function drawSky() {
  pixelRect(0, 0, VIEW.width, 150, PALETTE.sky1);
  pixelRect(0, 150, VIEW.width, 190, PALETTE.sky2);
  pixelRect(0, 340, VIEW.width, 200, PALETTE.sky3);
  pixelRect(0, 540, VIEW.width, 180, "#fde68a");
  for (let y = 48; y < 540; y += 64) {
    for (let x = (y / 2) % 32; x < VIEW.width; x += 96) {
      pixelRect(x, y, 2, 2, "rgba(255,255,255,0.24)");
    }
  }

  drawSun(1040 - cameraX * 0.03, 110);
  drawCloud(190 - cameraX * 0.12, 110, 1.1);
  drawCloud(620 - cameraX * 0.09, 145, 0.8);
  drawCloud(1030 - cameraX * 0.14, 95, 0.9);
  drawCloud(1540 - cameraX * 0.11, 130, 1.0);
}

function drawParallax() {
  // Дальние холмы.
  for (let i = -1; i < 12; i += 1) {
    const x = i * 520 - (cameraX * 0.18) % 520;
    pixelHill(x + 260, FLOOR_Y + 56, 340, 152, "#65a30d", "#4d7c0f");
  }

  // Ближние деревья.
  for (let i = -2; i < 28; i += 1) {
    const x = i * 410 - (cameraX * 0.42) % 410;
    drawTree(x + 80, 545, 0.8);
    drawTree(x + 250, 560, 0.62);
  }
}

function drawEventScenes() {
  CONFIG.events.forEach((event, index) => {
    const x = event.x - cameraX;
    if (x < -500 || x > VIEW.width + 500) return;

    drawEventBackdrop(x, event, index);
    drawSign(x, FLOOR_Y - 172, event.title, index + 1);
  });
}

function drawEventBackdrop(x, event, index) {
  const baseY = FLOOR_Y;

  switch (event.kind) {
    case "start":
      drawGiftScene(x, baseY);
      break;
    case "university":
    case "university2":
    case "university3":
      drawUniversity(x, baseY, index);
      break;
    case "work":
      drawOffice(x, baseY);
      break;
    case "friend":
      drawFriends(x, baseY);
      break;
    case "car":
      drawCarScene(x, baseY);
      break;
    case "plane":
      drawPlaneScene(x, baseY);
      break;
    case "home":
      drawHomeScene(x, baseY);
      break;
    default:
      drawGiftScene(x, baseY);
  }
}

function drawPlatforms() {
  state.platforms.forEach((p) => {
    const x = p.x - cameraX;
    if (x + p.w < -50 || x > VIEW.width + 50) return;

    if (p.type === "ground") {
      pixelRect(x, p.y, p.w, p.h, PALETTE.dirt);
      pixelRect(x, p.y - 20, p.w, 24, PALETTE.grass);
      pixelRect(x, p.y + 8, p.w, 10, PALETTE.dirtDark);
      for (let i = 0; i < p.w; i += 32) {
        pixelRect(x + i + 4, p.y - 16, 12, 8, "#86efac");
        pixelRect(x + i + 10, p.y + 30, 14, 6, "#a16207");
        pixelRect(x + i + 2, p.y + 58, 8, 6, PALETTE.dirtDark);
      }
    } else {
      pixelRect(x, p.y, p.w, p.h, PALETTE.wood);
      pixelRect(x, p.y - 8, p.w, 12, "#f59e0b");
      for (let i = 16; i < p.w; i += 48) pixelRect(x + i, p.y + 10, 24, 5, "#92400e");
    }
  });
}

function drawCoins() {
  const t = performance.now() / 1000;
  state.coins.forEach((coin) => {
    if (coin.collected) return;
    const x = coin.x - cameraX;
    if (x < -60 || x > VIEW.width + 60) return;
    const bob = Math.sin(t * 4 + coin.x * 0.03) * 6;
    const cy = coin.y + bob;
    pixelRect(x - 10, cy - 14, 20, 28, PALETTE.goldDark);
    pixelRect(x - 14, cy - 10, 28, 20, PALETTE.gold);
    pixelRect(x - 5, cy - 6, 6, 12, "#fff7ad");
  });
}

function drawPlayer() {
  const p = state.player;
  const x = p.x - cameraX;
  const y = p.y;
  const cfg = CONFIG.player;
  const step = p.grounded && Math.abs(p.vx) > 30 ? Math.sign(Math.sin(p.walkTime)) * 2 : 0;

  ctx.save();
  ctx.translate(x + p.w / 2, y + p.h / 2);
  ctx.scale(p.direction, 1);
  ctx.translate(-p.w / 2, -p.h / 2);

  pixelRect(8, 56, 12, 28 + step, cfg.pants);
  pixelRect(28, 56, 12, 28 - step, cfg.pants);
  pixelRect(4, 82 + Math.max(0, step), 18, 8, PALETTE.ink);
  pixelRect(26, 82 - Math.min(0, step), 18, 8, PALETTE.ink);
  pixelRect(7, 32, 36, 30, cfg.shirt);
  pixelRect(13, 38, 20, 5, "rgba(255,255,255,0.32)");
  pixelRect(12, 10, 28, 24, cfg.skin);
  pixelRect(10, 6, 30, 10, cfg.hair);
  pixelRect(8, 14, 10, 10, cfg.hair);
  pixelRect(30, 20, 3, 3, PALETTE.ink);
  pixelRect(29, 29, 9, 4, "#7c2d12");

  ctx.restore();

  // Имя над персонажем.
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  pixelRect(x - 8, y - 30, p.w + 16, 22, "rgba(15, 23, 42, 0.78)");
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 13px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.fillText(CONFIG.player.name, x + p.w / 2, y - 15);
}

function drawParticles() {
  state.particles.forEach((p) => {
    const x = p.x - cameraX;
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    pixelRect(x, p.y, p.size, p.size, p.color);
    ctx.globalAlpha = 1;
  });
}

function drawFinishGate() {
  const x = CONFIG.worldWidth - 280 - cameraX;
  if (x < -200 || x > VIEW.width + 200) return;

  pixelRect(x, FLOOR_Y - 170, 120, 170, "#7c3aed");
  pixelRect(x + 22, FLOOR_Y - 128, 76, 128, "#c4b5fd");
  pixelRect(x + 34, FLOOR_Y - 112, 52, 112, "#8b5cf6");
  ctx.fillStyle = "#facc15";
  ctx.font = "900 54px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.fillText("★", x + 60, FLOOR_Y - 92);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 20px Courier New, monospace";
  ctx.fillText("ФИНИШ", x + 60, FLOOR_Y - 28);
}

function drawForeground() {
  for (let x = -((cameraX * 0.9) % 72); x < VIEW.width; x += 72) {
    pixelRect(x, FLOOR_Y - 14, 10, 14, "#166534");
    pixelRect(x + 18, FLOOR_Y - 20, 8, 20, "#15803d");
    pixelRect(x + 42, FLOOR_Y - 12, 14, 12, "#166534");
  }
  pixelRect(0, 0, VIEW.width, 8, "rgba(15,23,42,0.18)");
  pixelRect(0, VIEW.height - 8, VIEW.width, 8, "rgba(15,23,42,0.18)");
  pixelRect(0, 0, 8, VIEW.height, "rgba(15,23,42,0.18)");
  pixelRect(VIEW.width - 8, 0, 8, VIEW.height, "rgba(15,23,42,0.18)");
}

function drawGiftScene(x, baseY) {
  drawBalloons(x - 130, baseY - 260);
  drawGift(x + 30, baseY - 102, 86, 80);
}

function drawUniversity(x, baseY, index) {
  const colors = ["#2563eb", "#16a34a", "#ea580c"];
  const color = colors[index % colors.length];
  pixelRect(x - 170, baseY - 255, 340, 255, "#f8fafc");
  pixelRect(x - 185, baseY - 255, 370, 24, color);
  for (let i = -120; i <= 120; i += 80) {
    pixelRect(x + i - 18, baseY - 195, 36, 56, "#334155");
    pixelRect(x + i - 18, baseY - 110, 36, 56, "#334155");
    pixelRect(x + i - 12, baseY - 189, 24, 8, "#bfdbfe");
    pixelRect(x + i - 12, baseY - 104, 24, 8, "#bfdbfe");
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 205, baseY - 255);
  ctx.lineTo(x, baseY - 335);
  ctx.lineTo(x + 205, baseY - 255);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.fillText("УНИ", x, baseY - 272);
}

function drawOffice(x, baseY) {
  pixelRect(x - 150, baseY - 320, 300, 320, "#1e40af");
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      pixelRect(x - 108 + col * 58, baseY - 275 + row * 42, 34, 24, "#93c5fd");
      pixelRect(x - 102 + col * 58, baseY - 269 + row * 42, 10, 5, "#dbeafe");
    }
  }
  ctx.fillStyle = "#22c55e";
  ctx.font = "900 46px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.fillText("С", x, baseY - 338);
}

function drawFriends(x, baseY) {
  drawSimplePerson(x - 70, baseY - 84, "#2563eb", "#f2c49b");
  drawSimplePerson(x + 50, baseY - 84, "#fb7185", "#f6d0a4");
  pixelRect(x - 34, baseY - 56, 18, 8, PALETTE.ink);
  pixelRect(x - 18, baseY - 48, 36, 8, PALETTE.ink);
  pixelRect(x + 18, baseY - 56, 18, 8, PALETTE.ink);
}

function drawCarScene(x, baseY) {
  pixelRect(x - 220, baseY - 28, 440, 12, "#334155");
  for (let i = -190; i < 210; i += 70) pixelRect(x + i, baseY - 24, 38, 4, "#f8fafc");
  pixelRect(x - 120, baseY - 92, 240, 62, "#ef4444");
  pixelRect(x - 70, baseY - 130, 116, 44, "#fca5a5");
  pixelRect(x - 50, baseY - 122, 42, 28, "#bfdbfe");
  pixelRect(x, baseY - 122, 38, 28, "#bfdbfe");
  drawWheel(x - 72, baseY - 28);
  drawWheel(x + 78, baseY - 28);
}

function drawPlaneScene(x, baseY) {
  ctx.save();
  ctx.translate(x, baseY - 245);
  ctx.rotate(-0.14);
  pixelRect(-145, -22, 290, 44, "#f8fafc");
  ctx.fillStyle = "#2563eb";
  ctx.beginPath();
  ctx.moveTo(-20, 10);
  ctx.lineTo(80, 96);
  ctx.lineTo(35, 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-45, -10);
  ctx.lineTo(48, -100);
  ctx.lineTo(25, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.moveTo(125, -20);
  ctx.lineTo(172, -68);
  ctx.lineTo(145, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHomeScene(x, baseY) {
  pixelRect(x - 145, baseY - 210, 290, 210, "#fef3c7");
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.moveTo(x - 185, baseY - 210);
  ctx.lineTo(x, baseY - 330);
  ctx.lineTo(x + 185, baseY - 210);
  ctx.closePath();
  ctx.fill();
  pixelRect(x - 34, baseY - 92, 68, 92, "#92400e");
  pixelRect(x - 110, baseY - 168, 58, 54, "#60a5fa");
  pixelRect(x + 52, baseY - 168, 58, 54, "#60a5fa");
}

function drawSign(x, y, title, number) {
  pixelRect(x - 7, y + 48, 14, 95, PALETTE.wood);
  pixelRect(x - 155, y, 310, 70, "#fff7d6");
  pixelRect(x - 155, y, 310, 5, PALETTE.wood);
  pixelRect(x - 155, y + 65, 310, 5, PALETTE.wood);
  pixelRect(x - 155, y, 5, 70, PALETTE.wood);
  pixelRect(x + 150, y, 5, 70, PALETTE.wood);
  ctx.fillStyle = "#2563eb";
  ctx.font = "900 18px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Этап ${number}`, x, y + 25);
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 20px Courier New, monospace";
  ctx.fillText(title, x, y + 52);
}

function drawSimplePerson(x, y, shirt, skin) {
  pixelRect(x - 22, y + 32, 44, 50, shirt);
  pixelRect(x - 18, y, 36, 30, skin);
  pixelRect(x - 22, y - 4, 40, 10, "#111827");
  pixelRect(x - 8, y + 14, 3, 3, PALETTE.ink);
  pixelRect(x + 7, y + 14, 3, 3, PALETTE.ink);
}

function drawGift(x, y, w, h) {
  pixelRect(x - w / 2, y, w, h, "#ef4444");
  pixelRect(x - 8, y, 16, h, PALETTE.gold);
  pixelRect(x - w / 2, y + 28, w, 14, PALETTE.gold);
  pixelRect(x - 34, y - 18, 24, 16, PALETTE.gold);
  pixelRect(x + 10, y - 18, 24, 16, PALETTE.gold);
}

function drawBalloons(x, y) {
  const balloons = [
    [0, 0, "#f43f5e"],
    [42, -28, "#2563eb"],
    [88, 4, "#facc15"],
  ];
  balloons.forEach(([dx, dy, color]) => {
    for (let i = 0; i < 7; i += 1) {
      pixelRect(x + dx + (i % 2 ? 3 : -3), y + dy + 36 + i * 14, 2, 14, "rgba(15,23,42,0.4)");
    }
    pixelRect(x + dx - 20, y + dy - 28, 40, 56, color);
    pixelRect(x + dx - 12, y + dy + 28, 24, 8, color);
    pixelRect(x + dx - 12, y + dy - 20, 8, 10, "rgba(255,255,255,0.28)");
  });
}

function drawWheel(x, y) {
  pixelRect(x - 24, y - 24, 48, 48, PALETTE.ink);
  pixelRect(x - 12, y - 12, 24, 24, "#e2e8f0");
}

function drawSun(x, y) {
  pixelRect(x - 34, y - 34, 68, 68, "rgba(250, 204, 21, 0.92)");
  pixelRect(x - 46, y - 14, 12, 28, "rgba(250, 204, 21, 0.92)");
  pixelRect(x + 34, y - 14, 12, 28, "rgba(250, 204, 21, 0.92)");
  pixelRect(x - 14, y - 46, 28, 12, "rgba(250, 204, 21, 0.92)");
  pixelRect(x - 14, y + 34, 28, 12, "rgba(250, 204, 21, 0.92)");
}

function drawCloud(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  pixelRect(-4, 24, 92, 28, "rgba(255,255,255,0.86)");
  pixelRect(8, 8, 28, 18, "rgba(255,255,255,0.86)");
  pixelRect(34, 0, 36, 28, "rgba(255,255,255,0.86)");
  pixelRect(68, 14, 30, 24, "rgba(255,255,255,0.86)");
  pixelRect(8, 44, 74, 8, "#dbeafe");
  ctx.restore();
}

function drawTree(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  pixelRect(-9, -52, 18, 52, "#854d0e");
  pixelRect(-36, -92, 72, 32, "#16a34a");
  pixelRect(-52, -68, 104, 30, "#15803d");
  pixelRect(-30, -106, 60, 22, "#22c55e");
  ctx.restore();
}

function spawnSparkles(x, y) {
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * random(80, 220),
      vy: Math.sin(angle) * random(80, 220),
      size: random(3, 7),
      life: random(0.35, 0.8),
      maxLife: 0.8,
      color: i % 2 ? "#facc15" : "#ffffff",
    });
  }
}

function spawnDust(x, y) {
  for (let i = 0; i < 8; i += 1) {
    state.particles.push({
      x: x + random(-12, 12),
      y,
      vx: random(-90, 90),
      vy: random(-220, -80),
      size: random(4, 9),
      life: random(0.25, 0.55),
      maxLife: 0.55,
      color: "rgba(120, 53, 15, 0.45)",
    });
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function snap(value) {
  return Math.round(value / PIXEL) * PIXEL;
}

function pixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), snap(w), snap(h));
}

function pixelHill(cx, baseY, width, height, color, shadow) {
  for (let row = 0; row < height; row += PIXEL) {
    const t = row / height;
    const half = (width / 2) * Math.sin(t * Math.PI);
    const y = baseY - row;
    pixelRect(cx - half, y, half * 2, PIXEL, color);
    if (row > height * 0.45) pixelRect(cx + half * 0.25, y, half * 0.55, PIXEL, shadow);
  }
}

function setKey(code, value) {
  if (["ArrowLeft", "KeyA"].includes(code)) keys.left = value;
  if (["ArrowRight", "KeyD"].includes(code)) keys.right = value;
  if (["ArrowUp", "KeyW", "Space"].includes(code)) keys.jump = value;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(event.code)) {
    event.preventDefault();
    setKey(event.code, true);
  }
});

window.addEventListener("keyup", (event) => {
  setKey(event.code, false);
});

function bindMobileControls() {
  document.querySelectorAll(".mobile-button").forEach((button) => {
    const control = button.dataset.control;
    const set = (value) => {
      if (control === "left") keys.left = value;
      if (control === "right") keys.right = value;
      if (control === "jump") keys.jump = value;
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      set(true);
      button.setPointerCapture?.(event.pointerId);
    });
    button.addEventListener("pointerup", () => set(false));
    button.addEventListener("pointercancel", () => set(false));
    button.addEventListener("pointerleave", () => set(false));
  });
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
howToButton.addEventListener("click", () => {
  howToBox.hidden = !howToBox.hidden;
});

bindMobileControls();
resetGame();
draw();
