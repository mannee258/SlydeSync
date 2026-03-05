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

async function readActiveFolder() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return sanitizeFolderName(parsed?.activeFolder);
  } catch {
    return DEFAULT_FOLDER;
  }
}

async function readFolderCount(folder) {
  try {
    const raw = await fs.readFile(manifestPathFor(folder), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  await ensureDirs();

  const uploadEntries = await fs.readdir(UPLOADS_ROOT, { withFileTypes: true });
  const uploadFolders = uploadEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => sanitizeFolderName(entry.name));

  const manifestEntries = await fs.readdir(FOLDERS_DIR, { withFileTypes: true });
  const manifestFolders = manifestEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => sanitizeFolderName(entry.name.replace(/\.json$/, "")));

  const folders = Array.from(
    new Set([DEFAULT_FOLDER, ...uploadFolders, ...manifestFolders]),
  );
  const folderCounts = {};
  await Promise.all(
    folders.map(async (folder) => {
      folderCounts[folder] = await readFolderCount(folder);
    }),
  );

  const activeFolder = await readActiveFolder();
  return Response.json({ folders, folderCounts, activeFolder });
}

export async function POST(request) {
  await ensureDirs();
  const body = await request.json().catch(() => ({}));
  const folder = sanitizeFolderName(body?.name);
  await ensureFolderExists(folder);
  return Response.json({ folder });
}

export async function PATCH(request) {
  await ensureDirs();
  const oldFolder = sanitizeFolderName(
    new URL(request.url).searchParams.get("folder"),
  );
  const body = await request.json().catch(() => ({}));
  const newFolder = sanitizeFolderName(body?.name);

  if (!newFolder || newFolder === oldFolder) {
    return Response.json({ folder: oldFolder });
  }

  const oldManifest = manifestPathFor(oldFolder);
  const newManifest = manifestPathFor(newFolder);
  const oldUploads = uploadsDirFor(oldFolder);
  const newUploads = uploadsDirFor(newFolder);

  // Move manifest, rewriting upload URLs inside it.
  try {
    const raw = await fs.readFile(oldManifest, "utf8");
    const images = JSON.parse(raw);
    const updated = images.map((img) => ({
      ...img,
      folder: newFolder,
      url: typeof img.url === "string"
        ? img.url.replace(`/uploads/${oldFolder}/`, `/uploads/${newFolder}/`)
        : img.url,
    }));
    await fs.mkdir(uploadsDirFor(newFolder), { recursive: true });
    await fs.writeFile(newManifest, JSON.stringify(updated, null, 2), "utf8");
    await fs.unlink(oldManifest).catch(() => {});
  } catch {
    // Old manifest may not exist yet; just create an empty one.
    await ensureFolderExists(newFolder);
  }

  // Move upload files.
  try {
    await fs.mkdir(newUploads, { recursive: true });
    const files = await fs.readdir(oldUploads);
    await Promise.all(
      files.map((file) =>
        fs.rename(
          path.join(oldUploads, file),
          path.join(newUploads, file),
        ),
      ),
    );
    await fs.rmdir(oldUploads).catch(() => {});
  } catch {
    // Old uploads dir may not exist — safe to ignore.
  }

  // Update active folder in config if it pointed to the old name.
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const config = JSON.parse(raw);
    if (sanitizeFolderName(config?.activeFolder) === oldFolder) {
      await fs.writeFile(
        CONFIG_PATH,
        JSON.stringify({ ...config, activeFolder: newFolder }, null, 2),
        "utf8",
      );
    }
  } catch {
    // Config may not exist; ignore.
  }

  return Response.json({ folder: newFolder, previousFolder: oldFolder });
}

export async function DELETE(request) {
  await ensureDirs();
  const folder = sanitizeFolderName(
    new URL(request.url).searchParams.get("folder"),
  );

  if (folder === DEFAULT_FOLDER) {
    return Response.json(
      { error: "Cannot delete the default folder." },
      { status: 400 },
    );
  }

  // Delete manifest.
  await fs.unlink(manifestPathFor(folder)).catch(() => {});

  // Delete all upload files and the folder directory.
  const uploadsDir = uploadsDirFor(folder);
  try {
    const files = await fs.readdir(uploadsDir);
    await Promise.all(files.map((f) => fs.unlink(path.join(uploadsDir, f)).catch(() => {})));
    await fs.rmdir(uploadsDir).catch(() => {});
  } catch {
    // Upload dir may not exist.
  }

  // If active folder was this one, reset to default.
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const config = JSON.parse(raw);
    if (sanitizeFolderName(config?.activeFolder) === folder) {
      await fs.writeFile(
        CONFIG_PATH,
        JSON.stringify({ ...config, activeFolder: DEFAULT_FOLDER }, null, 2),
        "utf8",
      );
    }
  } catch {
    // Ignore.
  }

  return Response.json({ ok: true, deleted: folder });
}
