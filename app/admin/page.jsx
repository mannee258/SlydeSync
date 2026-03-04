"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  loadImages,
  saveImages,
  loadSettings,
  saveSettings,
  defaultSettings,
} from "@/utils/storage";
import UploadBox from "@/components/UploadBox";
import ImageList from "@/components/ImageList";
import SettingsPanel from "@/components/SettingsPanel";
import { RefreshCw, LayoutGrid, Info } from "lucide-react";

export default function AdminPage() {
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const loadedImages = await loadImages();
      const loadedSettings = loadSettings();
      if (cancelled) return;
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
      saveImages(images);
    }
  }, [images, mounted, ready]);

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

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Media Library */}
        <section className="bg-[#0C1016] border border-[#1C222B] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-white/80">
            <LayoutGrid className="w-5 h-5 text-[#3F82FF]" />
            <h2 className="font-semibold">Media Library</h2>
          </div>

          <UploadBox
            onAddImages={(newOnes) =>
              setImages((prev) => [...newOnes, ...prev])
            }
          />

          <div className="mt-6">
            <ImageList
              images={images}
              onDelete={(id) =>
                setImages((prev) => prev.filter((x) => x.id !== id))
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
