import { Mail01Icon, TrophyIcon } from "@forgeron/icons";
import {
  DEFAULT_STEP_SETTINGS,
  StepInspector,
  variablesFromSample,
  type StepSettingsValue,
  type StepValues,
} from "@forgeron/ui";
import { useState } from "react";

const deal = {
  id: 4182,
  name: "Transalp",
  amount: 9600,
  contact: { email: "compta@transalp.example" },
};

// The panel a node editor opens on a step: parameters, settings, a test with its input and output.
export default function WithSettingsAndATest() {
  const [title, setTitle] = useState("Thank the client");
  const [values, setValues] = useState<StepValues>({
    credential: "mail-relay",
    to: "{{ deal.contact.email }}",
    subject: "Thank you, {{ deal.name }}",
    body: "We start on Monday.",
    copyOwner: true,
  });
  const [settings, setSettings] = useState<StepSettingsValue>({
    ...DEFAULT_STEP_SETTINGS,
    retry: true,
    output: "mail",
  });
  return (
    <div style={{ width: "100%", maxWidth: 420, height: 640 }}>
      <StepInspector
        icon={Mail01Icon}
        title={title}
        onTitleChange={setTitle}
        subtitle="Mail relay · send()"
        fields={[
          {
            key: "credential",
            label: "Account",
            type: "credential",
            typeLabel: `Credential<"mail">`,
            options: [
              { value: "mail-relay", label: "Mail relay (SMTP)" },
              { value: "mail-backup", label: "Backup relay", missing: true },
            ],
          },
          { key: "to", label: "To", type: "text", required: true, typeLabel: "string" },
          { key: "subject", label: "Subject", type: "text", typeLabel: "string" },
          { key: "body", label: "Body", type: "long", typeLabel: "string" },
          { key: "copyOwner", label: "Copy the deal owner", type: "boolean" },
        ]}
        values={values}
        onValuesChange={setValues}
        variables={[variablesFromSample("deal", "Deal moved to Won", deal, TrophyIcon)]}
        sample={{ deal }}
        settings={settings}
        onSettingsChange={setSettings}
        test={{
          status: "success",
          durationMs: 284,
          items: 1,
          at: "10:42:07",
          input: { deal },
          output: { messageId: "<4182.1731836527@relay>", accepted: ["compta@transalp.example"] },
        }}
        onTest={() => {}}
        onDuplicate={() => {}}
        onDelete={() => {}}
        onClose={() => {}}
      />
    </div>
  );
}
