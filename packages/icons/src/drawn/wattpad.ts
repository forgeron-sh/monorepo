import type { PixelIcon } from "../types";

// The Wattpad mark: a bold W whose middle stroke splits into a rounded arch.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wattpad",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "##...##...##",
    "##...##...##",
    "##..####..##",
    ".##.#..#.##",
    ".####..####",
    "..##....##",
  ],
};

export default icon;
