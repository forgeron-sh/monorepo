// Blocks of the "finance" group: money documents and their parts. App-agnostic: invoices, quotes,
// orders, expenses and purchase requests are built from the same lines, totals, receipts, ledgers
// and sheets. Each block lives in its own file next to this one; this barrel re-exports them.

export {
  allocate,
  buildStatement,
  clampFieldBox,
  computeTotals,
  confidenceLevel,
  csvField,
  isBlankLine,
  lineAmounts,
  moveLine,
  newLine,
  parseMinor,
  percentOf,
  roundMinor,
  sectionSubtotals,
  signText,
  statementToCsv,
  timesMinor,
  toMinor,
} from "./finance-model";
export type {
  FieldBox,
  LineAmounts,
  LineItem,
  Minor,
  StatementEntry,
  StatementOptions,
  StatementRow,
  TaxLine,
  Totals,
  TotalsOptions,
} from "./finance-model";
export { AmountBadge, StatusBadge } from "./finance-parts";
export type { AmountBadgeProps, FinanceStatus, StatusBadgeProps } from "./finance-parts";
export { ProductPicker } from "./finance-product-picker";
export type { ProductOption, ProductPickerProps } from "./finance-product-picker";
export { LineItemsEditor } from "./finance-line-items";
export type { LineItemsEditorProps } from "./finance-line-items";
export { TotalsSummary } from "./finance-totals";
export type { TotalsLabels, TotalsSummaryProps } from "./finance-totals";
export { ReceiptViewer } from "./finance-receipt-viewer";
export type { ReceiptField, ReceiptPage, ReceiptViewerProps } from "./finance-receipt-viewer";
export {
  CARD_BRANDS,
  TEST_CARDS,
  TEST_IBANS,
  cardBrand,
  cardDigits,
  cardMaxLength,
  cvcValid,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  formatIban,
  ibanValid,
  last4,
  luhnValid,
  maskIban,
  normalizeIban,
  parseExpiry,
  validateBank,
  validateCard,
} from "./finance-payment-model";
export type {
  BankErrors,
  BankValues,
  CardBrand,
  CardErrors,
  CardValues,
} from "./finance-payment-model";
export { PaymentForm } from "./finance-payment-form";
export type { PaymentFormProps, PaymentMethod, PaymentSubmit } from "./finance-payment-form";
export { StatementTable } from "./finance-statement-table";
export type { StatementTableProps } from "./finance-statement-table";
export {
  DocumentHeader,
  MetaTable,
  PAPER_SIZES,
  PageBreak,
  Paper,
  PartyBlock,
  paperSize,
  printPaper,
} from "./finance-paper";
export type {
  DocumentHeaderProps,
  MetaTableProps,
  PaperProps,
  PaperSize,
  PartyBlockProps,
} from "./finance-paper";
