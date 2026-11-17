import type { PixelIcon } from "../types";

// Left stroke: a dashed square whose left side is a solid line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stroke-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o.##..##.#",
    ".o",
    ".o........#",
    ".o........#",
    ".o",
    ".o",
    ".o........#",
    ".o........#",
    ".o",
    ".o.##..##.#",
  ],
};

export default icon;
