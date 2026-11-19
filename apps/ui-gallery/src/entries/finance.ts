import type { Atom } from "../types";

const money = [
  {
    name: "currency",
    type: "string",
    description: "An ISO 4217 code (`EUR`, `USD`, `JPY`): every amount is in its minor units.",
  },
  {
    name: "locale",
    type: "string",
    description: "A BCP 47 tag for the numbers and the symbol; the device's by default.",
  },
] as const;
const className = { name: "className", type: "string", description: "Extra classes." } as const;

/** Gallery pages of the "finance" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "line-items-editor",
    name: "Line items editor",
    summary:
      "The lines of an invoice, quote, order or expense report as a sheet, with totals worked out.",
    imports: ["LineItemsEditor", "computeTotals", "newLine", "moveLine"],
    props: [
      { name: "label", type: "string", default: `"Line items"`, description: "Names the sheet." },
      {
        name: "value / defaultValue",
        type: "LineItem[]",
        description:
          "{ id, kind?: 'item' | 'section', description, quantity?, unit?, unitPrice? (minor units), taxRate? (%), discount? (%), productId? }. Controlled or not.",
      },
      { name: "onChange", type: "(lines: LineItem[]) => void", description: "After every change." },
      ...money,
      {
        name: "products",
        type: "ProductOption[]",
        description:
          "{ id, label, hint?, unitPrice?, taxRate?, unit? }. A button in each description searches them and fills the line.",
      },
      {
        name: "taxRates",
        type: "number[]",
        description: "The rates suggested while typing a tax cell.",
      },
      {
        name: "defaultTaxRate",
        type: "number",
        description: "The rate a new line starts with.",
      },
      {
        name: "showTax / showDiscount",
        type: "boolean",
        default: "true",
        description: "The tax and discount columns.",
      },
      {
        name: "sections",
        type: "boolean",
        default: "true",
        description: "Adds Add section: a heading row with its subtotal.",
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Text only, no controls: the table of a printed document.",
      },
      { name: "disabled", type: "boolean", default: "false", description: "Locks the cells." },
      {
        name: "addLabel / addSectionLabel / empty",
        type: "string / ReactNode",
        description: "The words of the buttons and of the empty sheet.",
      },
      className,
    ],
  },
  {
    slug: "totals-summary",
    name: "Totals summary",
    summary: "Subtotal, discounts, tax by rate, total, amount paid and balance due.",
    imports: ["TotalsSummary", "computeTotals"],
    props: [
      {
        name: "totals",
        type: "Totals",
        description: "From `computeTotals(lines, options)`. Without it, `lines` are totalled here.",
      },
      {
        name: "lines",
        type: "LineItem[]",
        description: "Used when `totals` is not given.",
      },
      {
        name: "taxMode",
        type: `"rate" | "line"`,
        default: `"rate"`,
        description:
          "Tax worked out once per rate on the sum of its lines, or per line then added.",
      },
      {
        name: "pricesIncludeTax",
        type: "boolean",
        default: "false",
        description:
          "The unit prices contain the tax: it is the part of the total, not an addition.",
      },
      {
        name: "discount",
        type: "{ percent?, amount? }",
        description:
          "A discount on the whole document, shared between the lines so the tax stays right.",
      },
      { name: "paid", type: "number", description: "Already paid, in minor units." },
      ...money,
      {
        name: "labels",
        type: "Partial<TotalsLabels>",
        description: "The words of the rows: subtotal, discounts, net, tax, total, paid, due.",
      },
      { name: "taxLabel", type: "(rate) => string", description: "The name of a tax line." },
      {
        name: "alwaysShowDue",
        type: "boolean",
        default: "false",
        description: "Writes paid and due even at zero.",
      },
      { name: "footer", type: "ReactNode", description: "Under the rows: a note, a pay button." },
      className,
    ],
  },
  {
    slug: "receipt-viewer",
    name: "Receipt viewer",
    summary:
      "A scanned page with its recognised fields as boxes, linked to a list you can correct.",
    imports: ["ReceiptViewer", "confidenceLevel"],
    props: [
      {
        name: "pages",
        type: "{ src, alt?, aspect? }[]",
        description:
          "Images: a photo, or a PDF page the caller rendered. Pages are flipped with buttons.",
      },
      {
        name: "fields",
        type: "ReceiptField[]",
        description:
          "{ id, label, value, confidence? (0-1), box? { x, y, w, h } as fractions of the page, page?, verified? }.",
      },
      {
        name: "onFieldChange",
        type: "(id, value) => void",
        description: "Turns correction on: an Edit button per row, Enter or F2 on it.",
      },
      {
        name: "active / defaultActive",
        type: "string | null",
        description: "The selected field. Controlled or not, with onActiveChange.",
      },
      { name: "defaultZoom", type: "number", default: "1", description: "1 fits the width." },
      className,
    ],
  },
  {
    slug: "payment-form",
    name: "Payment form",
    summary: "Card or bank (SEPA) details, formatted and checked as typed. Test mode is announced.",
    imports: ["PaymentForm", "luhnValid", "ibanValid", "TEST_CARDS", "TEST_IBANS"],
    props: [
      {
        name: "method / defaultMethod",
        type: `"card" | "bank"`,
        default: `"card"`,
        description: "Controlled or not, with onMethodChange.",
      },
      {
        name: "methods",
        type: "PaymentMethod[]",
        description: "Which are offered; one hides the switch.",
      },
      {
        name: "testMode",
        type: "boolean",
        default: "true",
        description:
          "A Test mode banner and a button that fills a published test number. A live form is a deliberate `false`.",
      },
      {
        name: "onSubmit",
        type: "(payment) => void",
        description:
          "Once, when valid: { method, values } (card also brand and last4). The fields are cleared after. Nothing is stored or logged here.",
      },
      {
        name: "onValidityChange",
        type: "(valid: boolean) => void",
        description: "Only whether it could be sent, never a value.",
      },
      { name: "mandateText", type: "string", description: "The sentence the person accepts." },
      { name: "submitLabel", type: "string", default: `"Pay"`, description: "The button." },
      { name: "disabled", type: "boolean", description: "Locks the form." },
      className,
    ],
  },
  {
    slug: "statement-table",
    name: "Statement table",
    summary:
      "A ledger with a running balance, sections, subtotals and a total; signed amounts; CSV export.",
    imports: ["StatementTable", "buildStatement", "statementToCsv"],
    props: [
      {
        name: "entries",
        type: "StatementEntry[]",
        description:
          "{ id, date, description, reference?, amount (signed, minor units), group? }. Money in is positive.",
      },
      ...money,
      {
        name: "opening",
        type: "number",
        default: "0",
        description: "The balance before the first entry.",
      },
      {
        name: "grouped",
        type: "boolean",
        description: "Sections with a subtotal each. By default when an entry has a `group`.",
      },
      {
        name: "sort",
        type: `"date" | "none"`,
        default: `"none"`,
        description: "Orders entries by date.",
      },
      {
        name: "showBalance / showReference",
        type: "boolean",
        default: "true",
        description: "The columns.",
      },
      {
        name: "invert",
        type: "boolean",
        default: "false",
        description: "Money out is normal (expenses): swaps the colours, the signs stay.",
      },
      { name: "onOpenEntry", type: "(entry) => void", description: "Rows become buttons." },
      {
        name: "onExport",
        type: "({ rows, csv }) => void",
        description: "Adds an Export button. Saving the file is yours.",
      },
      {
        name: "totalLabel / openingLabel / subtotalLabel",
        type: "string",
        description: "The words of the rows.",
      },
      className,
    ],
  },
  {
    slug: "paper",
    name: "Paper",
    summary: "A printable A4 or Letter sheet: margins, repeated header and footer, page breaks.",
    imports: ["Paper", "PageBreak", "printPaper", "paperSize"],
    props: [
      {
        name: "size",
        type: `"A4" | "Letter"`,
        default: `"A4"`,
        description: "Millimetres, as printed.",
      },
      { name: "landscape", type: "boolean", default: "false", description: "Turns the sheet." },
      {
        name: "margin",
        type: "string",
        default: `"18mm"`,
        description: "A CSS length; also the @page margin.",
      },
      {
        name: "header / footer",
        type: "ReactNode",
        description: "Repeated on every printed page.",
      },
      {
        name: "zoom",
        type: `"fit" | number`,
        default: `"fit"`,
        description: "On screen only: the sheet shrinks to its container. Printing is 1.",
      },
      { name: "guides", type: "boolean", default: "true", description: "Lines where a page ends." },
      {
        name: "pageRule",
        type: "boolean",
        default: "true",
        description: "Writes `@page` for the size. One Paper per printed document.",
      },
      {
        name: "printPaper(element, title?)",
        type: "function",
        description:
          "Prints one element alone through a hidden frame that copies the page's styles.",
      },
      className,
    ],
  },
  {
    slug: "document-header",
    name: "Document header and parties",
    summary: "The parts of a business document: title block, from and to, details table.",
    imports: ["DocumentHeader", "PartyBlock", "MetaTable"],
    props: [
      {
        name: "DocumentHeader title / number / status / brand",
        type: "ReactNode",
        description: "The mark of the sender one side, the title and number the other.",
      },
      {
        name: "PartyBlock label / name / lines",
        type: "string / ReactNode / ReactNode[]",
        description: "Who it is from, who it is for: the address lines.",
      },
      {
        name: "MetaTable rows",
        type: "{ label, value }[]",
        description: "Issue date, due date, reference, terms.",
      },
    ],
  },
  {
    slug: "amount-badge",
    name: "Amount and status badge",
    summary: "A signed amount, sign in text and tone in colour; the state of a document in a word.",
    imports: ["AmountBadge", "StatusBadge"],
    props: [
      { name: "amount", type: "number", description: "Minor units, signed." },
      ...money,
      {
        name: "tone",
        type: `"auto" | "positive" | "negative" | "neutral"`,
        default: `"auto"`,
        description: "Auto: money in is positive, out negative.",
      },
      { name: "invert", type: "boolean", default: "false", description: "Swaps the auto colours." },
      {
        name: "showPlus",
        type: "boolean",
        default: "true",
        description: "Writes + before a positive amount.",
      },
      {
        name: "StatusBadge status / tone / label",
        type: "string",
        description: "draft, sent, paid, overdue… map to a tone; any word with its tone.",
      },
      className,
    ],
  },
];
