// The example frames: the Preview / Code switch and the copy buttons. Plain DOM, no framework.
// Wired on every page the client router shows (`astro:page-load` also fires on the first load).

function wire() {
  for (const frame of document.querySelectorAll<HTMLElement>("[data-frame]:not([data-wired])")) {
    frame.dataset.wired = "";
    const buttons = frame.querySelectorAll<HTMLButtonElement>("[data-view]");
    for (const button of buttons) {
      button.addEventListener("click", () => {
        const view = button.dataset.view ?? "preview";
        frame.dataset.show = view;
        for (const b of buttons) b.setAttribute("aria-pressed", String(b === button));
      });
    }
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-copy]:not([data-wired])",
  )) {
    button.dataset.wired = "";
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
}

document.addEventListener("astro:page-load", wire);
