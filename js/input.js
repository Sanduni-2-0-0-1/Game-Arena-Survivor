const keys = {};
const pressed = {};

addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (!keys[k]) pressed[k] = true;
  keys[k] = true;
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
});
addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

export function isDown(k) { return !!keys[k]; }
export function wasPressed(k) {
  if (pressed[k]) { pressed[k] = false; return true; }
  return false;
}
export function clearPressed() { for (const k in pressed) pressed[k] = false; }

export function moveVector() {
  const x = (isDown("d") || isDown("arrowright") ? 1 : 0) - (isDown("a") || isDown("arrowleft") ? 1 : 0);
  const y = (isDown("s") || isDown("arrowdown") ? 1 : 0) - (isDown("w") || isDown("arrowup") ? 1 : 0);
  const len = Math.hypot(x, y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}