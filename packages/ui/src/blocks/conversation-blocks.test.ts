// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addRecipients,
  applyConversationFormat,
  AttachmentList,
  buildConversationRows,
  ConversationList,
  conversationDayLabel,
  conversationFirstUnread,
  conversationListTime,
  conversationReactionLabel,
  conversationTypingLabel,
  EmojiPicker,
  filterMentionOptions,
  findMentionTrigger,
  groupConversationItems,
  insertMention,
  isEmailAddress,
  MessageList,
  parseConversationInline,
  parseMentions,
  parseRecipientText,
  PresenceDot,
  pushRecentEmoji,
  ReactionBar,
  RecipientInput,
  RichComposer,
  searchConversationEmoji,
  ThreadPanel,
  toggleConversationReaction,
  TypingIndicator,
  type ConversationMessage,
  type MentionOption,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
afterEach(() => {
  host?.remove();
  host = undefined;
  vi.restoreAllMocks();
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });
const click = async (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
/** Types into a React-controlled text field. */
const type = async (
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  caret = value.length,
) =>
  act(async () => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, "value")!.set!.call(el, value);
    el.setSelectionRange(caret, caret);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

const lea = { id: "lea", name: "Léa Martin" };
const sam = { id: "sam", name: "Sam Roche" };
const msg = (id: string, at: string, author = lea, extra: Partial<ConversationMessage> = {}) =>
  ({ id, at, author, body: `text ${id}`, ...extra }) as ConversationMessage;
const UTC = { timeZone: "UTC" };

describe("grouping", () => {
  const messages = [
    msg("1", "2026-11-18T09:00:00Z"),
    msg("2", "2026-11-18T09:02:00Z"),
    msg("3", "2026-11-18T09:30:00Z"),
    msg("4", "2026-11-18T09:31:00Z", sam),
    msg("5", "2026-11-19T09:00:00Z", sam),
  ];

  it("starts a run on another author, a long pause and a new day, and adds day separators", () => {
    const rows = buildConversationRows(messages, UTC);
    expect(
      rows.map((r) => (r.type === "message" ? `${r.message.id}${r.head ? "*" : ""}` : r.type)),
    ).toEqual(["day", "1*", "2", "3*", "4*", "day", "5*"]);
  });

  it("places the unread divider right before the first unread message, once", () => {
    const rows = buildConversationRows(messages, { ...UTC, unreadFromId: "3" });
    const at = rows.findIndex((r) => r.type === "unread");
    expect(rows.filter((r) => r.type === "unread")).toHaveLength(1);
    expect(rows[at + 1]).toMatchObject({ type: "message", head: true });
    expect((rows[at + 1] as { message: ConversationMessage }).message.id).toBe("3");
  });

  it("breaks a run at a system line and at a reply quote", () => {
    const rows = buildConversationRows(
      [
        msg("1", "2026-11-18T09:00:00Z"),
        msg("s", "2026-11-18T09:00:30Z", lea, { kind: "system" }),
        msg("2", "2026-11-18T09:01:00Z"),
        msg("3", "2026-11-18T09:01:10Z", lea, { replyTo: { author: "Sam", text: "hi" } }),
      ],
      UTC,
    );
    const heads = rows
      .filter((r) => r.type === "message")
      .map((r) => r.type === "message" && r.head);
    expect(heads).toEqual([true, true, true]);
  });

  it("finds the first unread message of others after the last read", () => {
    expect(conversationFirstUnread(messages, "lea", { id: "2" })).toBe("4");
    expect(conversationFirstUnread(messages, "lea", { at: "2026-11-18T09:40:00Z" })).toBe("5");
    expect(conversationFirstUnread(messages, "sam", { id: "5" })).toBeNull();
  });

  it("labels days and list times", () => {
    const now = "2026-11-19T12:00:00Z";
    expect(conversationDayLabel("2026-11-19T01:00:00Z", now, "UTC")).toBe("Today");
    expect(conversationDayLabel("2026-11-18T23:00:00Z", now, "UTC")).toBe("Yesterday");
    expect(conversationDayLabel("2026-11-10T10:00:00Z", now, "UTC")).toMatch(/Tue 10 Nov/);
    expect(conversationListTime("2026-11-19T09:41:00Z", now, "UTC")).toBe("09:41");
    expect(conversationListTime("2026-11-18T09:41:00Z", now, "UTC")).toBe("Yesterday");
    expect(conversationListTime("2026-10-01T09:41:00Z", now, "UTC")).toBe("1 Oct");
  });
});

describe("mentions", () => {
  const triggers = [{ char: "@" }, { char: "#" }, { char: "/", atLineStart: true }];

  it("finds the trigger the caret is in", () => {
    expect(findMentionTrigger("hello @le", 9, triggers)).toEqual({
      char: "@",
      query: "le",
      start: 6,
      end: 9,
    });
    expect(findMentionTrigger("see #", 5, triggers)).toMatchObject({ char: "#", query: "" });
    expect(findMentionTrigger("mail@le", 7, triggers)).toBeNull();
    expect(findMentionTrigger("@le x", 5, triggers)).toBeNull();
    expect(findMentionTrigger("a /help", 7, triggers)).toBeNull();
    expect(findMentionTrigger("a\n/help", 7, triggers)).toMatchObject({ char: "/", query: "help" });
    expect(findMentionTrigger("@[Léa](lea)", 3, triggers)).toBeNull();
  });

  it("inserts a mention in place of what was typed and puts the caret after it", () => {
    const text = "hi @le and more";
    const trigger = findMentionTrigger(text, 6, triggers)!;
    const done = insertMention(text, trigger, { id: "lea", label: "Léa Martin" });
    expect(done.text).toBe("hi @[Léa Martin](lea) and more");
    expect(done.caret).toBe("hi @[Léa Martin](lea) ".length);
  });

  it("inserts a command's own text, and reads mentions back", () => {
    const trigger = { char: "/", start: 0, end: 4 };
    expect(
      insertMention("/giv", trigger, { id: "give", label: "Give", insert: "/give " }).text,
    ).toBe("/give ");
    expect(parseMentions("a @[Léa](lea) b #[OPS-40](ops40)")).toMatchObject([
      { char: "@", label: "Léa", id: "lea" },
      { char: "#", label: "OPS-40", id: "ops40" },
    ]);
  });

  it("filters accent-blind, starts first", () => {
    const options: MentionOption[] = [
      { id: "1", label: "Marie Léa" },
      { id: "2", label: "Léa Martin", hint: "lea@x.io" },
      { id: "3", label: "Karim", hint: "lea-team" },
    ];
    expect(filterMentionOptions(options, "lea").map((o) => o.id)).toEqual(["2", "1", "3"]);
    expect(filterMentionOptions(options, "zzz")).toEqual([]);
  });
});

describe("text", () => {
  it("reads marks, links and mentions, and never HTML", () => {
    const parts = parseConversationInline(
      "**bold** and *it* with `code` see https://x.io/a. <b>no</b> @[Léa](lea)",
    );
    expect(parts.map((x) => x.kind)).toEqual([
      "bold",
      "text",
      "italic",
      "text",
      "code",
      "text",
      "link",
      "text",
      "mention",
    ]);
    expect(parts.find((x) => x.kind === "link")).toMatchObject({ href: "https://x.io/a" });
    expect(parts.some((x) => x.kind === "text" && x.text.includes("<b>no</b>"))).toBe(true);
  });

  it("toggles markers around a selection and prefixes on lines", () => {
    expect(applyConversationFormat("hello world", 6, 11, "bold")).toEqual({
      text: "hello **world**",
      start: 8,
      end: 13,
    });
    expect(applyConversationFormat("hello **world**", 8, 13, "bold").text).toBe("hello world");
    expect(applyConversationFormat("hello ", 6, 6, "code")).toEqual({
      text: "hello ``",
      start: 7,
      end: 7,
    });
    expect(applyConversationFormat("a\nb", 0, 3, "list").text).toBe("- a\n- b");
    expect(applyConversationFormat("- a\n- b", 0, 7, "list").text).toBe("a\nb");
  });
});

describe("reactions, typing, emoji, recipients, sections", () => {
  it("toggles a reaction and drops an emoji nobody uses", () => {
    const one = toggleConversationReaction([], "👍", lea);
    const two = toggleConversationReaction(one, "👍", sam);
    expect(two[0]!.users.map((u) => u.id)).toEqual(["lea", "sam"]);
    expect(
      toggleConversationReaction(toggleConversationReaction(two, "👍", lea), "👍", sam),
    ).toEqual([]);
    expect(conversationReactionLabel(two[0]!, "lea", "thumbs up")).toBe(
      "You and Sam Roche reacted with thumbs up",
    );
  });

  it("writes who is typing", () => {
    expect(conversationTypingLabel([])).toBe("");
    expect(conversationTypingLabel(["Léa"])).toBe("Léa is typing…");
    expect(conversationTypingLabel(["Léa", "Sam"])).toBe("Léa and Sam are typing…");
    expect(conversationTypingLabel(["A", "B", "C", "D"])).toBe("A, B and 2 others are typing…");
  });

  it("searches emoji by name and keyword, and keeps recents unique", () => {
    expect(searchConversationEmoji("thumb")[0]!.char).toBe("👍");
    expect(searchConversationEmoji("ship")[0]!.char).toBe("🚀");
    expect(pushRecentEmoji(["a", "b", "c"], "b", 3)).toEqual(["b", "a", "c"]);
  });

  it("reads pasted recipients: separators, names, doubles, invalid", () => {
    const parsed = parseRecipientText('a@x.io, "Léa Martin" <lea@x.io>;\nA@x.io bad b@x.io');
    expect(parsed.map((p) => [p.value, p.valid])).toEqual([
      ["a@x.io", true],
      ["lea@x.io", true],
      ["bad", false],
      ["b@x.io", true],
    ]);
    expect(parsed[1]!.name).toBe("Léa Martin");
    expect(isEmailAddress("a@b")).toBe(false);
    expect(addRecipients(["a@x.io"], ["A@x.io", "c@x.io"])).toEqual(["a@x.io", "c@x.io"]);
  });

  it("groups list items: pinned first, then sections, empty ones left out", () => {
    const items = [
      { id: "1", section: "dm" },
      { id: "2", section: "ch", pinned: true },
      { id: "3", section: "ch" },
    ];
    const groups = groupConversationItems(
      items,
      [
        { id: "ch", label: "Channels" },
        { id: "dm", label: "Direct" },
        { id: "x", label: "Empty" },
      ],
      { label: "Pinned" },
    );
    expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
      ["Pinned", ["2"]],
      ["Channels", ["3"]],
      ["Direct", ["1"]],
    ]);
  });
});

