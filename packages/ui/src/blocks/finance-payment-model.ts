// Checks and formatting for payment details, pure functions of what is typed. Nothing here stores,
// sends or logs a value. Everything the examples and tests use is a published test number: the
// card numbers of payment providers' test modes and the example IBANs of the standard.

/* ---------------------------------------------------------------- cards */

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "diners" | "jcb" | "unknown";

export const CARD_BRANDS: Record<CardBrand, { name: string; cvc: number; lengths: number[] }> = {
  visa: { name: "Visa", cvc: 3, lengths: [13, 16, 19] },
  mastercard: { name: "Mastercard", cvc: 3, lengths: [16] },
  amex: { name: "American Express", cvc: 4, lengths: [15] },
  discover: { name: "Discover", cvc: 3, lengths: [16, 19] },
  diners: { name: "Diners Club", cvc: 3, lengths: [14, 16] },
  jcb: { name: "JCB", cvc: 3, lengths: [16, 19] },
  unknown: { name: "Card", cvc: 3, lengths: [12, 13, 14, 15, 16, 17, 18, 19] },
};

/**
 * Card numbers published by payment providers for their test modes: they pass the Luhn check and
 * charge nobody. The only card numbers the examples and tests of this package use.
 */
export const TEST_CARDS: ReadonlyArray<{ label: string; number: string; brand: CardBrand }> = [
  { label: "Visa", number: "4242424242424242", brand: "visa" },
  { label: "Mastercard", number: "5555555555554444", brand: "mastercard" },
  { label: "American Express", number: "378282246310005", brand: "amex" },
];

/** The example IBANs of the standard and of providers' test modes: valid in form, owned by nobody. */
export const TEST_IBANS: ReadonlyArray<{ label: string; iban: string }> = [
  { label: "Germany", iban: "DE89370400440532013000" },
  { label: "United Kingdom", iban: "GB82WEST12345698765432" },
  { label: "France", iban: "FR1420041010050500013M02606" },
];

/** Only the digits of a card number, at most 19. */
export const cardDigits = (input: string) => input.replace(/\D/g, "").slice(0, 19);

/** The Luhn check: does the checksum of the digits end in zero? */
export function luhnValid(input: string): boolean {
  const digits = input.replace(/[\s-]/g, "");
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** The brand a number belongs to, from its first digits (known as soon as it begins). */
export function cardBrand(input: string): CardBrand {
  const n = cardDigits(input);
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(6011|65|64[4-9])/.test(n)) return "discover";
  if (/^(30[0-5]|36|38|39)/.test(n)) return "diners";
  if (/^35(2[89]|[3-8])/.test(n)) return "jcb";
  return "unknown";
}

/** `4242424242424242` as `4242 4242 4242 4242` (American Express: `3782 822463 10005`). */
export function formatCardNumber(input: string): string {
  const n = cardDigits(input);
  if (cardBrand(n) === "amex") {
    const d = n.slice(0, 15);
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10)].filter(Boolean).join(" ");
  }
  return (n.match(/.{1,4}/g) ?? []).join(" ");
}

/** The longest number the brand has, to stop typing there. */
export const cardMaxLength = (brand: CardBrand) => Math.max(...CARD_BRANDS[brand].lengths);

/** `1226` or `12/26` as `12 / 26`; a first digit above 1 becomes `0n`. */
export function formatExpiry(input: string): string {
  let d = input.replace(/\D/g, "").slice(0, 4);
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  if (d.length >= 2 && Number(d.slice(0, 2)) > 12) d = `1${d.slice(2)}`.slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}

/** The month and year (four digits) of an expiry text, or `null`. */
export function parseExpiry(input: string): { month: number; year: number } | null {
  const m = /^(\d{2})\s*\/?\s*(\d{2}|\d{4})$/.exec(input.trim());
  if (!m) return null;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return null;
  const year = m[2]!.length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
  return { month, year };
}

/** An expiry that has not passed: a card is good through the last day of its month. */
export function expiryValid(input: string, now: Date = new Date()): boolean {
  const e = parseExpiry(input);
  if (!e) return false;
  const current = now.getFullYear() * 12 + now.getMonth();
  const card = e.year * 12 + (e.month - 1);
  return card >= current && e.year <= now.getFullYear() + 25;
}

