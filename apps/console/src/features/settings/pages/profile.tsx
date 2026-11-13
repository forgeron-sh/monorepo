import { addresses } from "@forgeron/platform-contract/client";
import { Avatar, Badge, Button, Notice, Page, SettingsGroup, SettingsRow } from "@forgeron/ui";
import { useRef, useState } from "react";
import { explain, ok, typedSender } from "../../../api";
import type { PageProps } from "../../../shell/page-props";
import { avatarDataUrl } from "../avatar-image";
import { SettingsStack } from "../components/settings-stack";

export default function ProfilePage({ ws, api }: PageProps) {
  const { person } = ws;
  const input = useRef<HTMLInputElement>(null);
  // The picture after a change, until the shell reloads the workspace.
  const [avatar, setAvatar] = useState(person.avatar);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const save = async (image: string | null) => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = ok(await typedSender(api.sendJson)(addresses.putAvatar, { json: { image } }));
      setAvatar(answer.avatar ?? undefined);
    } catch (e) {
      setError(explain(e, "The picture was not saved. Try again."));
    } finally {
      setBusy(false);
    }
  };
  const choose = async (file: File | undefined) => {
    if (!file) return;
    try {
      await save(await avatarDataUrl(file));
    } catch {
      setError("This file is not a picture this browser can read. Try a png, jpeg or webp.");
    }
  };

  return (
    <Page title="Profile" description="How you appear in this workspace.">
      <SettingsStack>
        <SettingsGroup title="You">
          <SettingsRow
            label="Picture"
            description={
              avatar?.source === "custom"
                ? "The one you chose. Removing it goes back to your sign-in provider's, if it gives one."
                : avatar
                  ? "From your sign-in provider. Choose another to replace it."
                  : "Shown to the other members and in the tools that ask for it. A square png, jpeg or webp."
            }
          >
            <span className="fc-badges">
              <Avatar name={person.name} size={40} {...(avatar ? { src: avatar.url } : {})} />
              <input
                ref={input}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                aria-label="Choose a picture"
                onChange={(e) => {
                  void choose(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button onClick={() => input.current?.click()} disabled={busy}>
                {busy ? "Saving…" : avatar ? "Change" : "Choose a picture"}
              </Button>
              {avatar?.source === "custom" ? (
                <Button variant="ghost" onClick={() => void save(null)} disabled={busy}>
                  Remove
                </Button>
              ) : null}
            </span>
          </SettingsRow>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <SettingsRow label="Name" description="Shown to the other members.">
            <span>{person.name}</span>
          </SettingsRow>
          <SettingsRow label="Email" description="The address you sign in with.">
            <span className="fc-mono">{person.email}</span>
          </SettingsRow>
          <SettingsRow
            label="Roles"
            description="What an admin gave you. Ask an admin to change them."
          >
            <span className="fc-badges">
              {person.roles.length ? (
                person.roles.map((role) => (
                  <Badge key={role} tone={role === "admin" ? "strong" : "neutral"}>
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge>no role</Badge>
              )}
            </span>
          </SettingsRow>
        </SettingsGroup>
      </SettingsStack>
    </Page>
  );
}
