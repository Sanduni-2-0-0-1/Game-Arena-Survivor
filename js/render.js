export const camera = { x: 0, y: 0, shake: 0 };
export const particles = [];

export function addShake(amount) {
  camera.shake = Math.min(camera.shake + amount, 22);
}

export function burst(x, y, color, count = 12, speed = 220) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.35 + Math.random() * 0.8);
    particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0.35 + Math.random() * 0.35,
      maxLife: 0.7,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

export function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
  camera.shake *= 0.88;
  if (camera.shake < 0.3) camera.shake = 0;
  camera.x = (Math.random() - 0.5) * camera.shake;
  camera.y = (Math.random() - 0.5) * camera.shake;
}

function drawGrid(ctx, W, H) {
  ctx.strokeStyle = "#1e1e30";
  ctx.lineWidth = 1;
  const g = 40;
  ctx.beginPath();
  for (let x = 0; x <= W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

function glowCircle(ctx, x, y, r, color, glow) {
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

export function drawGame(ctx, state) {
  const { W, H } = state;
  ctx.fillStyle = "#12121f";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(camera.x, camera.y);

  drawGrid(ctx, W, H);

  // particles (behind entities looks nicer, but either is fine)
  for (const p of particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // bullets
  for (const b of state.bullets) {
    glowCircle(ctx, b.x, b.y, b.r, "#ffd166", 12);
  }

  // enemies
  for (const e of state.enemies) {
    const flash = e.hitFlash > 0;
    const color = flash ? "#ffffff" : "#ef476f";
    glowCircle(ctx, e.x, e.y, e.r, color, 14);
    // hp bar
    const hpw = 30;
    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "#333";
    ctx.fillRect(e.x - hpw / 2, e.y - e.r - 10, hpw, 4);
    ctx.fillStyle = "#ef476f";
    ctx.fillRect(e.x - hpw / 2, e.y - e.r - 10, hpw * ratio, 4);
  }

  // dash trail
  const p = state.player;
  for (const t of p.trail) {
    ctx.globalAlpha = Math.max(0, t.life / 0.25) * 0.5;
    ctx.fillStyle = "#4cc9f0";
    ctx.beginPath();
    ctx.arc(t.x, t.y, p.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // player
  const invuln = p.invuln > 0;
  if (invuln) ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 40) * 0.2;
  glowCircle(ctx, p.x, p.y, p.r, "#4cc9f0", 24);
  ctx.globalAlpha = 1;
  // player outline
  ctx.strokeStyle = "#a8e8ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  // HUD (not affected by shake)
  drawHUD(ctx, state);
}

function drawHUD(ctx, state) {
  const { W, player, score, wave } = state;
  ctx.fillStyle = "#fff";
  ctx.font = "20px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}    Wave: ${wave}`, 20, 34);

  // hp bar
  const barW = 220, barH = 16;
  ctx.fillStyle = "#333";
  ctx.fillRect(20, 48, barW, barH);
  const ratio = Math.max(0, player.hp / player.maxHp);
  ctx.fillStyle = ratio > 0.5 ? "#06d6a0" : ratio > 0.25 ? "#ffd166" : "#ef476f";
  ctx.fillRect(20, 48, barW * ratio, barH);
  ctx.strokeStyle = "#555";
  ctx.strokeRect(20, 48, barW, barH);

  ctx.fillStyle = "#9aa";
  ctx.font = "14px 'Courier New', monospace";
  ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, 20 + barW + 10, 62);

  // dash cooldown
  const dashRatio = 1 - Math.max(0, player.dashCooldown) / (player.dashCooldownBase || 1.1);
  ctx.fillStyle = "#333";
  ctx.fillRect(20, 74, barW, 10);
  ctx.fillStyle = "#4cc9f0";
  ctx.fillRect(20, 74, barW * dashRatio, 10);
  ctx.fillStyle = "#9aa";
  ctx.font = "12px 'Courier New', monospace";
  ctx.fillText("DASH", 20 + barW + 10, 84);

  // game over handled by overlay
  ctx.textAlign = "left";
}