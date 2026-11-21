import type { PixelIcon } from "../types";

// A turntable: a record on a platter and a tone arm.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "turntable",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "#..........#",
    "#..####..#.#",
    "#.#....#.#.#",
    "#.#.oo.#.#.#",
    "#.#.oo.#.#.#",
    "#.#....##..#",
    "#..####....#",
    "#..........#",
    "############",
  ],
};

export default icon;
