import type { Atom } from "../types";

/** Gallery entry of the AccessList primitive, extracted from the share, invite and recipients blocks (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "access-list",
    name: "Access list",
    summary:
      "People with a role: an avatar, a name, a line under it, a role select and a remove button, and a search box that adds people from a directory.",
    imports: [
      "AccessList",
      "AccessListItem",
      "AccessListRole",
      "AccessListRemove",
      "AccessListFixed",
      "AccessListEmpty",
      "PeopleCombobox",
    ],
    props: [
      {
        name: "AccessList",
        type: "ul",
        description: "The list; give it an `aria-label`. Takes any ul prop.",
      },
      {
        name: "AccessListItem",
        type: "{ name, src?, secondary?, size? } & li props",
        description:
          "One person: avatar (28px by default), name and the line under it; its children go at the end of the row.",
      },
      {
        name: "AccessListRole",
        type: "{ label, roles, value?, defaultValue?, onValueChange?, onRemove?, removeLabel?, variant? }",
        description:
          "A select of roles drawn as a chip, on the Select parts. `onRemove` adds a last choice, “Remove access” by default, that calls it.",
      },
      {
        name: "AccessListRemove",
        type: "button",
        description:
          "An icon button that takes the person off; `aria-label` names it. `asChild` draws your element instead; children replace the cross.",
      },
      {
        name: "AccessListFixed",
        type: "span",
        description: "A role that cannot be changed here (the owner, inherited): mono text.",
      },
      {
        name: "AccessListEmpty",
        type: "li",
        description: "Says so when nobody is listed.",
      },
      {
        name: "PeopleCombobox",
        type: "{ people, onAdd, label?, placeholder?, emptyText?, disabled?, className? }",
        description:
          "A search box on the Combobox parts: matches the name and the hint, Enter adds the first, the box clears. Leave out those already listed from `people`. A `Person` is `{ id, name, hint?, src? }`.",
      },
    ],
  },
];
