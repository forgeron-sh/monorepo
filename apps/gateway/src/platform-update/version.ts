// Release versions as the release workflow tags them: `v<major>.<minor>.<patch>`.

const TAG = /^v(\d+)\.(\d+)\.(\d+)$/;
const VERSION = /^(\d+)\.(\d+)\.(\d+)/;

/** `0.6.0` from the tag `v0.6.0`, or `undefined` when the tag is not a release's. */
export const versionOfTag = (tag: string): string | undefined => {
  const m = TAG.exec(tag);
  return m ? `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}` : undefined;
};

const parts = (version: string): [number, number, number] | undefined => {
  const m = VERSION.exec(version);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : undefined;
};

/**
 * Negative when `a` is older than `b`, positive when newer, 0 when equal. A version that is not
 * `x.y.z` (a build from the sources says `0.0.0`) is older than any release.
 */
export function compareVersions(a: string, b: string): number {
  const x = parts(a) ?? [0, 0, 0];
  const y = parts(b) ?? [0, 0, 0];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
  return 0;
}
