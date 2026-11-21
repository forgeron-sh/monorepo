import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const controlled = (name: string, type: string, description: string): PropRow => ({
  name: `${name} / default${name[0]!.toUpperCase()}${name.slice(1)}`,
  type,
  description: `${description} Controlled or not.`,
});
const readOnly: PropRow = {
  name: "readOnly",
  type: "boolean",
  description: "Shows without editing: a run, a published version.",
};
const variables: PropRow = {
  name: "variables",
  type: "{ id, label, icon?, fields: { path, hint? }[] }[]",
  description:
    "The outputs of the previous steps, nearest first. variablesFromSample(id, label, sample) builds one from a test output.",
};

/** Gallery entries of components moved from the blocks into the primitives (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "duration-input",
    name: "Duration input",
    summary:
      "Hours and minutes (75 minutes becomes 1 h 15) and the usual lengths as one-click presets. Composed from parts, with a props shorthand.",
    imports: [
      "DurationInput",
      "DurationInputRow",
      "DurationInputHours",
      "DurationInputMinutes",
      "DurationInputPresets",
      "DurationInputPreset",
      "formatMinutes",
      "parseMinutes",
    ],
    props: [
      { name: "label", type: "string", description: "Names the field." },
      controlled("value", "number | null", "Minutes."),
      {
        name: "onChange",
        type: "(minutes: number | null) => void",
        description: "On every edit or preset.",
      },
      {
        name: "presets",
        type: "number[]",
        default: "[15, 30, 45, 60, 90, 120]",
        description: "The buttons; [] for none.",
      },
      {
        name: "min / max / step",
        type: "number",
        default: "0 / 1440 / 5",
        description: "Limits in minutes, and the step of the arrows on the minutes.",
      },
      { name: "disabled", type: "boolean", description: "Read only." },
      {
        name: "Duration parts",
        type: "DurationInput (no label), DurationInputRow, DurationInputHours, DurationInputMinutes, DurationInputPresets, DurationInputPreset minutes",
        description:
          "DurationInput with a label is built from them; compose your own as shadcn would (D-157). Root: value / defaultValue / onValueChange, min, max, step, disabled.",
      },
      className,
    ],
  },
  {
    slug: "timezone-picker",
    name: "Timezone picker",
    summary: "A time zone found by typing, each row with its offset and the time there.",
    imports: [
      "TimezonePicker",
      "TimezonePickerInput",
      "TimezonePickerContent",
      "TimezonePickerItem",
      "deviceTimezone",
      "convertTime",
      "timezoneOffset",
    ],
    props: [
      {
        name: "Timezone parts",
        type: "TimezonePicker (no label; value / defaultValue / onChange, timezones, now, hour12, disabled), TimezonePickerInput, TimezonePickerContent emptyText, TimezonePickerItem zone",
        description:
          "TimezonePicker with a label is built on the Combobox; the parts are the same over the Combobox parts.",
      },
      { name: "label", type: "string", description: "Names the field." },
      controlled("value", "string | null", "An IANA zone, e.g. Europe/Paris."),
      {
        name: "onChange",
        type: "(zone: string | null) => void",
        description: "When a zone is chosen.",
      },
      {
        name: "timezones",
        type: "string[]",
        default: "every zone the runtime knows",
        description: "The zones offered.",
      },
      {
        name: "now",
        type: "number",
        default: "when it appeared",
        description: "UTC milliseconds the offsets and clocks are read at.",
      },
      {
        name: "hour12 / clearable / disabled",
        type: "boolean",
        description: "AM and PM, a button to remove the choice, read only.",
      },
      className,
    ],
  },
  {
    slug: "address-field",
    name: "Address field",
    summary:
      "A postal address: two lines, postcode, city, country. Typed, with the browser's autocomplete, no lookup and no network. Composed from parts, with a props shorthand.",
    imports: ["AddressField", "AddressFieldPart"],
    props: [
      {
        name: "label",
        type: "string",
        description: "Names the group for assistive technology: the question.",
      },
      {
        name: "value / defaultValue",
        type: "{ line1?, line2?, postcode?, city?, country? }",
        description: "The address. Controlled or not.",
      },
      { name: "onChange", type: "(address) => void", description: "After every keystroke." },
      {
        name: "countries",
        type: "{ value, label }[]",
        description: "A searchable list for the country; absent, it is typed.",
      },
      {
        name: "errors",
        type: "Partial<Record<part, string>>",
        description: "What is wrong, by part.",
      },
      {
        name: "required",
        type: "boolean",
        description: "Marks the second line as optional; the rest is expected.",
      },
      { name: "disabled", type: "boolean", description: "Locks the fields." },
      {
        name: "Address parts",
        type: "AddressField (no label), AddressFieldPart name",
        description:
          "Place each field yourself, in any order; AddressField with a label draws the five (D-157). Root: value / defaultValue / onValueChange, countries, errors, required.",
      },
      className,
    ],
  },
  {
    slug: "secret-field",
    name: "Secret field",
    summary:
      "A hidden value: fixed-length mask, reveal for a few seconds, copy, replace, remove; set or not set. Composed from parts, with a props shorthand.",
    imports: [
      "SecretField",
      "SecretFieldHeader",
      "SecretFieldHint",
      "SecretFieldBody",
      "SecretFieldConfirm",
      "SecretFieldValue",
      "SecretFieldActions",
      "SecretFieldForm",
      "SECRET_MASK",
      "SECRET_REVEAL_MS",
      "secretProblem",
    ],
    props: [
      { name: "label", type: "string", description: "Names the secret." },
      { name: "isSet", type: "boolean", description: "Not set shows a badge and Set value." },
      {
        name: "getValue / value",
        type: "() => string | Promise<string>; string",
        description:
          "Where the value comes from, read only on Reveal or Copy. Hidden, it is never in the page.",
      },
      {
        name: "revealTimeout",
        type: "number",
        default: "15000",
        description:
          "Milliseconds on screen; 0 keeps it until hidden. It also hides when the tab is left.",
      },
      { name: "rotatedAt / today", type: "string", description: "“Changed 3 days ago”." },
      {
        name: "onReplace",
        type: "(value) => void | Promise<void>",
        description: "The new value goes out and is not kept.",
      },
      { name: "onRemove / onCopy", type: "() => void", description: "Remove asks a second time." },
      {
        name: "Secret parts",
        type: "SecretField (children), SecretFieldHeader, SecretFieldHint, SecretFieldBody, SecretFieldValue, SecretFieldActions, SecretFieldForm, SecretFieldConfirm",
        description: "The default field is made of them; give children to place your own (D-157).",
      },
      className,
    ],
  },
  {
    slug: "expression-input",
    name: "Expression input",
    summary:
      "Text that takes {{ references }} to earlier steps: picked as they are typed, shown as chips. Composed from parts, with a props shorthand.",
    imports: [
      "ExpressionInput",
      "ExpressionInputBox",
      "ExpressionInputField",
      "ExpressionInputTrigger",
      "ExpressionInputList",
      "ExpressionInputPreview",
      "variablesFromSample",
    ],
    props: [
      {
        name: "value / defaultValue / onChange",
        type: "string",
        description: "The text, references included.",
      },
      variables,
      { name: "multiline / rows", type: "boolean / number", description: "A textarea." },
      {
        name: "sample",
        type: "unknown",
        description: "Data of a test run: the line under the field says what the text becomes.",
      },
      { name: "id, aria-*", type: "string", description: "From Field, to tie it to its label." },
      { name: "placeholder / disabled", type: "…", description: "As on an input." },
      {
        name: "Expression parts",
        type: "ExpressionInput (children), ExpressionInputBox, ExpressionInputField, ExpressionInputTrigger, ExpressionInputList, ExpressionInputPreview",
        description: "The default field is made of them; give children to place your own (D-157).",
      },
      className,
    ],
  },
  {
    slug: "condition-builder",
    name: "Condition builder",
    summary:
      "Field, operator and value rows joined by and / or, with groups; said in one line. Composed from parts, with a props shorthand.",
    imports: [
      "ConditionBuilder",
      "ConditionBuilderGroup",
      "ConditionBuilderRule",
      "emptyCondition",
      "describeCondition",
      "evaluateCondition",
    ],
    props: [
      {
        name: "value / defaultValue / onChange",
        type: "{ id, combinator, rules: (Rule | Group)[] }",
        description: "A rule is { id, field, operator, value? }.",
      },
      {
        name: "fields",
        type: "{ id, label, type, options?, icon? }[]",
        description:
          "type: text, number, date, boolean, enum. The operators and the value follow it.",
      },
      { ...variables, description: "Given, text and number values take {{ references }}." },
      {
        name: "maxDepth",
        type: "number",
        default: "2",
        description: "How deep groups go; 1: no group.",
      },
      readOnly,
      {
        name: "Condition parts",
        type: "ConditionBuilder (children), ConditionBuilderGroup group?, ConditionBuilderRule rule group",
        description:
          "The default builder is a ConditionBuilderGroup of the root; groups nest by themselves (D-157).",
      },
      className,
    ],
  },
  {
    slug: "json-view",
    name: "JSON view",
    summary:
      "Input or output data in mono, coloured by kind; scrolls, copies. Composed from parts, with a props shorthand.",
    imports: ["JsonView", "JsonViewLabel", "JsonViewContent", "JsonViewCopy", "highlightJson"],
    props: [
      { name: "value", type: "unknown", description: "Any JSON value; undefined shows empty." },
      { name: "label", type: "string", description: "Above it, and its name." },
      {
        name: "maxHeight",
        type: `number | "none"`,
        default: "320",
        description: "Then it scrolls.",
      },
      { name: "copyable", type: "boolean", default: "true", description: "The copy button." },
      {
        name: "JSON parts",
        type: "JsonView (children), JsonViewLabel, JsonViewContent maxHeight empty, JsonViewCopy",
        description: "The default view is made of them; give children to place your own (D-157).",
      },
      className,
    ],
  },
  {
    slug: "emoji-picker",
    name: "Emoji picker",
    summary:
      "Search, categories, recents and a grid moved with the arrows. Emoji are user content. Composed from parts, with a props shorthand.",
    imports: [
      "EmojiPicker",
      "EmojiPickerSearch",
      "EmojiPickerTabs",
      "EmojiPickerGrid",
      "CONVERSATION_EMOJI",
      "searchConversationEmoji",
      "pushRecentEmoji",
    ],
    props: [
      { name: "onSelect", type: "(emoji: string) => void", description: "The character chosen." },
      {
        name: "categories",
        type: "{ id, label, mark, emoji: { char, name, keywords? }[] }[]",
        description: "Your own set. The built-in one is small on purpose.",
      },
      {
        name: "recents / defaultRecents / onRecentsChange",
        type: "string[]",
        description: "Newest first; kept by the picker unless you keep them (to store them).",
      },
      {
        name: "columns / maxRecents / autoFocus / label",
        type: "number; number; boolean; string",
        description: "Layout and words.",
      },
      {
        name: "Emoji parts",
        type: "EmojiPicker (no onSelect, with onEmojiSelect), EmojiPickerSearch, EmojiPickerTabs, EmojiPickerGrid",
        description:
          "EmojiPicker with onSelect is built from them; compose your own (D-157). Root: categories, recents, columns, label.",
      },
      className,
    ],
  },
  {
    slug: "rich-composer",
    name: "Rich composer",
    summary:
      "A box to write: @ and # pickers, a slash hook, markdown keys, files, preview, a reply bar, your send key. Composed from parts, with a props shorthand.",
    imports: [
      "Composer",
      "ComposerToolbar",
      "ComposerField",
      "ComposerFiles",
      "ComposerFooter",
      "RichComposer",
      "ComposerReplyBar",
      "applyConversationFormat",
      "findMentionTrigger",
      "insertMention",
      "parseMentions",
    ],
    props: [
      {
        name: "value / defaultValue / onChange",
        type: "string",
        description: "The draft. Uncontrolled, it empties once sent.",
      },
      {
        name: "onSend",
        type: "({ text, attachments, mentions, replyToId }) => void",
        description: "On the button and the send key. Mentions are written @[Label](id) in text.",
      },
      {
        name: "sendOn",
        type: '"mod-enter" | "enter"',
        default: '"mod-enter"',
        description: "⌘↵ sends and Enter is a line; or Enter sends and ⇧↵ is a line.",
      },
      {
        name: "triggers",
        type: "{ char, label, options, atLineStart?, filter?, loading?, limit?, empty? }[]",
        description:
          "The pickers: @ for people, # for records, / (atLineStart) for commands. An option is { id, label, hint?, avatar?, insert? }; insert replaces the token (a command's text).",
      },
      {
        name: "onTrigger",
        type: "({ char, query } | null) => void",
        description:
          "The slash hook, and the way to load options from a server (set filter: false, loading, and pass the answer as options).",
      },
      {
        name: "replyTo / onCancelReply",
        type: "{ id, author, text } | null; () => void",
        description: "A bar above the box; Escape cancels it.",
      },
      {
        name: "attachments / onAttachmentsChange / attachmentOptions",
        type: "File[]; (files) => void; false | { accept, maxSize, maxFiles, onReject }",
        description: "Files go through FileInput behind the paperclip.",
      },
      {
        name: "toolbar / maxRows / label / placeholder / sendLabel / onTyping",
        type: "boolean; number; string; string; string; () => void",
        description: "Bold (⌘B), italic (⌘I), code (⌘E), list (⌘⇧L), preview; grows to maxRows.",
      },
      {
        name: "disabled / readOnly / readOnlyText",
        type: "boolean; boolean; ReactNode",
        description: "Locked states.",
      },
      {
        name: "Composer parts",
        type: "Composer (children), ComposerReplyBar, ComposerToolbar, ComposerField, ComposerFiles, ComposerFooter",
        description: "RichComposer is Composer drawing all of them; same props (D-157).",
      },
      className,
    ],
  },
  {
    slug: "drop-zone",
    name: "Drop zone",
    summary:
      "Where files land: a framed area with its button, or an overlay over a whole view. Composed from parts, with a props shorthand.",
    imports: [
      "DropZone",
      "DropZoneIcon",
      "DropZoneTitle",
      "DropZoneDescription",
      "DropZoneTrigger",
      "DropZoneOverlay",
      "acceptsFile",
    ],
    props: [
      { name: "onFiles", type: "(files: File[]) => void", description: "The files that match." },
      { name: "onReject", type: "(files: File[]) => void", description: "The ones left out." },
      { name: "accept", type: "string", description: "As on an input: .pdf,image/*." },
      { name: "multiple", type: "boolean", default: "true", description: "Several files." },
      {
        name: "title / description / buttonLabel",
        type: "ReactNode; ReactNode; string",
        default: `"Drop files here"; —; "Choose files"`,
        description: "The words of the framed zone.",
      },
      {
        name: "children / overlayLabel",
        type: "ReactNode",
        description:
          "A view to cover: invisible until files are dragged over, then the hatched overlay.",
      },
      { name: "disabled", type: "boolean", description: "No drop, no chooser." },
      {
        name: "DropZone parts",
        type: "DropZone (no onFiles: onDropFiles, variant), DropZoneIcon, DropZoneTitle, DropZoneDescription, DropZoneTrigger, DropZoneOverlay",
        description:
          "DropZone with onFiles is built from them; useDropZone() gives { active, disabled, open } (D-157).",
      },
      className,
    ],
  },
  {
    slug: "signature-pad",
    name: "Signature pad",
    summary:
      "Draw, type or upload a signature; a PNG data URL out. A pen for the keyboard. Composed from parts, with a props shorthand.",
    imports: [
      "SignaturePad",
      "SignaturePadModes",
      "SignaturePadDraw",
      "SignaturePadType",
      "SignaturePadPreview",
      "SignaturePadUpload",
      "signatureBlob",
      "SIGNATURE_FONTS",
    ],
    props: [
      {
        name: "value / defaultValue / onChange",
        type: "{ dataUrl, method, text?, font? } | null",
        description: "The signature: PNG data URL (SVG without a canvas). null when cleared.",
      },
      {
        name: "modes / mode / onModeChange",
        type: `("draw" | "type" | "upload")[]`,
        default: "all three",
        description: "The ways to sign, in order.",
      },
      {
        name: "fonts",
        type: "{ id, label, family, italic? }[]",
        default: "SIGNATURE_FONTS",
        description: "The fonts of the Type tab (system fonts).",
      },
      {
        name: "ink",
        type: "string",
        description: "Colour of the exported image; dark by default, whatever the theme.",
      },
      {
        name: "maxUploadSize",
        type: "number",
        default: "2 MB",
        description: "Biggest image on the Upload tab, in bytes.",
      },
      {
        name: "label / defaultText / disabled",
        type: "string; string; boolean",
        description: "Name, first typed name, off.",
      },
      {
        name: "Signature parts",
        type: "SignaturePad (children), SignaturePadModes, SignaturePadDraw, SignaturePadType, SignaturePadUpload, SignaturePadPreview",
        description: "Without children, the pad draws all of them in this order (D-157).",
      },
      className,
    ],
  },
];
