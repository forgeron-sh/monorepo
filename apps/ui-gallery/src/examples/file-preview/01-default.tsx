import { FilePreview, FilePreviewBody, FilePreviewHeader, FilePreviewStage } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <FilePreview
        name="Night dock.md"
        size={1_240}
        meta="Léa Martin · Nov 17"
        text={
          "Night dock from week 3\n\nReceiving until 02:00 on dock 3, the only one long enough for semi-trailers."
        }
        onDownload={() => {}}
        onClose={() => {}}
      >
        <FilePreviewHeader />
        <FilePreviewBody>
          <FilePreviewStage />
        </FilePreviewBody>
      </FilePreview>
    </div>
  );
}
