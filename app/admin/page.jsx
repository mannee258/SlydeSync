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

  useEffect(() => {
    loadImages().then(setImages);
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveImages(images);
    }
  }, [images, mounted]);

  useEffect(() => {
    if (mounted) saveSettings(settings);
  }, [settings, mounted]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Control</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage your slideshow queue and playback settings
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#1B1F27] border border-[#242A34] px-4 py-2 rounded-xl">
          <div className="flex flex-col items-end">
            <span className="text-xs text-white/40 uppercase font-bold tracking-widest">
              Storage
            </span>
            <span className="text-sm font-medium">
              {stats.approxSizeMb} MB / 15 MB
            </span>
          </div>
          <div className="w-px h-8 bg-white/10 mx-2" />
          <div className="flex flex-col items-end">
            <span className="text-xs text-white/40 uppercase font-bold tracking-widest">
              Images
            </span>
            <span className="text-sm font-medium">{stats.count} items</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
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

            <div className="mt-8">
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
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bg-[#0C1016] border border-[#1C222B] rounded-2xl p-6 sticky top-24">
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
              <Info className="w-5 h-5 text-[#3F82FF] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/50 leading-relaxed">
                Images are saved into your local project uploads folder.
                Open the <span className="text-white italic">Display</span> page
                on this device to see the show.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
