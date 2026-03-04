const IMAGES_KEY = "mvp_slideshow_images";
const SETTINGS_KEY = "mvp_slideshow_settings";
export const UPLOAD_LIMIT_BYTES = 15 * 1024 * 1024;

export const defaultSettings = {
  intervalMs: 3000,
  transition: "fade",
  shuffle: false,
  showCaptions: false,
  fitMode: "contain",
};

export async function loadImages() {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/images", { cache: "no-store" });
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

export async function saveImages(images) {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });
  } catch {
    localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
  }
}

export async function uploadImages(files) {
  const list = Array.from(files || []).filter((f) => f?.type?.startsWith("image/"));
  const totalBytes = list.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > UPLOAD_LIMIT_BYTES) {
    throw new Error("Upload limit exceeded. Max total upload is 15MB.");
  }

  const formData = new FormData();
  list.forEach((file) => formData.append("files", file));

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
