// Card and bank (SEPA) details to collect, with formatting as you type and the checks of the
// standard ones (Luhn, expiry, IBAN mod 97). The values live in the fields and are handed to
// `onSubmit` once, then cleared; nothing is stored, logged or sent from here. A test mode is
// always announced.

import { useEffect, useId, useState } from "react";
import { Banner } from "../banner";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Checkbox, Field, Input } from "../form";
import {
  CARD_BRANDS,
  TEST_CARDS,
  TEST_IBANS,
  cardBrand,
  cardMaxLength,
  cardDigits,
  formatCardNumber,
  formatExpiry,
  formatIban,
  last4,
  validateBank,
  validateCard,
  type BankErrors,
  type BankValues,
  type CardErrors,
  type CardValues,
} from "./finance-payment-model";

export type PaymentMethod = "card" | "bank";

export type PaymentSubmit =
  | { method: "card"; values: CardValues; brand: string; last4: string }
  | { method: "bank"; values: BankValues };

export interface PaymentFormProps {
  /** The method shown. Controlled or not. */
  method?: PaymentMethod;
  defaultMethod?: PaymentMethod;
  onMethodChange?: (method: PaymentMethod) => void;
  /** Which methods are offered. Default both. */
  methods?: ReadonlyArray<PaymentMethod>;
  /**
   * Announces that nothing is charged and offers published test numbers to fill. Default `true`:
   * a live form is a deliberate choice, `testMode={false}`.
   */
  testMode?: boolean;
  /** Called with the details, once, when they are valid. They are cleared afterwards. */
  onSubmit?: (payment: PaymentSubmit) => void;
  /** Hears only whether the form could be sent, never a value. */
  onValidityChange?: (valid: boolean) => void;
  /** The label of the button. Default "Pay". */
  submitLabel?: string;
  /** The sentence of the mandate the person accepts. */
  mandateText?: string;
  disabled?: boolean;
  className?: string;
}

const emptyCard: CardValues = { number: "", expiry: "", cvc: "", name: "" };
const emptyBank: BankValues = { holder: "", iban: "", mandate: false };

