// The sidebar outlives the page (`transition:persist`): after each navigation it marks the page
// shown and brings its link into view only when it is out of sight, so a click never moves the
// list. Opened from a link, the page's entry sits about in the middle.

let first = true;
// Moving the persisted sidebar into the new page resets its scroll: keep it across the swap.
let kept: { top: number; left: number } | null = null;
document.addEventListener("astro:before-swap", () => {
  const side = document.querySelector<HTMLElement>(".side");
  kept = side ? { top: side.scrollTop, left: side.scrollLeft } : null;
});
document.addEventListener("astro:after-swap", () => {
  const side = document.querySelector<HTMLElement>(".side");
  if (side && kept) {
    side.scrollTop = kept.top;
    side.scrollLeft = kept.left;
  }
});

document.addEventListener("astro:page-load", () => {
  const side = document.querySelector<HTMLElement>(".side");
  if (!side) return;
  const path = location.pathname.replace(/\/$/, "");
  let current: HTMLElement | null = null;
  for (const link of side.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const here = new URL(link.href).pathname.replace(/\/$/, "") === path;
    if (here) {
      link.setAttribute("aria-current", "page");
      current = link;
    } else link.removeAttribute("aria-current");
  }
  if (!current) return;
  const strip = side.scrollWidth > side.clientWidth;
  const box = side.getBoundingClientRect();
  const at = current.getBoundingClientRect();
  const hidden = strip
    ? at.left < box.left || at.right > box.right
    : at.top < box.top || at.bottom > box.bottom;
  if (first || hidden) {
    if (strip) side.scrollLeft += at.left - box.left - (box.width - at.width) / 2;
    else side.scrollTop += at.top - box.top - (box.height - at.height) / 2;
  }
  first = false;
});
