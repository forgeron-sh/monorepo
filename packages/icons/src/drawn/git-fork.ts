import type { PixelIcon } from "../types";

// Fork, 12×12: two branches turning at right angles into one stem; the commits are the
// secondary tone.
// Proportions after Hugeicons `git-fork` (Iconify preview, 2026-11-16), redrawn as pixel art, not traced.
const icon: PixelIcon = {
  name: "git-fork",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "............",
    ".oo......oo.",
    ".oo......oo.",
    ".#........#.",
    ".#........#.",
    ".##########.",
    ".....##.....",
    ".....##.....",
    ".....##.....",
    ".....oo.....",
    ".....oo.....",
    "............",
  ],
};

export default icon;
