// The example frames: the Preview / Code switch and the copy buttons. Plain DOM, no framework.

for (const frame of document.querySelectorAll<HTMLElement>("[data-frame]")) {
  const buttons = frame.querySelectorAll<HTMLButtonElement>("[data-view]");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const view = button.dataset.view ?? "preview";
      frame.dataset.show = view;
      for (const b of buttons) b.setAttribute("aria-pressed", String(b === button));
    });
  }
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  const label = button.textContent;
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copy ?? "");
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.dataset.text ?? target.textContent ?? "");
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = label), 1600);
    } catch {
      // Without clipboard access the code is still there to select.
    }
  });
}

// On a phone the sidebar is a strip of links: bring the current one into view.
const current = document.querySelector<HTMLElement>(".side a[aria-current='page']");
const strip = current?.closest<HTMLElement>(".side");
if (current && strip && strip.scrollWidth > strip.clientWidth) {
  strip.scrollLeft = current.offsetLeft - strip.clientWidth / 2 + current.offsetWidth / 2;
}
