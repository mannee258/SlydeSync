const IMAGES_KEY = "mvp_slideshow_images";
const SETTINGS_KEY = "mvp_slideshow_settings";
const IMAGES_UPDATED_KEY = "mvp_slideshow_images_updated_at";
const ACTIVE_FOLDER_UPDATED_KEY = "mvp_slideshow_active_folder_updated_at";
const UPDATES_CHANNEL = "slydesync_updates";
export const DEFAULT_FOLDER = "default";
export const UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024;

function notifyImagesUpdated(images, folder) {
  const at = Date.now();
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(UPDATES_CHANNEL);
    channel.postMessage({ type: "images-updated", images, folder, at });
    channel.close();
  }
  localStorage.setItem(IMAGES_UPDATED_KEY, String(at));
}

function notifyActiveFolderUpdated(folder) {
  const at = Date.now();
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(UPDATES_CHANNEL);
    channel.postMessage({ type: "active-folder-updated", folder, at });
    channel.close();
  }
  localStorage.setItem(ACTIVE_FOLDER_UPDATED_KEY, String(at));
}

export const defaultSettings = {
  intervalMs: 3000,
  transition: "fade",
  shuffle: false,
  showCaptions: false,
  fitMode: "contain",
};

export async function loadImages(folder = DEFAULT_FOLDER) {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch(`/api/images?folder=${encodeURIComponent(folder)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.images) ? data.images : [];
  } catch {
    // Fallback for older localStorage-based data.
    try {
      const raw = localStorage.getItem(IMAGES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export async function saveImages(images, folder = DEFAULT_FOLDER) {
  if (typeof window === "undefined") return;
  // Optimistic cross-tab update so display can switch immediately.
  notifyImagesUpdated(images, folder);
  try {
    await fetch(`/api/images?folder=${encodeURIComponent(folder)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });
  } catch {
    localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
  }
}

export async function uploadImages(files, folder = DEFAULT_FOLDER) {
  const safeFolder = typeof folder === "string" && folder ? folder : DEFAULT_FOLDER;
  const list = Array.from(files || []).filter((f) => f?.type?.startsWith("image/"));
  const totalBytes = list.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > UPLOAD_LIMIT_BYTES) {
    throw new Error("Upload limit exceeded. Max total upload is 50MB.");
  }

  const formData = new FormData();
  list.forEach((file) => formData.append("files", file));
  formData.append("folder", safeFolder);

  const res = await fetch("/api/images/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Upload failed.");
  }

  const data = await res.json();
  return Array.isArray(data?.images) ? data.images : [];
}

export async function loadFolders() {
  if (typeof window === "undefined") {
    return { folders: [DEFAULT_FOLDER], folderCounts: { [DEFAULT_FOLDER]: 0 } };
  }
  try {
    const res = await fetch("/api/folders", { cache: "no-store" });
    if (!res.ok) {
      return { folders: [DEFAULT_FOLDER], folderCounts: { [DEFAULT_FOLDER]: 0 } };
    }
    const data = await res.json();
    const folders = Array.isArray(data?.folders) ? data.folders : [DEFAULT_FOLDER];
    const safeFolders = folders.length ? folders : [DEFAULT_FOLDER];
    const rawCounts =
      data?.folderCounts && typeof data.folderCounts === "object"
        ? data.folderCounts
        : {};
    const folderCounts = safeFolders.reduce((acc, folder) => {
      acc[folder] = Number(rawCounts[folder] || 0);
      return acc;
    }, {});
    return { folders: safeFolders, folderCounts };
  } catch {
    return { folders: [DEFAULT_FOLDER], folderCounts: { [DEFAULT_FOLDER]: 0 } };
  }
}

export async function renameFolder(oldName, newName) {
  if (typeof window === "undefined") return oldName;
  const res = await fetch(
    `/api/folders?folder=${encodeURIComponent(oldName)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to rename folder.");
  }
  const data = await res.json();
  return data?.folder || newName;
}

export async function deleteFolder(name) {
  if (typeof window === "undefined") return;
  const res = await fetch(
    `/api/folders?folder=${encodeURIComponent(name)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to delete folder.");
  }
}

export async function createFolder(name) {
  if (typeof window === "undefined") return DEFAULT_FOLDER;
  const res = await fetch("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to create folder.");
  }
  const data = await res.json();
  return data?.folder || DEFAULT_FOLDER;
}

export async function loadActiveFolder() {
  if (typeof window === "undefined") return DEFAULT_FOLDER;
  try {
    const res = await fetch("/api/folders/active", { cache: "no-store" });
    if (!res.ok) return DEFAULT_FOLDER;
    const data = await res.json();
    return data?.activeFolder || DEFAULT_FOLDER;
  } catch {
    return DEFAULT_FOLDER;
  }
}

export async function saveActiveFolder(folder) {
  if (typeof window === "undefined") return DEFAULT_FOLDER;
  const res = await fetch("/api/folders/active", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to save active folder.");
  }
  const data = await res.json();
  const activeFolder = data?.activeFolder || DEFAULT_FOLDER;
  notifyActiveFolderUpdated(activeFolder);
  return activeFolder;
}

export function loadSettings() {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
