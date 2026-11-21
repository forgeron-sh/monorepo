import { SecretField } from "@forgeron/ui";
import { useState } from "react";

export default function NotSet() {
  const [set, setSet] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <SecretField
        label="Client secret"
        isSet={set}
        {...(set
          ? { rotatedAt: "2026-11-19", today: "2026-11-19", value: "fg_test_yyyyyyyy" }
          : {})}
        onReplace={() => setSet(true)}
        onRemove={() => setSet(false)}
      />
    </div>
  );
}
