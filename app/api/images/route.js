import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MANIFEST_PATH = path.join(DATA_DIR, "images.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readManifest() {
  await ensureDirs();
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
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
    return [];
  }
}

async function writeManifest(images) {
  await ensureDirs();
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(images, null, 2), "utf8");
}

function isUploadUrl(url) {
  return typeof url === "string" && url.startsWith("/uploads/");
}

function localUploadPathFromUrl(url) {
  return path.join(UPLOADS_DIR, url.replace("/uploads/", ""));
}

export async function GET() {
  const images = await readManifest();
  await writeManifest(images);
  return Response.json({ images });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const images = Array.isArray(body?.images) ? body.images : [];

  // Best effort cleanup for files removed from the queue.
  const previous = await readManifest();
  const keep = new Set(images.map((img) => img?.url).filter(Boolean));
  const removed = previous
    .map((img) => img?.url)
    .filter((url) => isUploadUrl(url) && !keep.has(url));

  await Promise.all(
    removed.map(async (url) => {
      try {
        await fs.unlink(localUploadPathFromUrl(url));
      } catch {
        // Ignore missing files.
      }
    }),
  );

  await writeManifest(images);
  return Response.json({ ok: true });
}
