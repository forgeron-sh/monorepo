import type { PixelIcon } from "../types";

// The Uber app icon in pixels, 16×16: the brand is a wordmark only, so it takes the app-icon shape
// the brand uses, a solid square with "Uber" knocked out of it: the capital U, the tall b, the e
// and the short r on one baseline. On 12×12 the four letters do not fit with gaps between them,
// so it takes the brand-mark grid of 16. Monotone. The simple-icons reference could not be fetched
// (rate-limited); drawn by hand from the app icon on 2026-11-18. Uber and the Uber logo are
// trademarks of Uber Technologies, Inc., used here only to refer to Uber.
// 16×16: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "uber",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    ".##############",
    "################",
    "################",
    "################",
    "################",
    "#.#.#.##########",
    "#.#.#.##########",
    "#.#.#...#...#..#",
    "#.#.#.#.#.#.#.##",
    "#.#.#.#.#...#.##",
    "#.#.#.#.#.###.##",
    "#...#...#...#.##",
    "################",
    "################",
    "################",
    ".##############",
  ],
};

export default icon;