describe("MessageList", () => {
  const messages = [
    msg("1", "2026-11-18T09:00:00Z"),
    msg("2", "2026-11-18T09:01:00Z", sam, {
      edited: true,
      reactions: [{ emoji: "👍", users: [lea] }],
    }),
    msg("3", "2026-11-18T09:02:00Z", lea, { status: "failed" }),
    msg("4", "2026-11-18T09:03:00Z", sam, { deleted: true }),
    msg("5", "2026-11-19T09:00:00Z", sam, { kind: "system", body: "Sam joined" }),
    msg("6", "2026-11-19T09:05:00Z", sam, { replyCount: 3, body: "**hi** @[Léa](lea)" }),
  ];
  const render = (extra = {}) =>
    mount(
      h(MessageList, {
        messages,
        currentUserId: "lea",
        now: "2026-11-19T12:00:00Z",
        timeZone: "UTC",
        unreadFromId: "2",
        ...extra,
      }),
    );

  it("renders a log with separators, divider, states and the thread line", async () => {
    const el = await render({
      onRetry: vi.fn<(...args: unknown[]) => void>(),
      onOpenThread: vi.fn<(...args: unknown[]) => void>(),
    });
    expect(el.querySelector('[role="log"]')?.getAttribute("aria-label")).toBe("Messages");
    expect([...el.querySelectorAll('[role="separator"]')].map((s) => s.textContent)).toEqual([
      "Yesterday",
      "New messages",
      "Today",
    ]);
    expect(el.textContent).toContain("(edited)");
    expect(el.textContent).toContain("This message was deleted.");
    expect(el.textContent).toContain("Not sent.");
    expect(el.textContent).toContain("3 replies");
    expect(el.querySelector("strong")?.textContent).toBe("hi");
    expect(el.querySelector(".fg-conv-mention")?.textContent).toBe("@Léa");
  });

  it("makes one message the tab stop and moves with the arrows", async () => {
    const el = await render();
    const stops = [...el.querySelectorAll<HTMLElement>("article")].filter((a) => a.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]!.dataset.mid).toBe("6");
    await act(async () => stops[0]!.focus());
    await key(stops[0]!, "ArrowUp");
    expect((document.activeElement as HTMLElement).dataset.mid).toBe("4");
    await key(document.activeElement!, "Home");
    expect((document.activeElement as HTMLElement).dataset.mid).toBe("1");
  });

  it("calls reply on r, and retry from the failed bar", async () => {
    const onReply = vi.fn<(...args: unknown[]) => void>();
    const onRetry = vi.fn<(...args: unknown[]) => void>();
    const el = await render({ onReply, onRetry });
    const last = el.querySelector<HTMLElement>('article[data-mid="6"]')!;
    await act(async () => last.focus());
    await key(last, "r");
    expect(onReply).toHaveBeenCalledWith(expect.objectContaining({ id: "6" }));
    const retry = [...el.querySelectorAll("button")].find((b) => b.textContent === "Retry")!;
    await click(retry);
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "3" }));
  });

  it("announces a new message from someone else in a polite region", async () => {
    host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const props = { currentUserId: "lea", now: "2026-11-19T12:00:00Z", timeZone: "UTC" };
    await act(async () =>
      root.render(h(MessageList, { ...props, messages: messages.slice(0, 2) })),
    );
    await act(async () =>
      root.render(
        h(MessageList, {
          ...props,
          messages: [
            ...messages.slice(0, 2),
            msg("9", "2026-11-19T10:00:00Z", sam, { body: "Hello **there**" }),
          ],
        }),
      ),
    );
    const region = host.querySelector('[role="status"][aria-live="polite"]');
    expect(region?.textContent).toBe("Sam Roche: Hello **there**");
  });
});

