import type { PixelIcon } from "../types";

// The LottieFiles mark in pixels: a rounded square with the eased curve cut out of it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "lottiefiles",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "#######...##",
    "######..####",
    "######.#####",
    "#####..#####",
    "#####.######",
    "####..######",
    "####.#######",
    "##...#######",
    "############",
    ".##########",
  ],
};

export default icon;
