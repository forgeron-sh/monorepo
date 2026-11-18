import type { PixelIcon } from "../types";

// The Microsoft logo mark in pixels: four squares in a two by two grid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "microsoft",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####.#####",
    ".#####.#####",
    ".#####.#####",
    ".#####.#####",
    ".#####.#####",
    "",
    ".#####.#####",
    ".#####.#####",
    ".#####.#####",
    ".#####.#####",
    ".#####.#####",
  ],
};

export default icon;
