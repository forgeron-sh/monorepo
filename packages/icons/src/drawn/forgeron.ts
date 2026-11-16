import type { PixelIcon } from "../types";

// The Forgeron mark: the anvil of `assets/logos` sampled on a 12×12 grid (the site's `pixelLogo(12)`).
// Monotone only: the mark is never two-tone.
const icon: PixelIcon = {
  name: "forgeron",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "############",
    "###########.",
    "##########..",
    ".########...",
    "..######....",
    "...####.....",
    "...####.....",
    "...####.....",
    "..######....",
    "############",
    "############",
    "############",
  ],
};

export default icon;