describe("RichComposer", () => {
  const people: MentionOption[] = [
    { id: "lea", label: "Léa Martin" },
    { id: "sam", label: "Sam Roche" },
  ];
  const box = (el: HTMLElement) => el.querySelector("textarea")!;

  it("sends on Mod+Enter, with mentions, and empties its own draft", async () => {
    const onSend = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(RichComposer, { onSend, defaultValue: "hi @[Léa Martin](lea)" }));
    await key(box(el), "Enter", { ctrlKey: true });
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "hi @[Léa Martin](lea)",
        mentions: [expect.objectContaining({ id: "lea" })],
      }),
    );
    expect(box(el).value).toBe("");
  });

  it("sends on Enter only when asked, and keeps Shift+Enter for a new line", async () => {
    const onSend = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(RichComposer, { onSend, defaultValue: "go", sendOn: "enter" }));
    await key(box(el), "Enter", { shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    await key(box(el), "Enter");
    expect(onSend).toHaveBeenCalledOnce();
  });

  it("does not send an empty draft or when read only", async () => {
    const onSend = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(RichComposer, { onSend, readOnly: true, defaultValue: "x" }));
    await key(box(el), "Enter", { ctrlKey: true });
    expect(onSend).not.toHaveBeenCalled();
    expect(box(el).readOnly).toBe(true);
  });

  it("opens the picker on @, chooses with Enter and inserts the mention", async () => {
    const onTrigger = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(RichComposer, {
        onSend: vi.fn<(...args: unknown[]) => void>(),
        onTrigger,
        triggers: [{ char: "@", label: "People", options: people }],
      }),
    );
    const area = box(el);
    await act(async () => area.focus());
    await type(area, "hi @sa");
    expect(el.querySelector('[role="listbox"]')?.getAttribute("aria-label")).toBe("People");
    expect(el.querySelectorAll('[role="option"]')).toHaveLength(1);
    expect(onTrigger).toHaveBeenLastCalledWith({ char: "@", query: "sa" });
    await key(area, "Enter");
    expect(area.value).toBe("hi @[Sam Roche](sam) ");
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it("applies bold on Mod+B and previews the markdown", async () => {
    const el = await mount(
      h(RichComposer, { onSend: vi.fn<(...args: unknown[]) => void>(), defaultValue: "word" }),
    );
    const area = box(el);
    await act(async () => {
      area.focus();
      area.setSelectionRange(0, 4);
    });
    await key(area, "b", { ctrlKey: true });
    expect(area.value).toBe("**word**");
    const preview = el.querySelector<HTMLButtonElement>('button[aria-label="Preview"]')!;
    await click(preview);
    expect(el.querySelector(".fg-conv-preview strong")?.textContent).toBe("word");
  });

  it("shows the reply bar and cancels it with Escape", async () => {
    const onCancelReply = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(RichComposer, {
        onSend: vi.fn<(...args: unknown[]) => void>(),
        replyTo: { id: "1", author: "Léa", text: "hi" },
        onCancelReply,
      }),
    );
    expect(el.textContent).toContain("Replying to");
    await key(box(el), "Escape");
    expect(onCancelReply).toHaveBeenCalled();
  });
});

