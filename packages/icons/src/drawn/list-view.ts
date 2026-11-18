import type { PixelIcon } from "../types";

// List: four items, a bullet in the secondary tone and a line each.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-view",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oo.#######",
    "",
    "",
    ".oo.#######",
    "",
    "",
    ".oo.#######",
    "",
    "",
    ".oo.#######",
  ],
};

export default icon;
