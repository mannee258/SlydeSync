import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FOLDERS_DIR = path.join(DATA_DIR, "folders");
const LEGACY_MANIFEST_PATH = path.join(DATA_DIR, "images.json");
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const DEFAULT_FOLDER = "default";
const UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024;

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

async function readManifest(folder) {
  await ensureDirs();
  const manifestPath = manifestPathFor(folder);
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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

function safeBasename(name) {
  return (name || "upload")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}

function getMediaType(file) {
  if (file?.type?.startsWith("image/")) return "image";
  if (file?.type?.startsWith("video/")) return "video";
  return null;
}

export async function POST(request) {
  const formData = await request.formData();
  const folder = sanitizeFolderName(formData.get("folder"));
  const files = formData.getAll("files").filter((f) => f instanceof File);

  if (!files.length) {
    return Response.json({ error: "No files uploaded." }, { status: 400 });
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > UPLOAD_LIMIT_BYTES) {
    return Response.json(
      { error: "Upload limit exceeded. Max total upload is 50MB." },
      { status: 413 },
    );
  }

  await ensureDirs();
  const uploadsDir = uploadsDirFor(folder);
  await fs.mkdir(uploadsDir, { recursive: true });
  const existing = await readManifest(folder);
  const now = new Date().toISOString();
  const uploaded = [];

  for (const file of files) {
    const mediaType = getMediaType(file);
    if (!mediaType) continue;

    const ext = path.extname(file.name) || ".bin";
    const base = path.basename(file.name, ext);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBasename(base)}${ext}`;
    const absPath = path.join(uploadsDir, filename);
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, bytes);

    uploaded.push({
      id:
        typeof crypto?.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      name: file.name,
      folder,
      url: `/uploads/${folder}/${filename}`,
      createdAt: now,
      size: file.size,
      mediaType,
      mimeType: file.type,
    });
  }

  const next = [...existing, ...uploaded];
  await writeManifest(folder, next);

  return Response.json({ images: uploaded, totalBytes: totalBytes, folder });
}