describe("pickers and small blocks", () => {
  it("EmojiPicker searches and calls back with the character", async () => {
    const onSelect = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(EmojiPicker, { onSelect }));
    await type(el.querySelector("input")!, "rocket");
    const cells = el.querySelectorAll<HTMLElement>("[data-emoji]");
    expect(cells).toHaveLength(1);
    await click(cells[0]!);
    expect(onSelect).toHaveBeenCalledWith("🚀");
  });

  it("EmojiPicker moves with the arrows over a roving tab stop", async () => {
    const el = await mount(
      h(EmojiPicker, { onSelect: vi.fn<(...args: unknown[]) => void>(), columns: 4 }),
    );
    const cells = () => [...el.querySelectorAll<HTMLElement>("[data-emoji]")];
    expect(cells().filter((c) => c.tabIndex === 0)).toHaveLength(1);
    await act(async () => cells()[0]!.focus());
    await key(cells()[0]!, "ArrowRight");
    expect(document.activeElement).toBe(cells()[1]);
    await key(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(cells()[5]);
  });

  it("ReactionBar presses a chip, marks yours and says who", async () => {
    const onToggle = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(ReactionBar, {
        currentUserId: "lea",
        onToggle,
        reactions: [{ emoji: "👍", users: [lea, sam] }],
      }),
    );
    const chip = el.querySelector<HTMLButtonElement>("button.fg-conv-reaction")!;
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(chip.getAttribute("aria-label")).toBe("You and Sam Roche reacted with thumbs up, 2");
    await click(chip);
    expect(onToggle).toHaveBeenCalledWith("👍");
  });

  it("PresenceDot and TypingIndicator say their state in words", async () => {
    const el = await mount(
      h(
        "div",
        null,
        h(PresenceDot, { status: "away" }),
        h(TypingIndicator, { names: ["Léa", "Sam"] }),
      ),
    );
    expect(el.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("Away");
    expect(el.querySelector('[role="status"]')?.textContent).toBe("Léa and Sam are typing…");
  });

  it("AttachmentList shows size, progress and calls remove and retry", async () => {
    const onRemove = vi.fn<(...args: unknown[]) => void>();
    const onRetry = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(AttachmentList, {
        onRemove,
        onRetry,
        items: [
          { id: "a", name: "plan.pdf", size: 2_400_000, url: "/plan.pdf" },
          { id: "b", name: "photo.png", progress: 0.4, size: 1000 },
          { id: "c", name: "big.zip", error: "too large" },
        ],
      }),
    );
    expect(el.textContent).toContain("2.3 MB");
    expect(el.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("40");
    expect(el.querySelector("a")?.getAttribute("download")).toBe("plan.pdf");
    await click(el.querySelector('button[aria-label="Retry big.zip"]')!);
    await click(el.querySelector('button[aria-label="Remove plan.pdf"]')!);
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });
});

