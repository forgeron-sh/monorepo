import { TagInput } from "@forgeron/ui";
import { useState } from "react";

const email = (tag: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tag);

export default function Emails() {
  const [to, setTo] = useState(["ada@example.com", "not-an-email"]);
  return (
    <TagInput
      label="Recipients"
      placeholder="Type or paste addresses"
      value={to}
      onChange={setTo}
      validate={email}
    />
  );
}
