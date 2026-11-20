/**
 * The filter of the editorial indexes (blog, customers, changelog): buttons `[data-filter]` show
 * the items `[data-category]` of their value (several values separated by spaces), `all` shows
 * every item. Hatched cells `[data-fill]` close the last row of a three-column grid. The choice
 * lives in the address (`?<param>=`). Without JavaScript every item shows.
 */
export function mountFilter(rootSelector: string, param: string, columns = 3): void {
  const root = document.querySelector<HTMLElement>(rootSelector);
  if (!root) return;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-filter]")];
  const items = [...root.querySelectorAll<HTMLElement>("[data-category]")];
  const fills = [...root.querySelectorAll<HTMLElement>("[data-fill]")];
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  const apply = (filter: string, push: boolean) => {
    const known = buttons.some((b) => b.dataset.filter === filter) ? filter : "all";
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.filter === known));
    let shown = 0;
    for (const item of items) {
      const values = (item.dataset.category ?? "").split(" ");
      item.hidden = known !== "all" && !values.includes(known);
      if (!item.hidden) shown++;
    }
    const missing = shown === 0 ? 0 : (columns - (shown % columns)) % columns;
    fills.forEach((f, i) => (f.hidden = i >= missing));
    if (empty) empty.hidden = shown > 0;
    // A group (a month of the changelog) hides when none of its items shows.
    for (const group of root.querySelectorAll<HTMLElement>("[data-group]"))
      group.hidden = !group.querySelector("[data-category]:not([hidden])");
    if (push) {
      const url = new URL(location.href);
      if (known === "all") url.searchParams.delete(param);
      else url.searchParams.set(param, known);
      history.replaceState(null, "", url);
    }
  };
  for (const b of buttons)
    b.addEventListener("click", () => apply(b.dataset.filter ?? "all", true));
  apply(new URL(location.href).searchParams.get(param) ?? "all", false);
}
