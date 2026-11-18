import type { PixelIcon } from "../types";

// Pac-Man ghost: a domed body with a wavy hem and two eyes looking aside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pacman-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..########",
    ".##########",
    ".##..##..##",
    ".##.o##.o##",
    ".##########",
    ".##########",
    ".##########",
    ".##########",
    ".#.##..##.#",
  ],
};

export default icon;
