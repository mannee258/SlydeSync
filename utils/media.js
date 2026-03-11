const IMAGE_EXTENSIONS = new Set([
  ".apng",
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

const VIDEO_EXTENSIONS = new Set([
  ".m4v",
  ".mov",
  ".mp4",
  ".mpeg",
  ".mpg",
  ".ogg",
  ".ogv",
  ".webm",
]);

function getExtension(value) {
  const input = String(value || "");
  const lastDot = input.lastIndexOf(".");
  if (lastDot < 0) return "";
  return input.slice(lastDot).toLowerCase();
}

export function getMediaType(item) {
  const explicitType = item?.mediaType || item?.type;
  if (explicitType === "image" || explicitType === "video") {
    return explicitType;
  }

  const mimeType = item?.mimeType || item?.mime;
  if (typeof mimeType === "string") {
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("image/")) return "image";
  }

  const ext = getExtension(item?.name || item?.url);
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  return "image";
}

export function isVideoMedia(item) {
  return getMediaType(item) === "video";
}
