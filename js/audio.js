let ctx = null;

export function initAudio() {
  if (ctx) return;
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
}

function beep(freq, dur, type = "square", vol = 0.05, slideTo = null) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + dur);
}

export const sfx = {
  shoot: () => beep(900, 0.05, "square", 0.025, 600),
  hit: () => beep(300, 0.05, "square", 0.03, 150),
  enemyDie: () => beep(180, 0.18, "sawtooth", 0.05, 60),
  hurt: () => beep(120, 0.18, "sawtooth", 0.09, 50),
  dash: () => beep(500, 0.12, "sine", 0.05, 1200),
  levelUp: () => { beep(600, 0.1, "triangle", 0.06); setTimeout(() => beep(900, 0.15, "triangle", 0.06), 90); },
  gameOver: () => {
    beep(400, 0.25, "triangle", 0.08);
    setTimeout(() => beep(300, 0.25, "triangle", 0.08), 220);
    setTimeout(() => beep(200, 0.5, "triangle", 0.08), 440);
  },
};