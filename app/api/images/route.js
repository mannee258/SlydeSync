import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FOLDERS_DIR = path.join(DATA_DIR, "folders");
const LEGACY_MANIFEST_PATH = path.join(DATA_DIR, "images.json");
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const DEFAULT_FOLDER = "default";

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(FOLDERS_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_ROOT, { recursive: true });
}

function sanitizeFolderName(input) {
  const slug = String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  return slug || DEFAULT_FOLDER;
}

function manifestPathFor(folder) {
  return path.join(FOLDERS_DIR, `${folder}.json`);
}

function uploadsDirFor(folder) {
  return path.join(UPLOADS_ROOT, folder);
}

function uploadUrlPrefix(folder) {
  return `/uploads/${folder}/`;
}

async function readManifest(folder) {
  await ensureDirs();
  const manifestPath = manifestPathFor(folder);
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validated = await Promise.all(
      parsed.map(async (img) => {
        const url = img?.url;
        if (!isUploadUrl(url)) return img;
        try {
          await fs.access(localUploadPathFromUrl(url));
          return img;
        } catch {
          return null;
        }
      }),
    );

    return validated.filter(Boolean);
  } catch {
    if (folder === DEFAULT_FOLDER) {
      try {
        const legacyRaw = await fs.readFile(LEGACY_MANIFEST_PATH, "utf8");
        const legacyParsed = JSON.parse(legacyRaw);
        return Array.isArray(legacyParsed) ? legacyParsed : [];
      } catch {
        // Ignore missing/invalid legacy manifest.
      }
    }
    return [];
  }
}

async function writeManifest(folder, images) {
  await ensureDirs();
  await fs.mkdir(uploadsDirFor(folder), { recursive: true });
  await fs.writeFile(
    manifestPathFor(folder),
    JSON.stringify(images, null, 2),
    "utf8",
  );
}

function isUploadUrl(url) {
  return typeof url === "string" && url.startsWith("/uploads/");
}

function localUploadPathFromUrl(url) {
  return path.join(UPLOADS_ROOT, url.replace("/uploads/", ""));
}

export async function GET(request) {
  const folder = sanitizeFolderName(
    new URL(request.url).searchParams.get("folder"),
  );
  const images = await readManifest(folder);
  await writeManifest(folder, images);
  return Response.json({ images, folder });
}

export async function POST(request) {
  const folder = sanitizeFolderName(
    new URL(request.url).searchParams.get("folder"),
  );
  const body = await request.json().catch(() => ({}));
  const images = Array.isArray(body?.images) ? body.images : [];

  // Best effort cleanup for files removed from the queue.
  const previous = await readManifest(folder);
  const folderPrefix = uploadUrlPrefix(folder);
  const keep = new Set(images.map((img) => img?.url).filter(Boolean));
  const removed = previous
    .map((img) => img?.url)
    .filter(
      (url) =>
        isUploadUrl(url) && url.startsWith(folderPrefix) && !keep.has(url),
    );

  await Promise.all(
    removed.map(async (url) => {
      try {
        await fs.unlink(localUploadPathFromUrl(url));
      } catch {
        // Ignore missing files.
      }
    }),
  );

  await writeManifest(folder, images);
  return Response.json({ ok: true, folder });
}
