export function createPlayer(x, y) {
  return {
    x, y, r: 16,
    speed: 240,
    hp: 100, maxHp: 100,
    fireRate: 0.45, fireTimer: 0,
    damage: 10,
    bulletsPerShot: 1,
    regen: 0,
    dashTimer: 0, dashCooldown: 0, dashDir: { x: 1, y: 0 },
    invuln: 0,
    trail: [],
  };
}

export function createEnemy(x, y, wave) {
  return {
    x, y, r: 14,
    speed: 90 + wave * 6,
    hp: 20 + wave * 6,
    maxHp: 20 + wave * 6,
    damage: 8,
    hitFlash: 0,
  };
}

export function createBullet(x, y, dirX, dirY, damage) {
  const speed = 620;
  return {
    x, y, r: 5,
    vx: dirX * speed, vy: dirY * speed,
    damage,
    life: 2,
  };
}