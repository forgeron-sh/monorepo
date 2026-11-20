// Groups, core half: items of one group are selected together, and a copy of a group is a new
// group. Group and ungroup return the changes, for `store.updateMany(changes, { label })`.

import { definePlugin, type Changes } from "../core/plugin";
import type { DrawData, DrawItem } from "../core/types";

const withGroup = (data: DrawData, group: string | undefined): DrawData => {
  const { group: _old, ...rest } = data;
  return (group ? { ...rest, group } : rest) as DrawData;
};

/** Puts the items in one group: selecting one selects them all. */
export function group(items: ReadonlyArray<DrawItem>, groupId: string): Changes {
  if (items.length < 2) return [];
  return items.map((i) => [i.id, { data: withGroup(i.data, groupId) }] as const);
}

/** Takes the items out of their group. */
export function ungroup(items: ReadonlyArray<DrawItem>): Changes {
  return items
    .filter((i) => i.data.group)
    .map((i) => [i.id, { data: withGroup(i.data, undefined) }] as const);
}

/** A group id no item uses yet: `group-<n>`. */
export function newGroupId(items: ReadonlyArray<DrawItem>): string {
  const used = new Set(items.map((i) => i.data.group).filter(Boolean));
  let n = 1;
  while (used.has(`group-${n}`)) n++;
  return `group-${n}`;
}

/** The ids of the items that share a group with any of `ids`, `ids` included. */
export function expandGroups(items: ReadonlyArray<DrawItem>, ids: Iterable<string>): string[] {
  const wanted = new Set(ids);
  const groups = new Set<string>();
  for (const i of items) if (wanted.has(i.id) && i.data.group) groups.add(i.data.group);
  if (groups.size === 0) return [...wanted];
  for (const i of items) if (i.data.group && groups.has(i.data.group)) wanted.add(i.id);
  return [...wanted];
}

export const groups = definePlugin({
  id: "groups",
  name: "Groups",
  description:
    "Items of one group are selected together; a copy of a group is a new group of the copies.",
  engineRules: {
    select: (items, ids) => expandGroups(items, ids),
    copy({ copies, newGroup }) {
      const seen = new Map<string, string>();
      const out: Changes = [];
      for (const copy of copies) {
        const old = copy.data.group;
        if (!old) continue;
        let g = seen.get(old);
        if (!g) {
          g = newGroup(old);
          seen.set(old, g);
        }
        out.push([copy.id, { data: { ...copy.data, group: g } as DrawData }]);
      }
      return out;
    },
  },
});
