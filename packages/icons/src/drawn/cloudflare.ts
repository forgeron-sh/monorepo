import type { PixelIcon } from "../types";

// The Cloudflare logo mark in pixels, 16×16 (the mark is about 2.2 times as wide as it is tall,
// too small to read on 12×12): the large cloud with its dome, its left bump and the cut that
// sweeps into the gap, in the primary tone; the small cloud in the secondary tone, lighter as in
// the logo. 16 × 8 pixels (2:1, the logo is 2.19:1). Rasterised from the reference
// `logos:cloudflare-icon` (Iconify, 2026-11-16), then redrawn by hand on 2026-11-16 by the
// protocol of docs/icons.md. Cloudflare and its logo are trademarks of Cloudflare, Inc., used here
// only to refer to Cloudflare.
const icon: PixelIcon = {
  name: "cloudflare",
  implemented: true,
  style: "pixel",
  grid: 16,
  rows: [
    "................",
    "................",
    "................",
    "................",
    ".......####.....",
    "......######....",
    "..##.########...",
    ".###########.oo.",
    ".##########.oooo",
    "####........oooo",
    "###########ooooo",
    "###########ooooo",
    "................",
    "................",
    "................",
    "................",
  ],
};

export default icon;
