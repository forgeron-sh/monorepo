import { Database01Icon, TrophyIcon } from "@forgeron/icons";
import { ExpressionInput, Field, variablesFromSample } from "@forgeron/ui";
import { useState } from "react";

const deal = {
  id: 4182,
  name: "Transalp",
  amount: 9600,
  owner: { name: "Léa Martin", email: "lea@atelier.example" },
};
const rates = { carrier: "Geodis", price: 412.5, days: 2 };

// Type {{ to open the outputs of the previous steps, or use the button. With a sample, the line
// under the field says what the text gives.
export default function InAFieldWithPreview() {
  const [text, setText] = useState(
    "{{ deal.owner.name }} won {{ deal.name }} for €{{ deal.amount }}.\nShipping by {{ rates.carrier }}, ",
  );
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <Field label="Message" hint="Posted in #sales.">
        {(control) => (
          <ExpressionInput
            {...control}
            multiline
            rows={4}
            value={text}
            onChange={setText}
            variables={[
              variablesFromSample("rates", "Carrier rates", rates, Database01Icon),
              variablesFromSample("deal", "Deal moved to Won", deal, TrophyIcon),
            ]}
            sample={{ deal, rates }}
          />
        )}
      </Field>
    </div>
  );
}
