import { createEnemy, createBullet } from "./entities.js";
import { addShake, burst } from "./render.js";
import { sfx } from "./audio.js";

export function spawnEnemy(state) {
  const ang = Math.random() * Math.PI * 2;
  const dist = 560;
  const e = createEnemy(
    state.player.x + Math.cos(ang) * dist,
    state.player.y + Math.sin(ang) * dist,
    state.wave
  );
  state.enemies.push(e);
}

export function updateWaves(state, dt) {
  state.spawnTimer += dt;
  state.wave = 1 + Math.floor(state.score / 10);
  state.spawnInterval = Math.max(0.22, 1.2 - state.wave * 0.05);
  if (state.spawnTimer >= state.spawnInterval) {
    state.spawnTimer = 0;
    spawnEnemy(state);
  }
}

export function updatePlayer(state, dt, move) {
  const p = state.player;

  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.fireTimer -= dt;
  if (p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

  // dash trigger
  if (state.dashRequested && p.dashCooldown <= 0) {
    p.dashTimer = 0.15;
    p.dashCooldown = 1.1;
    p.invuln = 0.35;
    p.dashDir = (move.x || move.y) ? move : { x: 1, y: 0 };
    sfx.dash();
  }
  state.dashRequested = false;

  // movement
  let sp = p.speed;
  let mx = move.x, my = move.y;
  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    sp *= 4;
    mx = p.dashDir.x; my = p.dashDir.y;
  }
  p.x += mx * sp * dt;
  p.y += my * sp * dt;

  // bounds
  p.x = Math.max(p.r, Math.min(state.W - p.r, p.x));
  p.y = Math.max(p.r, Math.min(state.H - p.r, p.y));

  // trail for dash
  if (p.dashTimer > 0) {
    p.trail.push({ x: p.x, y: p.y, life: 0.25 });
  }
  for (const t of p.trail) t.life -= dt;
  p.trail = p.trail.filter((t) => t.life > 0);

  // auto shoot nearest
  if (p.fireTimer <= 0 && state.enemies.length) {
    p.fireTimer = p.fireRate;
    let nearest = state.enemies[0], best = Infinity;
    for (const e of state.enemies) {
      const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
      if (d < best) { best = d; nearest = e; }
    }
    const dx = nearest.x - p.x, dy = nearest.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len, ny = dy / len;
    const count = p.bulletsPerShot;
    const spread = 0.18;
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * spread;
      const cos = Math.cos(off), sin = Math.sin(off);
      const rx = nx * cos - ny * sin;
      const ry = nx * sin + ny * cos;
      state.bullets.push(createBullet(p.x, p.y, rx, ry, p.damage));
    }
    sfx.shoot();
  }
}

export function updateBullets(state, dt) {
  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  state.bullets = state.bullets.filter(
    (b) => b.life > 0 && b.x > -30 && b.x < state.W + 30 && b.y > -30 && b.y < state.H + 30
  );
}

export function updateEnemies(state, dt) {
  const p = state.player;
  for (const e of state.enemies) {
    if (e.hitFlash > 0) e.hitFlash -= dt;
    const dx = p.x - e.x, dy = p.y - e.y;
    const len = Math.hypot(dx, dy) || 1;
    e.x += (dx / len) * e.speed * dt;
    e.y += (dy / len) * e.speed * dt;

    if (len < p.r + e.r) {
      if (p.invuln <= 0) {
        p.hp -= e.damage;
        addShake(8);
        burst(p.x, p.y, "#ef476f", 8, 160);
        sfx.hurt();
      }
      e.hp = -1;
      if (p.hp <= 0) { p.hp = 0; state.gameOver = true; }
    }
  }
  state.enemies = state.enemies.filter((e) => e.hp > 0);
}

export function resolveBulletHits(state) {
  for (const b of state.bullets) {
    for (const e of state.enemies) {
      const d = Math.hypot(b.x - e.x, b.y - e.y);
      if (d < b.r + e.r) {
        e.hp -= b.damage;
        e.hitFlash = 0.12;
        b.dead = true;
        burst(b.x, b.y, "#ffd166", 4, 120);
        sfx.hit();
        if (e.hp <= 0) {
          state.score++;
          burst(e.x, e.y, "#ef476f", 14, 220);
          addShake(4);
          sfx.enemyDie();
          if (state.score % 10 === 0) state.pendingLevelUp = true;
        }
        break;
      }
    }
  }
  state.bullets = state.bullets.filter((b) => !b.dead);
}

export const UPGRADES = [
  { name: "RAPID FIRE",   desc: "Fire 15% faster",        apply: (p) => { p.fireRate *= 0.85; } },
  { name: "HEAVY ROUNDS", desc: "+6 damage",              apply: (p) => { p.damage += 6; } },
  { name: "VITALITY",     desc: "+25 max HP, heal 25",    apply: (p) => { p.maxHp += 25; p.hp += 25; } },
  { name: "SWIFTNESS",    desc: "+30 move speed",         apply: (p) => { p.speed += 30; } },
  { name: "MULTISHOT",    desc: "+1 bullet per shot",     apply: (p) => { p.bulletsPerShot += 1; } },
  { name: "REGEN",        desc: "+2 HP per second",       apply: (p) => { p.regen += 2; } },
  { name: "DASH MASTER",  desc: "Dash cooldown -30%",     apply: (p) => { p.dashCooldownBase = (p.dashCooldownBase || 1.1) * 0.7; } },
];

export function rollUpgrades(count = 3) {
  const pool = [...UPGRADES];
  const picked = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}