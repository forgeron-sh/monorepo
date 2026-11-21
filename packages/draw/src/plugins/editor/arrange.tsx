// The actions on a selection, editor half: groups (⌘G, ⇧⌘G), lock (⇧⌘L), align and distribute, and
// the basic ones (duplicate, delete, z-order). Each is a button of the properties panel and, where
// there is one, a key; every one is one undo step, and the draw engine moves the frames' items and
// the bound arrows along with what it changes.

import {
  AlignBottomIcon,
  AlignHorizontalCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  BringToFrontIcon,
  Copy01Icon,
  Delete02Icon,
  DistributeHorizontalCenterIcon,
  DistributeVerticalCenterIcon,
  GroupItemsIcon,
  LockIcon,
  LockOpenIcon,
  SendToBackIcon,
  UngroupItemsIcon,
  type IconDefinition,
} from "@forgeron/icons";
import type { Changes } from "../../core/plugin";
import { defineEditorPlugin, type EditorContext, type MenuState } from "../../react/plugin";
import { align, distribute, type AlignEdge, alignPlugin as alignCore } from "../align";
import { group, groups as groupsCore, newGroupId, ungroup } from "../groups";
import { lock as lockCore, toggleLock } from "../lock";
import { arrange as arrangeCore } from "../ui";

const apply = (ctx: EditorContext, label: string, changes: Changes) => {
  if (changes.length) ctx.store.updateMany(changes, { label });
};

const allLocked = (s: MenuState) => s.selected.length > 0 && s.selected.every((i) => i.locked);

export const groups = defineEditorPlugin({
  core: groupsCore,
  menu: [
    {
      id: "group",
      section: "arrange",
      order: 150,
      icon: GroupItemsIcon,
      label: "Group",
      disabled: (s) => s.selected.length < 2,
      run: (ctx, s) => apply(ctx, "Group", group(s.selected, newGroupId(s.items))),
    },
    {
      id: "ungroup",
      section: "arrange",
      order: 160,
      icon: UngroupItemsIcon,
      label: "Ungroup",
      disabled: (s) => !s.selected.some((i) => i.data.group),
      run: (ctx, s) => apply(ctx, "Ungroup", ungroup(s.selected)),
    },
  ],
  keys: [
    {
      combo: "mod+g",
      run(ctx, e) {
        e.preventDefault();
        apply(ctx, "Group", group(ctx.selected(), newGroupId(ctx.items())));
      },
    },
    {
      combo: "mod+shift+g",
      run(ctx, e) {
        e.preventDefault();
        apply(ctx, "Ungroup", ungroup(ctx.selected()));
      },
    },
  ],
});

export const lock = defineEditorPlugin({
  core: lockCore,
  menu: [
    {
      id: "lock",
      section: "arrange",
      order: 170,
      icon: (s) => (allLocked(s) ? LockOpenIcon : LockIcon),
      label: (s) => (allLocked(s) ? "Unlock" : "Lock"),
      run: (ctx, s) => apply(ctx, allLocked(s) ? "Unlock" : "Lock", toggleLock(s.selected)),
    },
  ],
  keys: [
    {
      combo: "mod+shift+l",
      run(ctx, e) {
        e.preventDefault();
        apply(ctx, "Lock", toggleLock(ctx.selected()));
      },
    },
  ],
});

const edge = (id: string, order: number, icon: IconDefinition, label: string, to: AlignEdge) => ({
  id,
  section: "align",
  order,
  icon,
  label,
  when: (s: MenuState) => s.selected.length >= 2,
  run: (ctx: EditorContext, s: MenuState) => apply(ctx, "Align", align(s.selected, to)),
});

const spread = (
  id: string,
  order: number,
  icon: IconDefinition,
  label: string,
  axis: "horizontal" | "vertical",
) => ({
  id,
  section: "align",
  order,
  icon,
  label,
  when: (s: MenuState) => s.selected.length >= 2,
  disabled: (s: MenuState) => s.selected.length < 3,
  run: (ctx: EditorContext, s: MenuState) => apply(ctx, "Distribute", distribute(s.selected, axis)),
});

export const alignPlugin = defineEditorPlugin({
  core: alignCore,
  menu: [
    edge("align-left", 200, AlignLeftIcon, "Align left", "left"),
    edge("align-center", 210, AlignHorizontalCenterIcon, "Align centres", "center"),
    edge("align-right", 220, AlignRightIcon, "Align right", "right"),
    edge("align-top", 230, AlignTopIcon, "Align top", "top"),
    edge("align-middle", 240, AlignVerticalCenterIcon, "Align middles", "middle"),
    edge("align-bottom", 250, AlignBottomIcon, "Align bottom", "bottom"),
    spread("distribute-h", 260, DistributeHorizontalCenterIcon, "Distribute across", "horizontal"),
    spread("distribute-v", 270, DistributeVerticalCenterIcon, "Distribute down", "vertical"),
  ],
});

export const arrange = defineEditorPlugin({
  core: arrangeCore,
  menu: [
    {
      id: "duplicate",
      section: "arrange",
      order: 110,
      icon: Copy01Icon,
      label: "Duplicate",
      run: (ctx) => void ctx.store.duplicateSelection(),
    },
    {
      id: "delete",
      section: "arrange",
      order: 120,
      icon: Delete02Icon,
      label: "Delete",
      disabled: allLocked,
      run: (ctx) => void ctx.store.deleteSelection(),
    },
    {
      id: "bring-to-front",
      section: "arrange",
      order: 130,
      icon: BringToFrontIcon,
      label: "Bring to front",
      run: (ctx) => void ctx.store.bringToFront(),
    },
    {
      id: "send-to-back",
      section: "arrange",
      order: 140,
      icon: SendToBackIcon,
      label: "Send to back",
      run: (ctx) => void ctx.store.sendToBack(),
    },
  ],
});
