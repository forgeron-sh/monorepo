import {
  SecretField,
  SecretFieldBody,
  SecretFieldConfirm,
  SecretFieldHeader,
  SecretFieldHint,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <SecretField
        label="Client secret"
        isSet
        getValue={() => "fg_test_xxxxxxxx"}
        onRemove={() => {}}
      >
        <SecretFieldHeader />
        <SecretFieldHint>
          Kept by the app: it never reaches this page until you reveal it.
        </SecretFieldHint>
        <SecretFieldBody />
        <SecretFieldConfirm />
      </SecretField>
    </div>
  );
}
