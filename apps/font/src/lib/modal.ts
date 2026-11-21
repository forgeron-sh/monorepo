// Modals of the site: a `[data-modal-open="<id>"]` button opens `dialog#<id>[data-modal]` as a
// modal (the browser traps the focus and makes the page inert); Esc, a `[data-modal-close]`
// button or a click on the backdrop closes it, and the focus returns to the button that opened it.

const openers = new WeakMap<HTMLDialogElement, HTMLElement>();

for (const opener of document.querySelectorAll<HTMLElement>("[data-modal-open]")) {
  opener.addEventListener("click", () => {
    const dialog = document.getElementById(opener.dataset.modalOpen ?? "");
    if (!(dialog instanceof HTMLDialogElement)) return;
    openers.set(dialog, opener);
    dialog.showModal();
  });
}

for (const dialog of document.querySelectorAll<HTMLDialogElement>("dialog[data-modal]")) {
  const close = () => {
    dialog.close();
    openers.get(dialog)?.focus();
  };
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  for (const b of dialog.querySelectorAll<HTMLElement>("[data-modal-close]"))
    b.addEventListener("click", close);
}
