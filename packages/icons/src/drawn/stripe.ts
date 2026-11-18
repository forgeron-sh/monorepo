import type { PixelIcon } from "../types";

// The Stripe mark in pixels: the bold S.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "stripe",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#######",
    "..###",
    "..###",
    "..#######",
    "...#######",
    ".......###",
    ".......###",
    "..########",
    "..#######",
  ],
};

export default icon;
