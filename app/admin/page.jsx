"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_FOLDER,
  createFolder,
  renameFolder,
  deleteFolder,
  loadActiveFolder,
  loadFolders,
  loadImages,
  saveImages,
  saveActiveFolder,
  loadSettings,
  saveSettings,
  defaultSettings,
} from "@/utils/storage";
import UploadBox from "@/components/UploadBox";
import ImageList from "@/components/ImageList";
import SettingsPanel from "@/components/SettingsPanel";
import FolderPicker from "@/components/FolderPicker";
import { RefreshCw, LayoutGrid, Info } from "lucide-react";

export default function AdminPage() {
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([DEFAULT_FOLDER]);
  const [folderCounts, setFolderCounts] = useState({ [DEFAULT_FOLDER]: 0 });
  const [selectedFolder, setSelectedFolder] = useState(DEFAULT_FOLDER);
  const [settings, setSettings] = useState(defaultSettings);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const [{ folders: loadedFolders, folderCounts: loadedCounts }, activeFolder] = await Promise.all([
        loadFolders(),
        loadActiveFolder(),
      ]);
      const folderToUse = activeFolder || DEFAULT_FOLDER;
      const loadedImages = await loadImages(folderToUse);
      const loadedSettings = loadSettings();
      if (cancelled) return;
      setFolders(
        loadedFolders.includes(folderToUse)
          ? loadedFolders
          : [...loadedFolders, folderToUse],
      );
      setFolderCounts({
        ...loadedCounts,
        [folderToUse]:
          loadedCounts[folderToUse] ?? loadedImages.length,
      });
      setSelectedFolder(folderToUse);
      setImages(loadedImages);
      setSettings(loadedSettings);
      setMounted(true);
      setReady(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mounted && ready) {
      saveImages(images, selectedFolder);
    }
  }, [images, mounted, ready, selectedFolder]);

  useEffect(() => {
    if (mounted && ready) saveSettings(settings);
  }, [settings, mounted, ready]);

  const stats = useMemo(() => {
    const bytes = images.reduce(
      (sum, image) => sum + (Number(image?.size) || 0),
      0,
    );
    return {
      count: images.length,
      approxSizeMb: Math.round((bytes / 1024 / 1024) * 100) / 100,
    };
  }, [images]);

  async function handleSelectFolder(nextFolder) {
    if (nextFolder === selectedFolder) return;
    setReady(false);
    setSelectedFolder(nextFolder);
    try {
      await saveActiveFolder(nextFolder);
      const nextImages = await loadImages(nextFolder);
      setImages(nextImages);
      setFolderCounts((prev) => ({ ...prev, [nextFolder]: nextImages.length }));
    } finally {
      setReady(true);
    }
  }

  async function handleCreateFolder(name) {
    const created = await createFolder(name);
    setFolders((prev) =>
      prev.includes(created) ? prev : [...prev, created],
    );
    setFolderCounts((prev) => ({ ...prev, [created]: prev[created] ?? 0 }));
    await handleSelectFolder(created);
  }

  async function handleRenameFolder(oldName, newName) {
    const renamed = await renameFolder(oldName, newName);
    setFolders((prev) => prev.map((f) => (f === oldName ? renamed : f)));
    setFolderCounts((prev) => {
      const next = { ...prev, [renamed]: prev[oldName] ?? 0 };
      delete next[oldName];
      return next;
    });
    if (selectedFolder === oldName) {
      setSelectedFolder(renamed);
    }
  }

  async function handleDeleteFolder(name) {
    await deleteFolder(name);
    const nextFolders = folders.filter((f) => f !== name);
    setFolders(nextFolders);
    setFolderCounts((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (selectedFolder === name) {
      const fallback = nextFolders[0] ?? DEFAULT_FOLDER;
      await handleSelectFolder(fallback);
    }
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Control</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage your slideshow queue and playback settings
          </p>
        </div>
        <div className="flex items-center gap-0 bg-[#1B1F27] border border-[#242A34] rounded-xl overflow-hidden self-start sm:self-auto">
          <div className="flex flex-col items-end px-4 py-2.5">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
              Storage
            </span>
            <span className="text-sm font-semibold mt-0.5">
              {stats.approxSizeMb} MB / 50 MB
            </span>
          </div>
          <div className="w-px h-full self-stretch bg-white/10" />
          <div className="flex flex-col items-end px-4 py-2.5">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
              Images
            </span>
            <span className="text-sm font-semibold mt-0.5">{stats.count} items</span>
          </div>
        </div>
      </div>

      {/* Main three-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_320px] gap-6 items-start">
        {/* Left: Folders sidebar */}
          <FolderPicker
            folders={folders}
            folderCounts={folderCounts}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />

        {/* Centre: Media Library */}
        <section className="bg-[#0C1016] border border-[#1C222B] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/80">
              <LayoutGrid className="w-5 h-5 text-[#3F82FF]" />
              <h2 className="font-semibold">Media Library</h2>
            </div>
            <span className="text-xs font-medium bg-[#1B1F27] border border-[#242A34] text-white/60 px-3 py-1 rounded-full">
              Viewing: {selectedFolder === "default" ? "All Images" : selectedFolder}
            </span>
          </div>

          <UploadBox
            folder={selectedFolder}
            onAddImages={(newOnes) =>
              setImages((prev) => {
                const next = [...prev, ...newOnes];
                setFolderCounts((counts) => ({
                  ...counts,
                  [selectedFolder]: next.length,
                }));
                return next;
              })
            }
          />

          <div className="mt-6">
            <ImageList
              images={images}
              onDelete={(id) =>
                setImages((prev) => {
                  const next = prev.filter((x) => x.id !== id);
                  setFolderCounts((counts) => ({
                    ...counts,
                    [selectedFolder]: next.length,
                  }));
                  return next;
                })
              }
              onMove={(id, dir) => {
                setImages((prev) => {
                  const idx = prev.findIndex((x) => x.id === id);
                  if (idx < 0) return prev;
                  const nextIdx = dir === "up" ? idx - 1 : idx + 1;
                  if (nextIdx < 0 || nextIdx >= prev.length) return prev;
                  const copy = [...prev];
                  const tmp = copy[idx];
                  copy[idx] = copy[nextIdx];
                  copy[nextIdx] = tmp;
                  return copy;
                });
              }}
              onClearAll={() => {
                if (confirm("Clear all images from the queue?")) {
                  setImages([]);
                  setFolderCounts((counts) => ({
                    ...counts,
                    [selectedFolder]: 0,
                  }));
                }
              }}
            />
          </div>
        </section>

        {/* Right: Playback Config */}

        <section className="bg-[#0C1016] border border-[#1C222B] rounded-2xl p-6 sticky top-24 self-start">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/80">
              <RefreshCw className="w-5 h-5 text-[#3F82FF]" />
              <h2 className="font-semibold">Playback Config</h2>
            </div>
            <button
              onClick={() => setSettings(defaultSettings)}
              className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-[#3F82FF] transition"
            >
              Reset
            </button>
          </div>

          <SettingsPanel settings={settings} onChange={setSettings} />

          <div className="mt-8 p-4 bg-[#3F82FF]/5 border border-[#3F82FF]/20 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-[#3F82FF] shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              Changes are saved instantly to your browser&apos;s local storage.
              Open the <span className="text-white font-semibold">Display</span> page
              on this device to see the show.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