describe("ConversationList", () => {
  const items = [
    { id: "a", title: "Design", unread: 3, section: "ch", at: "2026-11-19T09:00:00Z" },
    { id: "b", title: "Léa", unread: 120, mention: true, pinned: true, at: "2026-11-18T09:00:00Z" },
    { id: "c", title: "Ops", muted: true, typing: true, section: "ch" },
  ];
  const render = (onSelect = vi.fn<(...args: unknown[]) => void>()) =>
    mount(
      h(ConversationList, {
        items,
        onSelect,
        sections: [{ id: "ch", label: "Channels" }],
        now: "2026-11-19T12:00:00Z",
        timeZone: "UTC",
      }),
    );

  it("puts the pinned section first, writes counts and typing", async () => {
    const el = await render();
    const rows = [...el.querySelectorAll('[role="option"]')].map((r) => r.textContent);
    expect(rows[0]).toContain("Léa");
    expect(rows[0]).toContain("99+");
    expect(rows[0]).toContain("Yesterday");
    expect(rows[2]).toContain("typing…");
    expect(
      [...el.querySelectorAll('[role="group"]')].map((g) => g.getAttribute("aria-label")),
    ).toEqual(["Pinned", "Channels"]);
  });

  it("moves the active row with the arrows and selects on Enter", async () => {
    const onSelect = vi.fn<(...args: unknown[]) => void>();
    const el = await render(onSelect);
    const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
    const ids = [...el.querySelectorAll('[role="option"]')].map((o) => o.id);
    expect(list.getAttribute("aria-activedescendant")).toBe(ids[0]);
    await key(list, "ArrowDown");
    expect(list.getAttribute("aria-activedescendant")).toBe(ids[1]);
    await key(list, "Enter");
    expect(onSelect).toHaveBeenCalledWith("a");
  });
});

