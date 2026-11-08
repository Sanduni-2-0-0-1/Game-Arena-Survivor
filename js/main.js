import { clearPressed, moveVector, wasPressed } from "./input.js";
import { initAudio, sfx } from "./audio.js";
import { createPlayer } from "./entities.js";
import {
  updatePlayer, updateBullets, updateEnemies, updateWaves,
  resolveBulletHits, rollUpgrades,
} from "./systems.js";
import { drawGame, updateParticles, camera } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const startOverlay = document.getElementById("start-overlay");
const upgradeOverlay = document.getElementById("upgrade-overlay");
const gameoverOverlay = document.getElementById("gameover-overlay");
const finalScore = document.getElementById("final-score");
const cardsEl = document.getElementById("cards");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

const state = {
  W, H,
  player: createPlayer(W / 2, H / 2),
  bullets: [],
  enemies: [],
  score: 0,
  wave: 1,
  spawnTimer: 0,
  spawnInterval: 1.2,
  elapsed: 0,
  gameOver: false,
  paused: false,
  started: false,
  pendingLevelUp: false,
  dashRequested: false,
};

function reset() {
  state.player = createPlayer(W / 2, H / 2);
  state.bullets = [];
  state.enemies = [];
  state.score = 0;
  state.wave = 1;
  state.spawnTimer = 0;
  state.spawnInterval = 1.2;
  state.elapsed = 0;
  state.gameOver = false;
  state.paused = false;
  state.pendingLevelUp = false;
  gameoverOverlay.classList.add("hidden");
  upgradeOverlay.classList.add("hidden");
}

function startGame() {
  initAudio();
  reset();
  state.started = true;
  startOverlay.classList.add("hidden");
}

function triggerLevelUp() {
  state.paused = true;
  state.pendingLevelUp = false;
  sfx.levelUp();
  cardsEl.innerHTML = "";
  const choices = rollUpgrades(3);
  for (const up of choices) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${up.name}</h3><p>${up.desc}</p>`;
    card.addEventListener("click", () => {
      up.apply(state.player);
      upgradeOverlay.classList.add("hidden");
      state.paused = false;
    });
    cardsEl.appendChild(card);
  }
  upgradeOverlay.classList.remove("hidden");
}

function triggerGameOver() {
  state.gameOver = true;
  state.paused = true;
  sfx.gameOver();
  finalScore.textContent = `Score: ${state.score}   Wave reached: ${state.wave}`;
  gameoverOverlay.classList.remove("hidden");
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => {
  reset();
  state.started = true;
});

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  if (state.started && !state.gameOver) {
    if (state.pendingLevelUp) {
      triggerLevelUp();
    } else if (!state.paused) {
      state.elapsed += dt;
      if (wasPressed(" ")) state.dashRequested = true;
      updatePlayer(state, dt, moveVector());
      updateBullets(state, dt);
      updateEnemies(state, dt);
      updateWaves(state, dt);
      resolveBulletHits(state);
      if (state.player.hp <= 0) triggerGameOver();
    }
  }
  if (state.gameOver && wasPressed("r")) {
    reset();
    state.started = true;
  }

  updateParticles(dt);
  drawGame(ctx, state);
  clearPressed();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);