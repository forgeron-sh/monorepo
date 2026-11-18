import type { PixelIcon } from "../types";

// Minimal wallet: a plain body with a flap line and a button in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wallet-minimal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#......oo#",
    ".#......oo#",
    ".#........#",
    "..########",
  ],
};

export default icon;
