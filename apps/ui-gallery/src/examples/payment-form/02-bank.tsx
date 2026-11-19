import { PaymentForm } from "@forgeron/ui";

export default function Bank() {
  return <PaymentForm defaultMethod="bank" methods={["bank"]} submitLabel="Set up the debit" />;
}