/** A security code of the right length for the brand (3 digits, 4 for American Express). */
export function cvcValid(input: string, brand: CardBrand = "unknown"): boolean {
  const want = CARD_BRANDS[brand].cvc;
  return brand === "unknown" ? /^\d{3,4}$/.test(input) : new RegExp(`^\\d{${want}}$`).test(input);
}

export interface CardValues {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export type CardErrors = Partial<Record<keyof CardValues, string>>;

/** What is wrong with the card details; an empty object when they can be sent. */
export function validateCard(values: CardValues, now: Date = new Date()): CardErrors {
  const errors: CardErrors = {};
  const brand = cardBrand(values.number);
  const digits = cardDigits(values.number);
  if (!digits) errors.number = "Enter the card number.";
  else if (!CARD_BRANDS[brand].lengths.includes(digits.length) || !luhnValid(digits))
    errors.number = "This card number is not valid. Check the digits.";
  if (!values.expiry.trim()) errors.expiry = "Enter the expiry date.";
  else if (!expiryValid(values.expiry, now))
    errors.expiry = "This card has expired or the date is wrong.";
  if (!values.cvc) errors.cvc = "Enter the security code.";
  else if (!cvcValid(values.cvc, brand))
    errors.cvc = `The code has ${CARD_BRANDS[brand].cvc} digits.`;
  if (!values.name.trim()) errors.name = "Enter the name on the card.";
  return errors;
}

/** The last four digits only: all that is safe to keep on screen after payment. */
export const last4 = (input: string) => cardDigits(input).slice(-4);

/* ---------------------------------------------------------------- bank accounts */

/** The length of an IBAN by country (those of SEPA and a few more). */
const IBAN_LENGTH: Record<string, number> = Object.fromEntries(
  (
    "AD24 AT20 BE16 BG22 CH21 CY28 CZ24 DE22 DK18 EE20 ES24 FI18 FR27 GB22 GI23 GR27 HR21 HU28 " +
    "IE22 IS26 IT27 LI21 LT20 LU20 LV21 MC27 MT31 NL18 NO15 PL28 PT25 RO24 SE24 SI19 SK24 SM27 VA22"
  )
    .split(" ")
    .map((x) => [x.slice(0, 2), Number(x.slice(2))]),
);

/** An IBAN without spaces, in capitals. */
export const normalizeIban = (input: string) =>
  input
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 34);

/** `DE89370400440532013000` as `DE89 3704 0044 0532 0130 00`. */
export const formatIban = (input: string) =>
  (normalizeIban(input).match(/.{1,4}/g) ?? []).join(" ");

/** The mod 97 of an IBAN, worked piece by piece so that no number outgrows an integer. */
function mod97(iban: string): number {
  const moved = iban.slice(4) + iban.slice(0, 4);
  let rest = 0;
  for (const ch of moved) {
    const code = ch >= "A" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of code) rest = (rest * 10 + Number(d)) % 97;
  }
  return rest;
}

/** The IBAN check: country, length and mod 97 equal to 1. */
export function ibanValid(input: string): boolean {
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
  const length = IBAN_LENGTH[iban.slice(0, 2)];
  if (length === undefined || iban.length !== length) return false;
  return mod97(iban) === 1;
}

/** The first two characters of an IBAN and the last four: `DE** **** **** **** **00`-like mask. */
export function maskIban(input: string): string {
  const iban = normalizeIban(input);
  return iban.length <= 6
    ? iban
    : `${iban.slice(0, 2)}${"•".repeat(iban.length - 6)}${iban.slice(-4)}`;
}

export interface BankValues {
  holder: string;
  iban: string;
  /** The person accepted the mandate. */
  mandate: boolean;
}

export type BankErrors = Partial<Record<keyof BankValues, string>>;

/** What is wrong with the bank details; an empty object when they can be sent. */
export function validateBank(values: BankValues, mandateRequired = true): BankErrors {
  const errors: BankErrors = {};
  if (!values.holder.trim()) errors.holder = "Enter the account holder.";
  if (!normalizeIban(values.iban)) errors.iban = "Enter the IBAN.";
  else if (!ibanValid(values.iban)) errors.iban = "This IBAN is not valid. Check the characters.";
  if (mandateRequired && !values.mandate) errors.mandate = "Accept the mandate to continue.";
  return errors;
}
