import {
  Composer,
  ComposerField,
  ComposerFiles,
  ComposerFooter,
  ComposerToolbar,
} from "@forgeron/ui";

// The parts of a composer, without the reply bar: place them as you like.
export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <Composer onSend={() => {}} sendLabel="Post">
        <ComposerField />
        <ComposerFiles />
        <ComposerToolbar />
        <ComposerFooter />
      </Composer>
    </div>
  );
}
