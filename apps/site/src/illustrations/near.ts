/**
 * Runs `fn` once, when `el` comes within a screen's height of the viewport (rootMargin
 * `100% 0px`, as the iso engine starts): the below-the-fold effects of the site load their code
 * then (docs/shaders/design.md, S2c notes). One already on screen, or near it, runs on the
 * observer's first callback. Without IntersectionObserver it runs at once.
 */
export function whenNear(el: Element, fn: () => void): void {
  if (typeof IntersectionObserver === "undefined") return fn();
  const near = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      fn();
    },
    { rootMargin: "100% 0px" },
  );
  near.observe(el);
}
