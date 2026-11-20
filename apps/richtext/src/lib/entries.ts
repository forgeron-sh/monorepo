// The catalog as plain data for the islands (their toggles), from the same source as the pages.
import { catalog, familyLabel } from "./catalog";

export const entries = catalog.map((d) => ({
  id: d.id,
  name: d.name,
  family: d.family,
  familyLabel: familyLabel(d.family),
}));
