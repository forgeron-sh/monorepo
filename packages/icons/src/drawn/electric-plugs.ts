import type { PixelIcon } from "../types";

// A plug facing a socket, each on its cable.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "electric-plugs",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..###...###",
    "..#.#oo.#.#",
    "###.#...#.##",
    "###.#...#.##",
    "..#.#oo.#.#",
    "..###...###",
  ],
};

export default icon;
