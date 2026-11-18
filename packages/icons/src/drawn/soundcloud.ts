import type { PixelIcon } from "../types";

// The SoundCloud mark in pixels: the cloud with the rising bars of sound on its left.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "soundcloud",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".......###",
    "....#.#####",
    "..#.#.######",
    "#.#.#.######",
    "#.#.#.######",
  ],
};

export default icon;
