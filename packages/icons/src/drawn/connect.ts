import type { PixelIcon } from "../types";

// Two plugs facing each other, their prongs in the secondary tone, about to connect.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "connect",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "###......###",
    "#.#......#.#",
    "#.#oo..oo#.#",
    "#.#......#.#",
    "#.#......#.#",
    "#.#oo..oo#.#",
    "#.#......#.#",
    "###......###",
  ],
};

export default icon;
