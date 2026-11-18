import type { PixelIcon } from "../types";

// Contact card: a card, a head in the secondary tone, shoulders and two lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "contact-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#.oo.....#",
    ".#.oo..##.#",
    ".#........#",
    ".#.###.##.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
