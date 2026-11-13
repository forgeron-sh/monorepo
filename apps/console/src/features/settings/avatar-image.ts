// A picture chosen in the profile (D-133): cropped to a square and shrunk in the browser, so that what
// goes to the platform is a small image (it refuses more than 64 KB), whatever the photo was.

const AVATAR_SIZE = 128;

/** A square of `AVATAR_SIZE` px cut from the middle of the image: webp when the browser can, else jpeg. */
export async function avatarDataUrl(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot resize pictures.");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();
  const webp = canvas.toDataURL("image/webp", 0.85);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85);
}
