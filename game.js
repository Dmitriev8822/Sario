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
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  gradient.addColorStop(0, "#7dd3fc");
  gradient.addColorStop(0.58, "#bae6fd");
  gradient.addColorStop(1, "#fef3c7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  drawSun(1040 - cameraX * 0.03, 110);
  drawCloud(190 - cameraX * 0.12, 110, 1.1);
  drawCloud(620 - cameraX * 0.09, 145, 0.8);
  drawCloud(1030 - cameraX * 0.14, 95, 0.9);
  drawCloud(1540 - cameraX * 0.11, 130, 1.0);
}

function drawParallax() {
  // Дальние холмы.
  ctx.fillStyle = "#65a30d";
  for (let i = -1; i < 12; i += 1) {
    const x = i * 520 - (cameraX * 0.18) % 520;
    ctx.beginPath();
    ctx.ellipse(x + 260, FLOOR_Y + 30, 330, 170, 0, Math.PI, 0);
    ctx.fill();
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
      ctx.fillStyle = "#7c4a20";
      roundRect(x, p.y, p.w, p.h, 0, true);
      ctx.fillStyle = "#22c55e";
      roundRect(x, p.y - 18, p.w, 28, 12, true);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let i = 20; i < p.w; i += 80) {
        ctx.fillRect(x + i, p.y + 24, 42, 8);
      }
    } else {
      ctx.fillStyle = "#92400e";
      roundRect(x, p.y, p.w, p.h, 10, true);
      ctx.fillStyle = "#f59e0b";
      roundRect(x, p.y - 7, p.w, 12, 8, true);
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
    ctx.save();
    ctx.translate(x, coin.y + bob);
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(0, 0, coin.r * 0.75, coin.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff7ad";
    ctx.beginPath();
    ctx.ellipse(-4, -5, 4, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPlayer() {
  const p = state.player;
  const x = p.x - cameraX;
  const y = p.y;
  const cfg = CONFIG.player;
  const legOffset = Math.sin(p.walkTime) * 6;

  ctx.save();
  ctx.translate(x + p.w / 2, y + p.h / 2);
  ctx.scale(p.direction, 1);
  ctx.translate(-p.w / 2, -p.h / 2);

  // Ноги.
  ctx.fillStyle = cfg.pants;
  roundRect(10, 54, 12, 30 + legOffset * 0.25, 5, true);
  roundRect(27, 54, 12, 30 - legOffset * 0.25, 5, true);
  ctx.fillStyle = "#0f172a";
  roundRect(6, 80 + Math.max(0, legOffset * 0.12), 18, 8, 4, true);
  roundRect(25, 80 - Math.min(0, legOffset * 0.12), 18, 8, 4, true);

  // Тело.
  ctx.fillStyle = cfg.shirt;
  roundRect(7, 32, 36, 34, 10, true);
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  roundRect(14, 39, 20, 5, 4, true);

  // Голова.
  ctx.fillStyle = cfg.skin;
  ctx.beginPath();
  ctx.arc(25, 20, 17, 0, Math.PI * 2);
  ctx.fill();

  // Волосы.
  ctx.fillStyle = cfg.hair;
  ctx.beginPath();
  ctx.arc(23, 12, 16, Math.PI, Math.PI * 2);
  ctx.fill();
  roundRect(10, 11, 30, 10, 8, true);

  // Лицо.
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(31, 21, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7c2d12";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(30, 28, 4, 0.1, Math.PI - 0.1);
  ctx.stroke();

  ctx.restore();

  // Имя над персонажем.
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  roundRect(x - 8, y - 30, p.w + 16, 22, 11, true);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(CONFIG.player.name, x + p.w / 2, y - 15);
}

function drawParticles() {
  state.particles.forEach((p) => {
    const x = p.x - cameraX;
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawFinishGate() {
  const x = CONFIG.worldWidth - 280 - cameraX;
  if (x < -200 || x > VIEW.width + 200) return;

  ctx.fillStyle = "#7c3aed";
  roundRect(x, FLOOR_Y - 170, 120, 170, 20, true);
  ctx.fillStyle = "#c4b5fd";
  roundRect(x + 22, FLOOR_Y - 128, 76, 128, 38, true);
  ctx.fillStyle = "#facc15";
  ctx.font = "900 54px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★", x + 60, FLOOR_Y - 92);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 20px Inter, sans-serif";
  ctx.fillText("ФИНИШ", x + 60, FLOOR_Y - 28);
}

function drawForeground() {
  // Лёгкая виньетка.
  const gradient = ctx.createRadialGradient(
    VIEW.width / 2,
    VIEW.height / 2,
    VIEW.height * 0.3,
    VIEW.width / 2,
    VIEW.height / 2,
    VIEW.height * 0.85
  );
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(15,23,42,0.10)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawGiftScene(x, baseY) {
  drawBalloons(x - 130, baseY - 260);
  drawGift(x + 30, baseY - 102, 86, 80);
}

function drawUniversity(x, baseY, index) {
  const colors = ["#2563eb", "#16a34a", "#ea580c"];
  const color = colors[index % colors.length];
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  roundRect(x - 170, baseY - 255, 340, 255, 16, true);
  ctx.fillStyle = color;
  ctx.fillRect(x - 185, baseY - 255, 370, 24);
  ctx.fillStyle = "#334155";
  for (let i = -120; i <= 120; i += 80) {
    roundRect(x + i - 18, baseY - 195, 36, 56, 7, true);
    roundRect(x + i - 18, baseY - 110, 36, 56, 7, true);
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 205, baseY - 255);
  ctx.lineTo(x, baseY - 335);
  ctx.lineTo(x + 205, baseY - 255);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("УНИ", x, baseY - 272);
}

function drawOffice(x, baseY) {
  ctx.fillStyle = "#1e40af";
  roundRect(x - 150, baseY - 320, 300, 320, 14, true);
  ctx.fillStyle = "#93c5fd";
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      roundRect(x - 108 + col * 58, baseY - 275 + row * 42, 34, 24, 5, true);
    }
  }
  ctx.fillStyle = "#22c55e";
  ctx.font = "900 46px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("С", x, baseY - 338);
}

function drawFriends(x, baseY) {
  drawSimplePerson(x - 70, baseY - 84, "#2563eb", "#f2c49b");
  drawSimplePerson(x + 50, baseY - 84, "#fb7185", "#f6d0a4");
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - 35, baseY - 55);
  ctx.quadraticCurveTo(x, baseY - 22, x + 32, baseY - 55);
  ctx.stroke();
}

function drawCarScene(x, baseY) {
  ctx.fillStyle = "#334155";
  ctx.fillRect(x - 220, baseY - 26, 440, 10);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 4;
  for (let i = -190; i < 210; i += 70) {
    ctx.beginPath();
    ctx.moveTo(x + i, baseY - 21);
    ctx.lineTo(x + i + 38, baseY - 21);
    ctx.stroke();
  }

  ctx.fillStyle = "#ef4444";
  roundRect(x - 120, baseY - 92, 240, 62, 18, true);
  ctx.fillStyle = "#fca5a5";
  roundRect(x - 62, baseY - 130, 108, 52, 14, true);
  ctx.fillStyle = "#bfdbfe";
  roundRect(x - 50, baseY - 122, 42, 34, 8, true);
  roundRect(x, baseY - 122, 38, 34, 8, true);
  drawWheel(x - 72, baseY - 28);
  drawWheel(x + 78, baseY - 28);
}

function drawPlaneScene(x, baseY) {
  ctx.save();
  ctx.translate(x, baseY - 245);
  ctx.rotate(-0.14);
  ctx.fillStyle = "#f8fafc";
  roundRect(-145, -22, 290, 44, 22, true);
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
  ctx.fillStyle = "#fef3c7";
  roundRect(x - 145, baseY - 210, 290, 210, 16, true);
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.moveTo(x - 185, baseY - 210);
  ctx.lineTo(x, baseY - 330);
  ctx.lineTo(x + 185, baseY - 210);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#92400e";
  roundRect(x - 34, baseY - 92, 68, 92, 10, true);
  ctx.fillStyle = "#60a5fa";
  roundRect(x - 110, baseY - 168, 58, 54, 8, true);
  roundRect(x + 52, baseY - 168, 58, 54, 8, true);
}

function drawSign(x, y, title, number) {
  ctx.fillStyle = "#78350f";
  roundRect(x - 7, y + 48, 14, 95, 5, true);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  roundRect(x - 155, y, 310, 70, 16, true);
  ctx.strokeStyle = "rgba(120,53,15,0.45)";
  ctx.lineWidth = 3;
  roundRect(x - 155, y, 310, 70, 16, false);
  ctx.fillStyle = "#2563eb";
  ctx.font = "900 18px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Этап ${number}`, x, y + 25);
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 20px Inter, sans-serif";
  ctx.fillText(title, x, y + 52);
}

function drawSimplePerson(x, y, shirt, skin) {
  ctx.fillStyle = shirt;
  roundRect(x - 22, y + 32, 44, 50, 10, true);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y + 15, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(x - 7, y + 14, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 7, y + 14, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGift(x, y, w, h) {
  ctx.fillStyle = "#ef4444";
  roundRect(x - w / 2, y, w, h, 10, true);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(x - 8, y, 16, h);
  ctx.fillRect(x - w / 2, y + 28, w, 14);
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(x - 18, y - 3, 18, 0.2, Math.PI * 1.7);
  ctx.arc(x + 18, y - 3, 18, Math.PI * 1.3, Math.PI * 0.8, true);
  ctx.stroke();
}

function drawBalloons(x, y) {
  const balloons = [
    [0, 0, "#f43f5e"],
    [42, -28, "#2563eb"],
    [88, 4, "#facc15"],
  ];
  balloons.forEach(([dx, dy, color]) => {
    ctx.strokeStyle = "rgba(15,23,42,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy + 38);
    ctx.quadraticCurveTo(x + dx + 12, y + dy + 90, x + dx - 8, y + dy + 136);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + dx, y + dy, 25, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawWheel(x, y) {
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawSun(x, y) {
  ctx.fillStyle = "rgba(250, 204, 21, 0.92)";
  ctx.beginPath();
  ctx.arc(x, y, 46, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.beginPath();
  ctx.arc(0, 25, 28, Math.PI, Math.PI * 2);
  ctx.arc(34, 12, 34, Math.PI, Math.PI * 2);
  ctx.arc(76, 25, 28, Math.PI, Math.PI * 2);
  ctx.fillRect(-5, 24, 86, 28);
  ctx.fill();
  ctx.restore();
}

function drawTree(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#854d0e";
  roundRect(-9, -52, 18, 52, 5, true);
  ctx.fillStyle = "#16a34a";
  ctx.beginPath();
  ctx.arc(0, -72, 36, 0, Math.PI * 2);
  ctx.arc(-26, -54, 28, 0, Math.PI * 2);
  ctx.arc(28, -52, 30, 0, Math.PI * 2);
  ctx.fill();
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

function roundRect(x, y, w, h, r, fill = true) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  if (fill) ctx.fill();
  else ctx.stroke();
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
