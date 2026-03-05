import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MANIFEST_PATH = path.join(DATA_DIR, "images.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const UPLOAD_LIMIT_BYTES = 15 * 1024 * 1024;

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readManifest() {
  await ensureDirs();
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeManifest(images) {
  await ensureDirs();
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(images, null, 2), "utf8");
}

function safeBasename(name) {
  return (name || "upload")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}

export async function POST(request) {
  const formData = await request.formData();
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
  const existing = await readManifest();
  const now = new Date().toISOString();
  const uploaded = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const ext = path.extname(file.name) || ".bin";
    const base = path.basename(file.name, ext);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBasename(base)}${ext}`;
    const absPath = path.join(UPLOADS_DIR, filename);
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, bytes);

    uploaded.push({
      id:
        typeof crypto?.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      name: file.name,
      url: `/uploads/${filename}`,
      createdAt: now,
      size: file.size,
    });
  }

  const next = [...existing, ...uploaded];
  await writeManifest(next);

  return Response.json({ images: uploaded, totalBytes: totalBytes });
}
