// The list plugins, editor halves: bullets, numbers and to-dos, with the keys of a list.

import { BulletList, ListItem, ListKeymap, OrderedList } from "@tiptap/extension-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import {
  bulletList as bulletListCore,
  listItem as listItemCore,
  orderedList as orderedListCore,
  taskList as taskListCore,
} from "../lists";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";

export const listItem = defineEditorPlugin({
  core: listItemCore,
  extensions: [ListItem, ListKeymap],
});

export const bulletList = defineEditorPlugin({
  core: bulletListCore,
  extensions: [BulletList],
  blocks: {
    "bullet-list": {
      apply: ({ editor, range }) => {
        if (editor.isActive("bulletList") && !range) return;
        startChain(editor, range).clearNodes().toggleBulletList().run();
      },
      isActive: (editor) => editor.isActive("bulletList"),
    },
  },
  turnable: ["bulletList"],
});

export const orderedList = defineEditorPlugin({
  core: orderedListCore,
  extensions: [OrderedList],
  blocks: {
    "ordered-list": {
      apply: ({ editor, range }) => {
        if (editor.isActive("orderedList") && !range) return;
        startChain(editor, range).clearNodes().toggleOrderedList().run();
      },
      isActive: (editor) => editor.isActive("orderedList"),
    },
  },
  turnable: ["orderedList"],
});

export const taskList = defineEditorPlugin({
  core: taskListCore,
  extensions: [TaskList, TaskItem.configure({ nested: true })],
  blocks: {
    "task-list": {
      apply: ({ editor, range }) => {
        if (editor.isActive("taskList") && !range) return;
        startChain(editor, range).clearNodes().toggleList("taskList", "taskItem").run();
      },
      isActive: (editor) => editor.isActive("taskList"),
      // A bullet list nested in a to-do item is still "in a to-do list" for the label.
      precedence: 1,
    },
  },
  turnable: ["taskList"],
});

export const listPlugins = [listItem, bulletList, orderedList, taskList] as const;
