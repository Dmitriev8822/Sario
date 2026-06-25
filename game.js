/*
  Мини-игра-платформер для сайта-подарка.
  Всё редактируется в CONFIG ниже. Backend, npm и внешние библиотеки не нужны.
*/

const CONFIG = {
  birthdayName: "Именинник",
  finalTitle: "С днём рождения!",
  finalText:
    "Ты прошёл этот путь. Дальше — ещё больше хороших событий, сильных решений и людей рядом.",
  // Ширина мира совпадает с панорамным фоном, масштабированным под высоту VIEW.
  worldWidth: 6623,
  gravity: 2100,
  moveSpeed: 234,
  jumpSpeed: 640,
  player: {
    name: "Саша",
    hoodie: "#0f253d",
    hoodieDark: "#071424",
    pants: "#1458c8",
    pantsDark: "#0b2f7f",
    skin: "#f2b27f",
    hair: "#b46b18",
    cap: "#091a31",
    capLight: "#f8fafc",
  },
  level: {
    blocks: [
      { x: 360, y: 286, w: 124, h: 18 },
      { x: 620, y: 254, w: 112, h: 18 },
      { x: 910, y: 224, w: 128, h: 18 },
      { x: 1210, y: 270, w: 116, h: 18 },
      { x: 1510, y: 238, w: 150, h: 18 },
      { x: 1840, y: 292, w: 128, h: 18 },
      { x: 2140, y: 260, w: 116, h: 18 },
      { x: 2440, y: 224, w: 132, h: 18 },
      { x: 2780, y: 268, w: 108, h: 18 },
      { x: 3090, y: 236, w: 150, h: 18 },
      { x: 3430, y: 286, w: 120, h: 18 },
      { x: 3740, y: 252, w: 132, h: 18 },
      { x: 4070, y: 224, w: 116, h: 18 },
      { x: 4380, y: 272, w: 154, h: 18 },
      { x: 4740, y: 240, w: 126, h: 18 },
      { x: 5070, y: 292, w: 114, h: 18 },
      { x: 5370, y: 258, w: 148, h: 18 },
      { x: 5710, y: 224, w: 122, h: 18 },
      { x: 6040, y: 270, w: 142, h: 18 },
      { x: 6380, y: 238, w: 120, h: 18 },
      { x: 6660, y: 286, w: 150, h: 18 },
    ],
    items: [],
    coins: [],
    costumeCheckpoints: [],
  },
  events: [],
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const OPAQUE_ALPHA_THRESHOLD = 8;
const RUN_ANIMATION_FPS = 8;
const LEVEL_STORAGE_KEY = "sario.levels";
const LEVEL_DIRECTORY = "assets/levels";
const LEVEL_MANIFEST = `${LEVEL_DIRECTORY}/manifest.json`;
const LEVEL_TRANSITION_DURATION = 1.4;
const GAME_FONT_FAMILY = "\"Pixeloid Sans\", \"Pixeloid Mono\", monospace";
const LEVEL_FINISH_COOLDOWN = 0.7;
const GRID_SIZE = 16;
const BLOCK_TILE_VERSION = "2026-06-23";
const BLOCK_TILE_SRC = `assets/background/блок.svg?v=${BLOCK_TILE_VERSION}`;
const GROUND_BLOCK_TILE_SIZE = 40;
const AIR_BLOCK_TILE_WIDTH = GROUND_BLOCK_TILE_SIZE / 1.5;
const AIR_BLOCK_TILE_HEIGHT = GROUND_BLOCK_TILE_SIZE / 2;
const DEFAULT_BLOCK_SIZE = { w: Math.round(GROUND_BLOCK_TILE_SIZE * 2 / 1.5), h: AIR_BLOCK_TILE_HEIGHT };
const AIR_BLOCK_WIDTH_SCALE = 2 / 3;
const AIR_BLOCK_HEIGHT_SCALE = 0.5;
const DEFAULT_ITEM_SIZE = { w: 34, h: 34 };
const DEFAULT_COIN_SIZE = { w: 22, h: 22 };
const ATTRIBUTE_DIRECTORY = "assets/attributes";
const ATTRIBUTE_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
const ATTRIBUTE_FALLBACK_FILES = [
  {
    file: "Laptop.png",
    title: "Рабочая станция",
    text: "Ты открыл ачивку «Рабочая станция» — ноутбук всегда под рукой!",
  },
  {
    file: "Military ticket.png",
    title: "Военный билет",
    text: "Ты открыл ачивку «Военный билет» — важный этап пройден.",
    autoPlace: false,
  },
];
const PLAYER_DIRECTORY = "assets/player";
const PLAYER_MANIFEST = `${PLAYER_DIRECTORY}/manifest.json`;
const PLAYER_POSES = ["idle", "jump", "run1", "run2", "run3"];
const DEFAULT_PLAYER_COSTUME = "young";
const COSTUME_CHECKPOINT_HIT_WIDTH = GRID_SIZE * 2;
const SOUND_STORAGE_KEY = "sario.soundEnabled";
const SOUND_MASTER_GAIN = 0.16;
const SOUND_PATTERNS = {
  jump: [{ type: "square", frequency: 360, endFrequency: 620, duration: 0.12, gain: 0.5 }],
  collect: [
    { type: "triangle", frequency: 700, endFrequency: 980, duration: 0.08, gain: 0.45 },
    { type: "triangle", frequency: 980, endFrequency: 1320, duration: 0.1, gain: 0.38, delay: 0.06 },
  ],
  item: [
    { type: "sine", frequency: 520, endFrequency: 780, duration: 0.14, gain: 0.45 },
    { type: "sine", frequency: 780, endFrequency: 1040, duration: 0.18, gain: 0.4, delay: 0.11 },
  ],
  costume: [
    { type: "sawtooth", frequency: 440, endFrequency: 880, duration: 0.18, gain: 0.24 },
    { type: "triangle", frequency: 660, endFrequency: 1320, duration: 0.16, gain: 0.32, delay: 0.09 },
  ],
  respawn: [{ type: "sawtooth", frequency: 260, endFrequency: 120, duration: 0.22, gain: 0.26 }],
  transition: [
    { type: "sine", frequency: 330, endFrequency: 440, duration: 0.2, gain: 0.3 },
    { type: "sine", frequency: 440, endFrequency: 660, duration: 0.25, gain: 0.28, delay: 0.16 },
  ],
  finish: [
    { type: "triangle", frequency: 523.25, duration: 0.16, gain: 0.36 },
    { type: "triangle", frequency: 659.25, duration: 0.16, gain: 0.34, delay: 0.14 },
    { type: "triangle", frequency: 783.99, duration: 0.32, gain: 0.34, delay: 0.28 },
  ],
};
const backgroundImage = new Image();
const blockImage = new Image();
blockImage.src = BLOCK_TILE_SRC;
let attributeAssets = ATTRIBUTE_FALLBACK_FILES.map(createAttributeAsset);
let costumeAssets = [createCostumeAsset(DEFAULT_PLAYER_COSTUME)];

function decodeFilename(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getFilenameFromPath(path) {
  return decodeFilename(path.split("/").pop() || path);
}

function formatAssetTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Предмет";
}

function normalizeAttributeDescriptor(attribute) {
  if (!attribute) return null;

  if (typeof attribute === "string") {
    return { file: attribute };
  }

  return {
    file: attribute.file || attribute.filename || attribute.src,
    title: attribute.title,
    text: attribute.text || attribute.description,
    autoPlace: attribute.autoPlace,
  };
}

function createAttributeAsset(attribute) {
  const descriptor = normalizeAttributeDescriptor(attribute);
  const filename = getFilenameFromPath(descriptor.file);
  const src = descriptor.file.includes("/") ? descriptor.file : `${ATTRIBUTE_DIRECTORY}/${descriptor.file}`;
  const title = descriptor.title || formatAssetTitle(filename);

  return {
    filename,
    src,
    title,
    text: descriptor.text || `Ты собрал предмет «${title}»!`,
    autoPlace: descriptor.autoPlace !== false,
  };
}

function isAttributeImage(attribute) {
  const descriptor = normalizeAttributeDescriptor(attribute);
  if (!descriptor?.file) return false;
  const lower = descriptor.file.toLowerCase();
  return ATTRIBUTE_IMAGE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function uniqueAttributeAssets(attributes) {
  const seen = new Set();
  return attributes
    .filter(isAttributeImage)
    .map(createAttributeAsset)
    .filter((asset) => {
      if (seen.has(asset.src)) return false;
      seen.add(asset.src);
      return true;
    });
}

function normalizeCostumeDescriptor(costume) {
  if (!costume) return null;

  if (typeof costume === "string") {
    const id = costume.replace(/\/$/, "");
    return { id, title: formatAssetTitle(id), path: `${PLAYER_DIRECTORY}/${id}`, sprites: {} };
  }

  const path = (costume.path || `${PLAYER_DIRECTORY}/${costume.id}`).replace(/\/$/, "");
  const id = costume.id || getFilenameFromPath(path);
  return {
    id,
    title: costume.title || formatAssetTitle(id),
    path,
    sprites: costume.sprites || {},
  };
}

function createCostumeAsset(costume) {
  const descriptor = normalizeCostumeDescriptor(costume);
  return {
    id: descriptor.id,
    title: descriptor.title,
    path: descriptor.path,
    sprites: Object.fromEntries(
      PLAYER_POSES.map((pose) => [pose, loadPlayerSprite(descriptor.sprites[pose] || `${descriptor.path}/${pose}.png`)]),
    ),
  };
}

function uniqueCostumeAssets(costumes) {
  const seen = new Set();
  return costumes
    .map(normalizeCostumeDescriptor)
    .filter(Boolean)
    .filter((costume) => costume.id && !costume.id.includes("."))
    .filter((costume) => {
      if (seen.has(costume.id)) return false;
      seen.add(costume.id);
      return true;
    })
    .map(createCostumeAsset);
}

async function fetchDirectoryEntries(directory) {
  const response = await fetch(`${directory}/`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  return [...document.querySelectorAll("a[href]")]
    .map((link) => decodeFilename(link.getAttribute("href") || ""))
    .map((href) => href.split(/[?#]/)[0])
    .filter((href) => href && href !== "../")
    .map((href) => {
      const isDirectory = href.endsWith("/");
      const parts = href.replace(/\/$/, "").split("/");
      return `${parts.pop()}${isDirectory ? "/" : ""}`;
    });
}

async function fetchAttributeDirectoryFiles() {
  return fetchDirectoryEntries(ATTRIBUTE_DIRECTORY);
}

async function fetchAttributeManifestFiles() {
  const response = await fetch(`${ATTRIBUTE_DIRECTORY}/manifest.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const manifest = await response.json();
  if (Array.isArray(manifest)) return manifest;
  return manifest.attributes || manifest.items || manifest.files;
}

async function refreshAttributeAssets() {
  const sources = [fetchAttributeManifestFiles, fetchAttributeDirectoryFiles];

  for (const loadFiles of sources) {
    try {
      const files = await loadFiles();
      const assets = uniqueAttributeAssets(files);
      if (assets.length > 0) {
        attributeAssets = assets;
        updateEditorItemSelect();
        syncAutoLevelItems();
        state.coins = createCoins();
        updateHud();
        updateEditorStatus();
        return;
      }
    } catch (error) {
      console.info("Не удалось автоматически прочитать assets/attributes", error);
    }
  }
}

async function fetchCostumeManifest() {
  const response = await fetch(PLAYER_MANIFEST, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const manifest = await response.json();
  return Array.isArray(manifest) ? manifest : manifest.costumes;
}

async function fetchCostumeDirectoryNames() {
  const entries = await fetchDirectoryEntries(PLAYER_DIRECTORY);
  return entries
    .filter((entry) => entry.endsWith("/"))
    .map((entry) => entry.replace(/\/$/, ""));
}

async function refreshCostumeAssets() {
  const sources = [fetchCostumeManifest, fetchCostumeDirectoryNames];

  for (const loadCostumes of sources) {
    try {
      const costumes = await loadCostumes();
      const assets = uniqueCostumeAssets(costumes || []);
      if (assets.length > 0) {
        costumeAssets = assets;
        updateEditorCostumeSelect();
        if (!findCostumeAsset(state.player?.costume)) setPlayerCostume(findDefaultCostumeAsset().id);
        updateEditorStatus();
        return;
      }
    } catch (error) {
      console.info("Не удалось прочитать список костюмов", error);
    }
  }
}

function buildAutoLevelItem(asset, index, total) {
  const platformIndex = Math.round(((index + 1) * (getCurrentLevel().blocks.length - 1)) / (total + 1));
  const platform = getCurrentLevel().blocks[platformIndex] || { x: 760 + index * 260, y: 236, w: 96 };

  return {
    id: `attribute-${asset.filename}`,
    x: Math.round(platform.x + platform.w / 2 - DEFAULT_ITEM_SIZE.w / 2),
    y: Math.max(40, platform.y - DEFAULT_ITEM_SIZE.h - 18),
    w: DEFAULT_ITEM_SIZE.w,
    h: DEFAULT_ITEM_SIZE.h,
    src: asset.src,
    title: asset.title,
    text: asset.text,
    auto: true,
  };
}

function syncAutoLevelItems() {
  const manualItems = getCurrentLevel().items.filter((item) => !item.auto);
  const autoPlaceAssets = attributeAssets.filter((asset) => asset.autoPlace !== false);
  const autoItems = autoPlaceAssets.map((asset, index) => buildAutoLevelItem(asset, index, autoPlaceAssets.length));
  getCurrentLevel().items = [...manualItems, ...autoItems];
}

function findSelectedAttributeAsset() {
  const selectedSrc = editorItemSelect?.value;
  return attributeAssets.find((asset) => asset.src === selectedSrc) || attributeAssets[0];
}

function updateEditorItemSelect() {
  if (!editorItemSelect) return;

  const selectedSrc = editorItemSelect.value;
  editorItemSelect.replaceChildren();

  attributeAssets.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.src;
    option.textContent = asset.title;
    editorItemSelect.append(option);
  });

  if (attributeAssets.some((asset) => asset.src === selectedSrc)) {
    editorItemSelect.value = selectedSrc;
  }
}

function findSelectedCostumeAsset() {
  const selectedCostume = editorCostumeSelect?.value;
  return findCostumeAsset(selectedCostume) || findDefaultCostumeAsset();
}

function updateEditorCostumeSelect() {
  if (!editorCostumeSelect) return;

  const selectedCostume = editorCostumeSelect.value;
  editorCostumeSelect.replaceChildren();

  costumeAssets.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = asset.title;
    editorCostumeSelect.append(option);
  });

  if (costumeAssets.some((asset) => asset.id === selectedCostume)) {
    editorCostumeSelect.value = selectedCostume;
  }
}

function getOpaqueImageBounds(image) {
  const scanCanvas = document.createElement("canvas");
  scanCanvas.width = image.naturalWidth;
  scanCanvas.height = image.naturalHeight;

  const scanCtx = scanCanvas.getContext("2d");
  scanCtx.drawImage(image, 0, 0);

  const { data } = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
  let minX = scanCanvas.width;
  let minY = scanCanvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < scanCanvas.height; y += 1) {
    for (let x = 0; x < scanCanvas.width; x += 1) {
      const alpha = data[(y * scanCanvas.width + x) * 4 + 3];
      if (alpha <= OPAQUE_ALPHA_THRESHOLD) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX === -1) return { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function loadPlayerSprite(src) {
  const image = new Image();
  image.bounds = null;
  image.addEventListener("load", () => {
    image.bounds = getOpaqueImageBounds(image);
  });
  image.src = src;
  return image;
}

function findCostumeAsset(costumeId) {
  return costumeAssets.find((asset) => asset.id === costumeId);
}

function findDefaultCostumeAsset() {
  return findCostumeAsset(DEFAULT_PLAYER_COSTUME) || costumeAssets[0] || createCostumeAsset(DEFAULT_PLAYER_COSTUME);
}

function getActivePlayerSprites() {
  return (findCostumeAsset(state.player?.costume) || findDefaultCostumeAsset()).sprites;
}

function setPlayerCostume(costumeId) {
  const costume = findCostumeAsset(costumeId);
  if (!costume || !state.player) return false;
  state.player.costume = costume.id;
  return true;
}


function isSpriteReady(sprite) {
  return sprite.complete && sprite.naturalWidth > 0;
}

const gameShell = document.getElementById("gameShell");
const gameTopbar = document.getElementById("gameTopbar");
const photoPlaceholder = document.querySelector(".photo-placeholder");
const finishScreen = document.getElementById("finishScreen");
const restartButton = document.getElementById("restartButton");
const soundToggleButton = document.getElementById("soundToggleButton");
const editorToggleButton = document.getElementById("editorToggleButton");
const editorModeButton = document.getElementById("editorModeButton");
const editorToolSelect = document.getElementById("editorToolSelect");
const editorLevelSelect = document.getElementById("editorLevelSelect");
const editorItemSelect = document.getElementById("editorItemSelect");
const editorCostumeSelect = document.getElementById("editorCostumeSelect");
const editorExportButton = document.getElementById("editorExportButton");
const editorResetButton = document.getElementById("editorResetButton");
const editorStatus = document.getElementById("editorStatus");
const playAgainButton = document.getElementById("playAgainButton");
const scoreLabel = document.getElementById("scoreLabel");
const eventLabel = document.getElementById("eventLabel");
const eventCard = document.getElementById("eventCard");
const eventTitle = document.getElementById("eventTitle");
const eventText = document.getElementById("eventText");
const finishTitle = document.getElementById("finishTitle");
const finishText = document.getElementById("finishText");
const finishStats = document.getElementById("finishStats");

const VIEW = { width: 1280, height: 340 };
const FLOOR_Y = 324;
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
let editorMode = false;
let currentLevelIndex = 0;
let defaultLevels = [];
let audioContext = null;
let masterGainNode = null;
let soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== "false";

const state = {
  player: null,
  platforms: [],
  coins: [],
  checkpoints: [],
  triggeredCostumeCheckpoints: new Set(),
  particles: [],
  finished: false,
  startedAt: 0,
  totalCoinsCollected: 0,
  transition: { active: false, elapsed: 0, targetLevelId: null, switched: false, title: "", text: "" },
};



function getAudioContext() {
  if (!soundEnabled) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = SOUND_MASTER_GAIN;
    masterGainNode.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") audioContext.resume().catch(() => undefined);
  return audioContext;
}

function playSound(name) {
  const context = getAudioContext();
  const pattern = SOUND_PATTERNS[name];
  if (!context || !masterGainNode || !pattern) return;

  pattern.forEach((note) => {
    const start = context.currentTime + (note.delay || 0);
    const duration = note.duration || 0.12;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = note.type || "square";
    oscillator.frequency.setValueAtTime(note.frequency, start);
    if (note.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, start + duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.gain || 0.3, start + duration * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(masterGainNode);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  });
}

function updateSoundToggleUi() {
  if (!soundToggleButton) return;
  soundToggleButton.textContent = soundEnabled ? "Звук: вкл" : "Звук: выкл";
  soundToggleButton.setAttribute("aria-pressed", String(soundEnabled));
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
  if (masterGainNode) masterGainNode.gain.value = soundEnabled ? SOUND_MASTER_GAIN : 0;
  updateSoundToggleUi();
  if (soundEnabled) playSound("collect");
}

function unlockAudio() {
  getAudioContext();
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeLevel(level, index = 0) {
  const fallback = CONFIG.level || { blocks: [], items: [], coins: [], costumeCheckpoints: [] };
  return {
    id: level.id || `level-${index + 1}`,
    title: level.title || `Локация ${index + 1}`,
    background: level.background || "assets/background/1.png",
    upperBackground: level.upperBackground || level.topBackground || level.headerBackground || "",
    worldWidth: level.worldWidth || CONFIG.worldWidth,
    start: { x: 80, y: FLOOR_Y - 52, ...(level.start || {}) },
    finishDistance: level.finishDistance ?? 240,
    blocks: Array.isArray(level.blocks) ? level.blocks : cloneData(fallback.blocks || []),
    items: Array.isArray(level.items) ? level.items : cloneData(fallback.items || []),
    coins: Array.isArray(level.coins) ? level.coins : cloneData(fallback.coins || []),
    costumeCheckpoints: Array.isArray(level.costumeCheckpoints) ? level.costumeCheckpoints : [],
    events: Array.isArray(level.events) ? level.events : [],
    nextLevel: level.nextLevel,
    transitionTitle: level.transitionTitle || "Новая локация",
    transitionText: level.transitionText || "Путь продолжается.",
  };
}

function getCurrentLevel() {
  return CONFIG.levels?.[currentLevelIndex] || normalizeLevel(CONFIG.level);
}

function getCurrentWorldWidth() {
  return getCurrentLevel().worldWidth || CONFIG.worldWidth;
}

function updateEditorLevelSelect() {
  if (!editorLevelSelect) return;

  const levels = CONFIG.levels || [getCurrentLevel()];
  editorLevelSelect.replaceChildren();

  levels.forEach((level, index) => {
    const option = document.createElement("option");
    option.value = level.id || `level-${index + 1}`;
    option.textContent = level.title || `Локация ${index + 1}`;
    editorLevelSelect.append(option);
  });

  editorLevelSelect.value = getCurrentLevel().id || levels[currentLevelIndex]?.id || "";
}

function selectEditorLevel(levelId) {
  if (!levelId || levelId === getCurrentLevel().id) {
    updateEditorLevelSelect();
    return;
  }

  state.transition = { active: false, elapsed: 0, targetLevelId: null, switched: false, title: "", text: "" };
  switchToLevel(levelId);
  updateEditorLevelSelect();
}

function getCurrentEvents() {
  return getCurrentLevel().events || CONFIG.events || [];
}

function getTotalCollectiblesCount() {
  return (CONFIG.levels || [getCurrentLevel()]).reduce(
    (sum, level) => sum + (level.items?.length || 0) + (level.coins?.length || 0),
    0,
  );
}

function setBackgroundForCurrentLevel() {
  const level = getCurrentLevel();
  const nextSrc = level.background || "assets/background/1.png";
  if (!backgroundImage.src.endsWith(nextSrc)) {
    backgroundImage.src = nextSrc;
  }

  if (photoPlaceholder) {
    const upperBackground = level.upperBackground || nextSrc;
    photoPlaceholder.style.backgroundImage = `url("${upperBackground}")`;
  }
}

async function fetchLevelManifest() {
  const response = await fetch(LEVEL_MANIFEST, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const manifest = await response.json();
  return Array.isArray(manifest) ? manifest : manifest.levels;
}

async function fetchLevelFile(file) {
  const src = file.includes("/") ? file : `${LEVEL_DIRECTORY}/${file}`;
  const response = await fetch(src, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function refreshLevels() {
  try {
    const manifestLevels = await fetchLevelManifest();
    const loadedLevels = await Promise.all((manifestLevels || []).map((entry) => {
      if (typeof entry === "string") return fetchLevelFile(entry);
      if (entry.file) return fetchLevelFile(entry.file);
      return entry;
    }));

    if (loadedLevels.length > 0) {
      CONFIG.levels = loadedLevels.map(normalizeLevel);
      defaultLevels = cloneData(CONFIG.levels);
      currentLevelIndex = 0;
      updateEditorLevelSelect();
      setBackgroundForCurrentLevel();
      resetGame();
    }
  } catch (error) {
    console.info("Не удалось загрузить уровни из assets/levels", error);
  }
}

function findLevelIndex(levelId) {
  return CONFIG.levels?.findIndex((level) => level.id === levelId) ?? -1;
}

function getNextLevelId(level = getCurrentLevel()) {
  if (level.nextLevel) return level.nextLevel;
  return CONFIG.levels?.[currentLevelIndex + 1]?.id || null;
}

function startLevelTransition(targetLevelId, title = "Новая локация", text = "Путь продолжается.") {
  if (state.transition.active) return;
  playSound("transition");
  state.transition = { active: true, elapsed: 0, targetLevelId, switched: false, title, text };
  keys.left = false;
  keys.right = false;
  keys.jump = false;
}

function switchToLevel(levelId) {
  const index = findLevelIndex(levelId);
  if (index < 0) return false;

  currentLevelIndex = index;
  updateEditorLevelSelect();
  setBackgroundForCurrentLevel();
  const start = getCurrentLevel().start || { x: 80, y: FLOOR_Y - 52 };
  state.player.x = start.x;
  state.player.y = start.y ?? FLOOR_Y - state.player.h;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.grounded = false;
  state.player.checkpointX = start.x;
  state.player.checkpointY = state.player.y;
  state.platforms = createPlatforms();
  state.coins = createCoins();
  state.triggeredCostumeCheckpoints = new Set();
  state.particles = [];
  cameraX = 0;
  syncPhotoBackgroundWithCamera();
  activeEventIndex = -1;
  eventCardTimer = 0;
  hideEventCard();
  updateHud();
  updateEditorStatus();
  return true;
}

function updateLevelTransition(dt) {
  if (!state.transition.active) return;

  state.transition.elapsed += dt;
  if (!state.transition.switched && state.transition.elapsed >= LEVEL_TRANSITION_DURATION / 2) {
    state.transition.switched = true;
    switchToLevel(state.transition.targetLevelId);
  }

  if (state.transition.elapsed >= LEVEL_TRANSITION_DURATION) {
    state.transition = { active: false, elapsed: 0, targetLevelId: null, switched: false, title: "", text: "" };
  }
}

function createPlayer() {
  const start = getCurrentLevel().start || { x: 80, y: FLOOR_Y - 52 };
  return {
    x: start.x,
    y: start.y ?? FLOOR_Y - 52,
    // Спрайт вписывается в этот же hitbox, сохраняя исходные пропорции PNG.
    w: 30,
    h: 52,
    vx: 0,
    vy: 0,
    grounded: false,
    direction: 1,
    checkpointX: start.x,
    checkpointY: start.y ?? FLOOR_Y - 52,
    coins: 0,
    walkTime: 0,
    costume: findDefaultCostumeAsset().id,
  };
}

function createPlatforms() {
  return [
    { x: 0, y: FLOOR_Y, w: getCurrentWorldWidth(), h: GROUND_BLOCK_TILE_SIZE, type: "ground" },
    ...getCurrentLevel().blocks.map((block) => createAirBlockPlatform(block)),
  ];
}

function createAirBlockPlatform(block) {
  const sourceW = block.w ?? DEFAULT_BLOCK_SIZE.w / AIR_BLOCK_WIDTH_SCALE;
  const sourceH = block.h ?? DEFAULT_BLOCK_SIZE.h / AIR_BLOCK_HEIGHT_SCALE;
  const w = Math.max(Math.round(AIR_BLOCK_TILE_WIDTH), Math.round(sourceW * AIR_BLOCK_WIDTH_SCALE));
  const h = Math.max(AIR_BLOCK_TILE_HEIGHT, Math.round(sourceH * AIR_BLOCK_HEIGHT_SCALE));

  return {
    ...block,
    x: Math.round(block.x + (sourceW - w) / 2),
    y: Math.round(block.y + sourceH - h),
    w,
    h,
    type: "block",
  };
}

function loadLevelItem(item, index) {
  const image = new Image();
  image.src = item.src;
  return {
    id: item.id || `item-${index}`,
    type: "item",
    x: item.x,
    y: item.y,
    w: item.w ?? 34,
    h: item.h ?? 34,
    src: item.src,
    title: item.title || "Ачивка открыта",
    text: item.text || "Предмет собран!",
    nextLevel: item.nextLevel,
    transitionText: item.transitionText,
    collected: false,
    image,
  };
}

function loadLevelCoin(coin, index) {
  return {
    id: coin.id || `coin-${index}`,
    type: "coin",
    x: coin.x,
    y: coin.y,
    w: coin.w ?? DEFAULT_COIN_SIZE.w,
    h: coin.h ?? DEFAULT_COIN_SIZE.h,
    title: coin.title || "Монетка!",
    text: coin.text || "Ты собрал монетку.",
    collected: false,
  };
}

function createCoins() {
  syncAutoLevelItems();
  const level = getCurrentLevel();
  const items = level.items.map(loadLevelItem);
  const coins = (level.coins || []).map(loadLevelCoin);
  totalCoins = getTotalCollectiblesCount();
  return [...items, ...coins];
}

function resetGame() {
  cancelAnimationFrame(rafId);
  setBackgroundForCurrentLevel();
  state.player = createPlayer();
  state.platforms = createPlatforms();
  state.coins = createCoins();
  ensureLevelCollections();
  state.checkpoints = getCurrentEvents().map((event) => ({ x: event.x - 80, y: FLOOR_Y - 121 }));
  state.triggeredCostumeCheckpoints = new Set();
  state.particles = [];
  state.finished = false;
  state.totalCoinsCollected = 0;
  state.transition = { active: false, elapsed: 0, targetLevelId: null, switched: false, title: "", text: "" };
  state.startedAt = performance.now();
  cameraX = 0;
  syncPhotoBackgroundWithCamera();
  lastTime = 0;
  activeEventIndex = -1;
  eventCardTimer = 0;
  updateHud();
  updateEditorStatus();
  hideEventCard();
}

function startGame() {
  currentLevelIndex = 0;
  updateEditorLevelSelect();
  resetGame();
  finishScreen.hidden = true;
  gameShell.hidden = false;
  running = true;
  rafId = requestAnimationFrame(loop);
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
  updateLevelTransition(dt);
  const acceleration = 2800;
  const friction = player.grounded ? 0.82 : 0.94;

  if (state.transition.active) {
    updateParticles(dt);
    return;
  }

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
    playSound("jump");
    spawnDust(player.x + player.w / 2, player.y + player.h);
  }

  player.vy += CONFIG.gravity * dt;

  movePlayer(player, dt);
  updateCostumeCheckpoints();
  collectCoins(player);
  updateCamera();
  updateEvents(dt);
  updateParticles(dt);
  updateHud();
  updateLevelFinish();

  if (player.y > VIEW.height + 240) respawn();
}

function updateLevelFinish() {
  if (state.finished || state.transition.active) return;

  const level = getCurrentLevel();
  const finishX = getCurrentWorldWidth() - (level.finishDistance ?? 240);
  if (state.player.x + state.player.w < finishX) return;

  const targetLevelId = getNextLevelId(level);
  if (targetLevelId) {
    showEventCard({ title: level.transitionTitle, text: level.transitionText });
    eventCardTimer = LEVEL_FINISH_COOLDOWN + LEVEL_TRANSITION_DURATION;
    startLevelTransition(targetLevelId, level.transitionTitle, level.transitionText);
    return;
  }

  finishGame();
}

function finishGame() {
  state.finished = true;
  playSound("finish");
  running = false;
  cancelAnimationFrame(rafId);

  const elapsedSeconds = Math.max(1, Math.round((performance.now() - state.startedAt) / 1000));
  finishTitle.textContent = CONFIG.finalTitle;
  finishText.textContent = CONFIG.finalText;
  finishStats.textContent = `Собрано: ${state.totalCoinsCollected} / ${totalCoins}. Время: ${elapsedSeconds} сек.`;
  gameShell.hidden = true;
  finishScreen.hidden = false;
}

function movePlayer(player, dt) {
  player.grounded = false;

  player.x += player.vx * dt;
  resolveCollisions(player, "x");

  player.y += player.vy * dt;
  resolveCollisions(player, "y");

  player.x = clamp(player.x, 0, getCurrentWorldWidth() - player.w);

  if (Math.abs(player.vx) > 10 && player.grounded) {
    player.walkTime += dt;
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
  for (const item of state.coins) {
    if (item.collected) continue;
    if (!rectsOverlap(player, item)) continue;

    item.collected = true;
    player.coins += 1;
    state.totalCoinsCollected += 1;
    spawnSparkles(item.x + item.w / 2, item.y + item.h / 2);
    playSound(item.type === "coin" ? "collect" : "item");

    if (item.type !== "coin") {
      showEventCard({ title: item.title, text: item.text });
      eventCardTimer = 4.5;
    }

    if (item.nextLevel) startLevelTransition(item.nextLevel, item.title, item.transitionText || item.text);
  }
}


function updateCostumeCheckpoints() {
  const player = state.player;
  const playerCenter = player.x + player.w / 2;

  getCurrentLevel().costumeCheckpoints.forEach((checkpoint, index) => {
    if (state.triggeredCostumeCheckpoints.has(index)) return;
    if (playerCenter < checkpoint.x) return;

    if (setPlayerCostume(checkpoint.costume)) {
      state.triggeredCostumeCheckpoints.add(index);
      spawnSparkles(player.x + player.w / 2, player.y + player.h / 2);
      playSound("costume");
    }
  });
}

function syncPhotoBackgroundWithCamera() {
  if (!photoPlaceholder) return;
  const maxCameraX = Math.max(1, getCurrentWorldWidth() - VIEW.width);
  const scrollProgress = clamp(cameraX / maxCameraX, 0, 1);
  photoPlaceholder.style.setProperty("--photo-bg-position", `${scrollProgress * 100}%`);
}

function updateCamera() {
  const target = state.player.x - VIEW.width * 0.42;
  cameraX += (target - cameraX) * 0.12;
  cameraX = clamp(cameraX, 0, getCurrentWorldWidth() - VIEW.width);
  syncPhotoBackgroundWithCamera();
}

function updateEvents(dt) {
  const playerCenter = state.player.x + state.player.w / 2;
  let currentIndex = -1;

  getCurrentEvents().forEach((event, index) => {
    if (Math.abs(playerCenter - event.x) < 360) currentIndex = index;
    if (playerCenter > event.x - 60) {
      state.player.checkpointX = event.x - 120;
      state.player.checkpointY = FLOOR_Y - state.player.h;
    }
  });

  if (currentIndex !== -1 && currentIndex !== activeEventIndex) {
    activeEventIndex = currentIndex;
    showEventCard(getCurrentEvents()[currentIndex]);
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
  playSound("respawn");
}

function updateHud() {
  scoreLabel.textContent = `${state.player?.coins ?? 0} / ${totalCoins}`;
  eventLabel.textContent = activeEventIndex >= 0 ? getCurrentEvents()[activeEventIndex].title : getCurrentLevel().title || "Старт";
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
  drawPlatforms();
  drawCoins();
  drawCostumeCheckpoints();
  drawEditorPreview();
  drawParticles();
  drawPlayer();
  drawLevelTransition();
}


function drawLevelTransition() {
  if (!state.transition.active) return;

  const half = LEVEL_TRANSITION_DURATION / 2;
  const elapsed = state.transition.elapsed;
  const alpha = elapsed <= half ? elapsed / half : 1 - (elapsed - half) / half;
  const eased = clamp(alpha, 0, 1) ** 0.75;

  ctx.save();
  ctx.globalAlpha = eased;
  const gradient = ctx.createLinearGradient(0, 0, VIEW.width, VIEW.height);
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(0.55, "#312e81");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  for (let i = 0; i < 28; i += 1) {
    const x = (i * 97 + elapsed * 220) % VIEW.width;
    const y = 54 + ((i * 43) % 210);
    pixelRect(x, y, 4, 4, i % 2 === 0 ? "#fde68a" : "#bfdbfe");
  }

  ctx.globalAlpha = clamp(eased + 0.05, 0, 1);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 28px ${GAME_FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.fillText(state.transition.title || "Новая локация", VIEW.width / 2, VIEW.height / 2 - 8);
  ctx.font = `700 16px ${GAME_FONT_FAMILY}`;
  ctx.fillText(state.transition.text || "путь продолжается", VIEW.width / 2, VIEW.height / 2 + 24);
  ctx.restore();
}

function drawSky() {
  if (!backgroundImage.complete || backgroundImage.naturalWidth <= 0) {
    pixelRect(0, 0, VIEW.width, VIEW.height, PALETTE.sky3);
    return;
  }

  drawWorldBackground(backgroundImage);
}

function drawWorldBackground(image) {
  const scale = Math.max(VIEW.width / image.naturalWidth, VIEW.height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const maxOffsetX = Math.max(0, drawWidth - VIEW.width);
  const maxCameraX = Math.max(1, getCurrentWorldWidth() - VIEW.width);
  const scrollProgress = clamp(cameraX / maxCameraX, 0, 1);

  const drawX = -maxOffsetX * scrollProgress;
  const drawY = (VIEW.height - drawHeight) / 2;

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
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
  getCurrentEvents().forEach((event, index) => {
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
      drawGroundPlatform(x, p.y, p.w, p.h);
      return;
    }

    drawAirBlock(x, p.y, p.w, p.h);
  });
}

function drawGroundPlatform(x, y, w, h) {
  drawBlockTileSurface(x, y, w, h, GROUND_BLOCK_TILE_SIZE, GROUND_BLOCK_TILE_SIZE);
}

function drawAirBlock(x, y, w, h) {
  drawBlockTileSurface(x, y, w, h, AIR_BLOCK_TILE_WIDTH, AIR_BLOCK_TILE_HEIGHT);
}

function drawBlockTileSurface(x, y, w, h, tileWidth, tileHeight = tileWidth) {
  if (!blockImage.complete || blockImage.naturalWidth <= 0) {
    pixelRect(x, y, w, h, PALETTE.wood);
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  for (let tileX = x; tileX < x + w; tileX += tileWidth) {
    for (let tileY = y; tileY < y + h; tileY += tileHeight) {
      ctx.drawImage(blockImage, tileX, tileY, tileWidth, tileHeight);
    }
  }

  ctx.restore();
}

function drawCoins() {
  const t = performance.now() / 1000;
  state.coins.forEach((item) => {
    if (item.collected) return;
    const x = item.x - cameraX;
    if (x + item.w < -60 || x > VIEW.width + 60) return;
    const bob = Math.sin(t * 4 + item.x * 0.03) * 4;

    if (item.type === "coin") {
      drawCoinSprite(x, item.y + bob, item.w, item.h);
      return;
    }

    if (item.image.complete && item.image.naturalWidth > 0) {
      ctx.drawImage(item.image, x, item.y + bob, item.w, item.h);
      return;
    }

    pixelRect(x, item.y + bob, item.w, item.h, PALETTE.gold);
    pixelRect(x + 6, item.y + bob + 6, item.w - 12, item.h - 12, PALETTE.goldDark);
  });
}

function drawCoinSprite(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = PALETTE.goldDark;
  ctx.beginPath();
  ctx.ellipse(snap(x + w / 2), snap(y + h / 2), snap(w / 2), snap(h / 2), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.ellipse(snap(x + w / 2), snap(y + h / 2), snap(w / 2 - 3), snap(h / 2 - 3), 0, 0, Math.PI * 2);
  ctx.fill();
  pixelRect(x + w * 0.42, y + 4, Math.max(3, w * 0.16), h - 8, "#fde68a");
  ctx.restore();
}

function drawCostumeCheckpoints() {
  if (!editorMode) return;

  getCurrentLevel().costumeCheckpoints.forEach((checkpoint) => {
    const x = checkpoint.x - cameraX;
    if (x < -60 || x > VIEW.width + 60) return;
    const costume = findCostumeAsset(checkpoint.costume);

    ctx.save();
    ctx.globalAlpha = 0.8;
    pixelRect(x - 3, 0, 6, VIEW.height, "#a855f7");
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 13px ${GAME_FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.fillText(costume?.title || checkpoint.costume, x, 48);
    ctx.restore();
  });
}

function drawEditorPreview() {
  if (!editorMode) return;

  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 14px ${GAME_FONT_FAMILY}`;
  ctx.textAlign = "left";
  ctx.fillText("Редактор: клик — добавить, Alt/Shift + клик — удалить", 18, 28);
  ctx.restore();
}



function drawPlayer() {
  const p = state.player;
  const x = p.x - cameraX;
  const y = p.y;
  const moving = p.grounded && Math.abs(p.vx) > 30;
  const jumping = !p.grounded;
  const playerSprites = getActivePlayerSprites();
  const runSprites = [playerSprites.run1, playerSprites.run2, playerSprites.run3];
  const runFrame = Math.floor(p.walkTime * RUN_ANIMATION_FPS) % runSprites.length;
  const runSprite = isSpriteReady(runSprites[runFrame])
    ? runSprites[runFrame]
    : runSprites.find(isSpriteReady) || playerSprites.idle;
  const sprite = jumping && isSpriteReady(playerSprites.jump)
    ? playerSprites.jump
    : (moving ? runSprite : playerSprites.idle);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.translate(x + p.w / 2, y + p.h / 2);
  ctx.scale(p.direction, 1);
  if (sprite.complete && sprite.naturalWidth > 0) {
    const source = sprite.bounds || { x: 0, y: 0, w: sprite.naturalWidth, h: sprite.naturalHeight };
    const scale = Math.min(p.w / source.w, p.h / source.h);
    const spriteWidth = source.w * scale;
    const spriteHeight = source.h * scale;

    ctx.translate(-spriteWidth / 2, -spriteHeight / 2);
    ctx.drawImage(sprite, source.x, source.y, source.w, source.h, 0, 0, spriteWidth, spriteHeight);
  }
  ctx.restore();

  // Имя над персонажем.
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  pixelRect(x - 3, y - 30, p.w + 6, 22, "rgba(15, 23, 42, 0.78)");
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 13px ${GAME_FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.fillText(CONFIG.player.name, x + p.w / 2, y - 14);
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
  ctx.font = `900 34px ${GAME_FONT_FAMILY}`;
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
  ctx.font = `900 46px ${GAME_FONT_FAMILY}`;
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
  ctx.font = `900 18px ${GAME_FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.fillText(`Этап ${number}`, x, y + 25);
  ctx.fillStyle = "#0f172a";
  ctx.font = `800 20px ${GAME_FONT_FAMILY}`;
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

function ensureLevelCollections(level = getCurrentLevel()) {
  if (!Array.isArray(level.blocks)) level.blocks = [];
  if (!Array.isArray(level.items)) level.items = [];
  if (!Array.isArray(level.coins)) level.coins = [];
  if (!Array.isArray(level.costumeCheckpoints)) level.costumeCheckpoints = [];
}

function getDefaultLevels() {
  return cloneData(CONFIG.levels || [getCurrentLevel()]);
}

defaultLevels = getDefaultLevels();

function loadSavedLevel() {
  ensureLevelCollections();
  syncAutoLevelItems();
  const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    const savedLevels = Array.isArray(saved) ? saved : saved.levels;
    if (Array.isArray(savedLevels)) {
      CONFIG.levels = savedLevels.map(normalizeLevel);
      currentLevelIndex = Math.min(currentLevelIndex, CONFIG.levels.length - 1);
      updateEditorLevelSelect();
    } else {
      const level = getCurrentLevel();
      if (Array.isArray(saved.blocks)) level.blocks = saved.blocks;
      if (Array.isArray(saved.items)) level.items = saved.items;
      if (Array.isArray(saved.coins)) level.coins = saved.coins;
      if (Array.isArray(saved.costumeCheckpoints)) level.costumeCheckpoints = saved.costumeCheckpoints;
    }
    ensureLevelCollections();
  } catch (error) {
    console.warn("Не удалось прочитать сохранённый уровень", error);
  }
}

function saveLevel() {
  localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(CONFIG.levels || [getCurrentLevel()]));
  updateEditorStatus();
}

function resetCustomLevel() {
  CONFIG.levels = cloneData(defaultLevels);
  currentLevelIndex = 0;
  updateEditorLevelSelect();
  setBackgroundForCurrentLevel();
  localStorage.removeItem(LEVEL_STORAGE_KEY);
  state.platforms = createPlatforms();
  state.coins = createCoins();
  updateHud();
  updateEditorStatus();
}

function downloadJson(filename, data) {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportLevel() {
  const exportData = {
    levels: CONFIG.levels || [getCurrentLevel()],
  };
  const json = JSON.stringify(exportData, null, 2);

  downloadJson("manifest.json", json);
  navigator.clipboard?.writeText(json).catch(() => undefined);
  window.prompt(
    "Скачанный manifest.json положи с заменой в assets/levels/manifest.json. JSON также скопирован сюда:",
    json,
  );
}

function updateEditorStatus() {
  if (!editorStatus) return;
  editorStatus.textContent = `Блоков: ${getCurrentLevel().blocks.length}. Предметов: ${getCurrentLevel().items.length}. Монеток: ${(getCurrentLevel().coins || []).length}. Чекпоинтов костюма: ${getCurrentLevel().costumeCheckpoints.length}.`;
}

function updateEditorUi() {
  gameShell.classList.toggle("game-shell--editor-open", editorMode);
  gameTopbar.setAttribute("aria-hidden", String(!editorMode));
  editorToggleButton.setAttribute("aria-expanded", String(editorMode));
  editorToggleButton.textContent = editorMode ? "Скрыть панель" : "Редактор";
  editorModeButton.textContent = editorMode ? "Играть" : "Редактор";
  editorModeButton.classList.toggle("topbar__button--active", editorMode);
  updateEditorStatus();
}

function toggleEditorMode() {
  editorMode = !editorMode;
  updateEditorUi();
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = VIEW.width / rect.width;
  const scaleY = VIEW.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}


function createEditorBlock(x, y) {
  const sourceW = Math.round(DEFAULT_BLOCK_SIZE.w / AIR_BLOCK_WIDTH_SCALE);
  const sourceH = Math.round(DEFAULT_BLOCK_SIZE.h / AIR_BLOCK_HEIGHT_SCALE);

  return {
    x: Math.round(x - (sourceW - DEFAULT_BLOCK_SIZE.w) / 2),
    y: Math.round(y - (sourceH - DEFAULT_BLOCK_SIZE.h)),
    w: sourceW,
    h: sourceH,
  };
}

function createEditorItem(x, y) {
  const asset = findSelectedAttributeAsset() || createAttributeAsset(ATTRIBUTE_FALLBACK_FILES[0]);
  return {
    x,
    y,
    w: DEFAULT_ITEM_SIZE.w,
    h: DEFAULT_ITEM_SIZE.h,
    src: asset.src,
    title: asset.title,
    text: asset.text,
  };
}

function createEditorCoin(x, y) {
  return {
    x,
    y,
    w: DEFAULT_COIN_SIZE.w,
    h: DEFAULT_COIN_SIZE.h,
    title: "Монетка!",
    text: "Ты собрал монетку.",
  };
}

function createEditorCostumeCheckpoint(x) {
  return {
    x,
    costume: findSelectedCostumeAsset().id,
  };
}

function removeNearestLevelObject(worldX, worldY, tool) {
  if (tool === "costume") {
    const index = getCurrentLevel().costumeCheckpoints.findIndex(
      (checkpoint) => Math.abs(checkpoint.x - worldX) <= COSTUME_CHECKPOINT_HIT_WIDTH,
    );
    if (index >= 0) getCurrentLevel().costumeCheckpoints.splice(index, 1);
    return index >= 0;
  }

  const collection = tool === "item"
    ? getCurrentLevel().items
    : tool === "coin"
      ? getCurrentLevel().coins
      : getCurrentLevel().blocks;
  const index = collection.findIndex((object) => rectsOverlap({ x: worldX, y: worldY, w: 1, h: 1 }, object));
  if (index >= 0) collection.splice(index, 1);
  return index >= 0;
}

function handleEditorPointer(event) {
  if (!editorMode) return;
  event.preventDefault();

  const tool = editorToolSelect.value;
  const point = getCanvasPoint(event);
  const worldX = snapToGrid(cameraX + point.x);
  const worldY = snapToGrid(point.y);
  const shouldRemove = event.altKey || event.shiftKey || event.button === 2;

  if (shouldRemove) {
    if (!removeNearestLevelObject(worldX, worldY, tool)) return;
  } else if (tool === "item") {
    getCurrentLevel().items.push(createEditorItem(worldX, worldY));
  } else if (tool === "coin") {
    getCurrentLevel().coins.push(createEditorCoin(worldX, worldY));
  } else if (tool === "costume") {
    getCurrentLevel().costumeCheckpoints.push(createEditorCostumeCheckpoint(worldX));
  } else {
    getCurrentLevel().blocks.push(createEditorBlock(worldX, worldY));
  }

  state.platforms = createPlatforms();
  state.coins = createCoins();
  updateHud();
  saveLevel();
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

restartButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
soundToggleButton?.addEventListener("click", toggleSound);
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });
editorToggleButton.addEventListener("click", toggleEditorMode);
editorModeButton.addEventListener("click", toggleEditorMode);
editorLevelSelect.addEventListener("change", () => selectEditorLevel(editorLevelSelect.value));
editorExportButton.addEventListener("click", exportLevel);
editorResetButton.addEventListener("click", resetCustomLevel);
canvas.addEventListener("pointerdown", handleEditorPointer);
canvas.addEventListener("contextmenu", (event) => {
  if (editorMode) event.preventDefault();
});

async function initializeGame() {
  await document.fonts?.ready;
  await refreshLevels();
  loadSavedLevel();
  setBackgroundForCurrentLevel();
  updateEditorItemSelect();
  updateEditorCostumeSelect();
  updateEditorLevelSelect();
  updateEditorUi();
  updateSoundToggleUi();
  bindMobileControls();
  await Promise.all([refreshAttributeAssets(), refreshCostumeAssets()]);
  startGame();
}

initializeGame();
