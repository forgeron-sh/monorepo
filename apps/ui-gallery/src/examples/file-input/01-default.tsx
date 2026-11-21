import {
  FileInput,
  FileInputDrop,
  FileInputHint,
  FileInputLimits,
  FileInputList,
  FileInputTrigger,
} from "@forgeron/ui";

// With children, FileInput is the root of the parts: the frame, its hint, the button, the list.
export default function Composed() {
  return (
    <FileInput label="Contracts" accept=".pdf" maxSize={5 * 1024 * 1024} multiple>
      <FileInputDrop>
        <FileInputHint>Drop the PDFs here, or</FileInputHint>
        <FileInputTrigger>Browse</FileInputTrigger>
        <FileInputLimits />
      </FileInputDrop>
      <FileInputList />
    </FileInput>
  );
}