/** Card or bank details, formatted and checked as they are typed. */
export function PaymentForm({
  method,
  defaultMethod = "card",
  onMethodChange,
  methods = ["card", "bank"],
  testMode = true,
  onSubmit,
  onValidityChange,
  submitLabel = "Pay",
  mandateText = "I authorise the creditor to debit my account by direct debit, and my bank to follow its instructions.",
  disabled,
  className,
}: PaymentFormProps) {
  const [current, setMethod] = useControllableState<PaymentMethod>({
    value: method,
    defaultValue: defaultMethod,
    onChange: onMethodChange,
  });
  const [card, setCard] = useState<CardValues>(emptyCard);
  const [bank, setBank] = useState<BankValues>(emptyBank);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const testId = useId();
  const brand = cardBrand(card.number);
  const cardErrors: CardErrors = validateCard(card);
  const bankErrors: BankErrors = validateBank(bank);
  const errors = current === "card" ? cardErrors : bankErrors;
  const valid = Object.keys(errors).length === 0;
  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid]); // eslint-disable-line react-hooks/exhaustive-deps
  const show = (key: string) =>
    touched[key] || submitted ? (errors as Record<string, string | undefined>)[key] : undefined;
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  const submit = () => {
    setSubmitted(true);
    if (!valid) return;
    onSubmit?.(
      current === "card"
        ? {
            method: "card",
            values: { ...card },
            brand: CARD_BRANDS[brand].name,
            last4: last4(card.number),
          }
        : { method: "bank", values: { ...bank } },
    );
    setCard(emptyCard);
    setBank(emptyBank);
    setTouched({});
    setSubmitted(false);
  };

  return (
    <form
      className={cx("fg-fin-pay", className)}
      noValidate
      autoComplete="on"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {testMode ? (
        <Banner tone="warning" title="Test mode" className="fg-fin-testbanner">
          No payment is made. Use a published test number
          {current === "card"
            ? ` such as ${formatCardNumber(TEST_CARDS[0]!.number)}.`
            : ` such as ${formatIban(TEST_IBANS[0]!.iban)}.`}
          <span id={testId} className="fg-fin-testfill">
            {" "}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (current === "card")
                  setCard({
                    number: formatCardNumber(TEST_CARDS[0]!.number),
                    expiry: "12 / 34",
                    cvc: "123",
                    name: "Test Person",
                  });
                else
                  setBank({
                    holder: "Test Person",
                    iban: formatIban(TEST_IBANS[0]!.iban),
                    mandate: false,
                  });
              }}
            >
              Fill the test details
            </Button>
          </span>
        </Banner>
      ) : null}
      {methods.length > 1 ? (
        <Segmented
          label="Payment method"
          value={current}
          onChange={(v) => setMethod(v as PaymentMethod)}
          options={methods.map((m) => ({
            value: m,
            label: m === "card" ? "Card" : "Bank transfer (SEPA)",
          }))}
        />
      ) : null}
      {current === "card" ? (
        <div className="fg-fin-pay-grid">
          <Field label="Card number" error={show("number")} className="fg-fin-pay-wide">
            {(c) => (
              <Input
                {...c}
                mono
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 1234 1234 1234"
                value={card.number}
                disabled={disabled}
                maxLength={cardMaxLength(brand) + 4}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                onBlur={() => touch("number")}
              />
            )}
          </Field>
          <Field label="Expiry" error={show("expiry")}>
            {(c) => (
              <Input
                {...c}
                mono
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / YY"
                value={card.expiry}
                disabled={disabled}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                onBlur={() => touch("expiry")}
              />
            )}
          </Field>
          <Field label="Security code" error={show("cvc")}>
            {(c) => (
              <Input
                {...c}
                mono
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder={brand === "amex" ? "4 digits" : "3 digits"}
                value={card.cvc}
                disabled={disabled}
                maxLength={4}
                onChange={(e) => setCard({ ...card, cvc: cardDigits(e.target.value).slice(0, 4) })}
                onBlur={() => touch("cvc")}
              />
            )}
          </Field>
          <Field label="Name on the card" error={show("name")} className="fg-fin-pay-wide">
            {(c) => (
              <Input
                {...c}
                autoComplete="cc-name"
                value={card.name}
                disabled={disabled}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                onBlur={() => touch("name")}
              />
            )}
          </Field>
          {brand !== "unknown" ? (
            <p className="fg-fin-pay-brand">{CARD_BRANDS[brand].name}</p>
          ) : null}
        </div>
      ) : (
        <div className="fg-fin-pay-grid">
          <Field label="Account holder" error={show("holder")} className="fg-fin-pay-wide">
            {(c) => (
              <Input
                {...c}
                autoComplete="name"
                value={bank.holder}
                disabled={disabled}
                onChange={(e) => setBank({ ...bank, holder: e.target.value })}
                onBlur={() => touch("holder")}
              />
            )}
          </Field>
          <Field label="IBAN" error={show("iban")} className="fg-fin-pay-wide">
            {(c) => (
              <Input
                {...c}
                mono
                autoComplete="off"
                spellCheck={false}
                placeholder="DE00 0000 0000 0000 0000 00"
                value={bank.iban}
                disabled={disabled}
                onChange={(e) => setBank({ ...bank, iban: formatIban(e.target.value) })}
                onBlur={() => touch("iban")}
              />
            )}
          </Field>
          <div className="fg-fin-pay-wide fg-fin-mandate">
            <Checkbox
              label={mandateText}
              checked={bank.mandate}
              disabled={disabled}
              aria-invalid={show("mandate") ? true : undefined}
              onChange={(e) => {
                setBank({ ...bank, mandate: e.target.checked });
                touch("mandate");
              }}
            />
            {show("mandate") ? <p className="fg-field-error">{show("mandate")}</p> : null}
          </div>
        </div>
      )}
      <div className="fg-fin-pay-actions">
        <Button variant="primary" type="submit" disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
