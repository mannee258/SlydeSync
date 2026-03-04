"use client";

import React, { useEffect, useState } from "react";
import { loadImages, loadSettings } from "@/utils/storage";
import SlideshowPlayer from "@/components/SlideshowPlayer";
import { ArrowLeft, Maximize2 } from "lucide-react";

export default function DisplayPage() {
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const refreshData = async () => {
      setImages(await loadImages());
      setSettings(loadSettings());
    };

    refreshData();
    setMounted(true);

    window.addEventListener("focus", refreshData);
    return () => window.removeEventListener("focus", refreshData);
  }, []);

  if (!mounted || !settings) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="absolute top-6 left-6 z-[60] opacity-0 hover:opacity-100 transition duration-300">
        <a
          href="/admin"
          className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/60 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </a>
      </div>

      <div className="absolute top-6 right-6 z-[60] opacity-0 hover:opacity-100 transition duration-300">
        <button
          onClick={() => document.documentElement.requestFullscreen()}
          className="p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:bg-black/60 transition"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <SlideshowPlayer images={images} settings={settings} />

      <div className="absolute bottom-4 right-4 text-[10px] text-white/10 pointer-events-none uppercase tracking-[0.2em] font-medium text-white">
        SlideSync Display Mode
      </div>
    </div>
  );
}