describe("RecipientInput", () => {
  const contacts = [
    { id: "1", name: "Léa Martin", email: "lea@x.io" },
    { id: "2", name: "Design team", members: ["a@x.io", "b@x.io"] },
  ];
  const input = (el: HTMLElement) => el.querySelector<HTMLInputElement>("input")!;
  const chips = (el: HTMLElement) =>
    [...el.querySelectorAll(".fg-combo-chip")].map((c) => c.textContent);

  it("suggests contacts and adds the one chosen", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(RecipientInput, { label: "To", contacts, onChange }));
    await type(input(el), "lé".replace("é", "e"));
    expect(el.querySelectorAll('[role="option"]')).toHaveLength(1);
    await key(input(el), "Enter");
    expect(onChange).toHaveBeenLastCalledWith(["lea@x.io"]);
  });

  it("expands a group into its members", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(RecipientInput, { label: "To", contacts, onChange }));
    await type(input(el), "design");
    await key(input(el), "Enter");
    expect(onChange).toHaveBeenLastCalledWith(["a@x.io", "b@x.io"]);
  });

  it("commits a typed address on comma, marks an invalid one", async () => {
    const el = await mount(h(RecipientInput, { label: "To", defaultValue: ["not-an-email"] }));
    expect(el.querySelector(".fg-combo-chip-bad")?.textContent).toContain("not-an-email");
    await type(input(el), "me@x.io");
    await key(input(el), ",");
    expect(chips(el)).toHaveLength(2);
  });

  it("takes a paste of many addresses at once", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(RecipientInput, { label: "To", onChange }));
    const event = new Event("paste", { bubbles: true, cancelable: true }) as Event & {
      clipboardData: { getData: () => string };
    };
    event.clipboardData = { getData: () => "a@x.io, Bob <b@x.io>\nc@x.io a@x.io" };
    await act(async () => {
      input(el).dispatchEvent(event);
    });
    expect(onChange).toHaveBeenLastCalledWith(["a@x.io", "b@x.io", "c@x.io"]);
  });
});

describe("ThreadPanel", () => {
  it("shows the root, the replies and the composer, and closes on Escape", async () => {
    const onClose = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(ThreadPanel, {
        root: msg("r", "2026-11-19T09:00:00Z", sam, { body: "Root text" }),
        replies: [msg("a", "2026-11-19T09:05:00Z"), msg("b", "2026-11-19T09:06:00Z", sam)],
        currentUserId: "lea",
        onClose,
        onSend: vi.fn<(...args: unknown[]) => void>(),
        list: { now: "2026-11-19T12:00:00Z" },
      }),
    );
    expect(el.querySelector("aside h2")?.textContent).toBe("Thread");
    expect(el.textContent).toContain("2 replies");
    expect(el.textContent).toContain("Root text");
    expect(el.querySelector('[role="log"]')?.getAttribute("aria-label")).toBe(
      "Replies to Sam Roche",
    );
    expect(el.querySelector("textarea")).not.toBeNull();
    await key(el.querySelector("aside")!, "Escape");
    expect(onClose).toHaveBeenCalled();
  });
});
