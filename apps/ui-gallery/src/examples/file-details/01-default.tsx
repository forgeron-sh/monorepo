import {
  FileDetails,
  FileDetailsAccess,
  FileDetailsBody,
  FileDetailsHeader,
  FileDetailsProperties,
  FileDetailsSections,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: 320 }}>
      <FileDetails
        name="Dock plan.pdf"
        size={240_000}
        owner="Léa Martin"
        location="Operations › Lyon depot"
        modified="Nov 18, 2026 · 09:12"
        access={{
          people: ["Léa Martin", "Tom Garnier", "Camille Roy"],
          scope: "organization",
          summary: "Anyone at Atelier Moreau can view",
          onManage: () => {},
        }}
      >
        <FileDetailsHeader />
        <FileDetailsBody>
          <FileDetailsSections>
            <FileDetailsAccess />
            <FileDetailsProperties />
          </FileDetailsSections>
        </FileDetailsBody>
      </FileDetails>
    </div>
  );
}
