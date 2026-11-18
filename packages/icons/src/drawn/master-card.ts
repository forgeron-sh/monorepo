import type { PixelIcon } from "../types";

// The Mastercard mark in pixels: two overlapping discs, the overlap in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "master-card",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..###..###",
    ".####oo####",
    "####oooo####",
    "####oooo####",
    "####oooo####",
    "####oooo####",
    ".####oo####",
    "..###..###",
  ],
};

export default icon;
