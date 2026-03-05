import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FOLDERS_DIR = path.join(DATA_DIR, "folders");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");
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

async function ensureFolderExists(folder) {
  await fs.mkdir(uploadsDirFor(folder), { recursive: true });
  const manifestPath = manifestPathFor(folder);
  try {
    await fs.access(manifestPath);
  } catch {
    await fs.writeFile(manifestPath, "[]", "utf8");
  }
}

async function readConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function GET() {
  await ensureDirs();
  const config = await readConfig();
  const activeFolder = sanitizeFolderName(config?.activeFolder);
  await ensureFolderExists(activeFolder);
  return Response.json({ activeFolder });
}

export async function POST(request) {
  await ensureDirs();
  const body = await request.json().catch(() => ({}));
  const activeFolder = sanitizeFolderName(body?.folder);
  await ensureFolderExists(activeFolder);
  await fs.writeFile(
    CONFIG_PATH,
    JSON.stringify({ activeFolder }, null, 2),
    "utf8",
  );
  return Response.json({ activeFolder });
}
