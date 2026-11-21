import { EnvTag } from "@forgeron/ui";

export default function Channels() {
  return (
    <>
      <EnvTag env="production" />
      <EnvTag env="channel">Beta</EnvTag>
      <EnvTag env="preview">feat/invoices</EnvTag>
    </>
  );
}
