import { CurrencyPicker, MoneyInput } from "@forgeron/ui";
import { useState } from "react";

export default function WithCurrency() {
  const [currency, setCurrency] = useState("USD");
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <MoneyInput label="Amount" currency={currency} locale="en-US" defaultValue={2500} />
      <CurrencyPicker label="Currency" value={currency} onChange={setCurrency} locale="en" />
    </div>
  );
}
