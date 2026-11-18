// A picture for the dithered-image demo, drawn on the spot rather than shipped as a file: a dark
// room, a lit grey anvil-like block, a warm glow in the corner (what the dither turns to ember).
// Deterministic: the same picture every time. Browser only.

export function forgePicture(width = 480, height = 300): string {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#050505");
  sky.addColorStop(1, "#3a3a3a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  // The glow of the hearth, bottom right: warm, so it comes out in ember.
  const glow = ctx.createRadialGradient(
    width * 0.85,
    height * 1.05,
    0,
    width * 0.85,
    height,
    width * 0.5,
  );
  glow.addColorStop(0, "#ffb070");
  glow.addColorStop(0.35, "#e2441a");
  glow.addColorStop(1, "rgba(120, 30, 10, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  // A sphere lit from the top left.
  const cx = width * 0.36;
  const cy = height * 0.48;
  const r = height * 0.32;
  const ball = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.45, r * 0.05, cx, cy, r);
  ball.addColorStop(0, "#f2f2f2");
  ball.addColorStop(0.5, "#8a8a8a");
  ball.addColorStop(1, "#1a1a1a");
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // A floor line.
  ctx.fillStyle = "#555";
  ctx.fillRect(0, height * 0.82, width, 2);
  return c.toDataURL("image/png");
}
