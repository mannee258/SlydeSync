"use client";

import React, { useEffect, useMemo, useState } from "react";

function shuffledCopy(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SlideshowPlayer({ images, settings }) {
  const playlist = useMemo(() => {
    const base = images || [];
    return settings.shuffle ? shuffledCopy(base) : base;
  }, [images, settings.shuffle]);

  const [index, setIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!playlist.length) return;
    const t = setInterval(
      () => {
        setIndex((prev) => (prev + 1) % playlist.length);
        setFadeKey((k) => k + 1);
      },
      Math.max(500, settings.intervalMs || 3000),
    );
    return () => clearInterval(t);
  }, [playlist.length, settings.intervalMs]);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const safeIndex = playlist.length ? Math.min(index, playlist.length - 1) : 0;
  const current = playlist[safeIndex];

  if (!playlist.length) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-white/40">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
          <span className="text-2xl">📸</span>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-white/60">
            No images to display
          </p>
          <p className="text-sm">Upload some photos in the Admin panel</p>
        </div>
      </div>
    );
  }

  const useFade = settings.transition === "fade";

  return (
    <div className="h-full w-full bg-black relative overflow-hidden flex items-center justify-center">
      <img
        key={useFade ? fadeKey : "static"}
        src={current.url}
        alt={current.name}
        className="w-full h-full block"
        style={{
          objectFit: settings.fitMode || "contain",
          animation: useFade ? "slideshowFadeIn 0.8s ease-in-out" : "none",
        }}
      />

      {settings.showCaptions && (
        <div className="absolute bottom-10 left-10 max-w-[80%]">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-2xl">
            <h4 className="text-white font-medium text-lg truncate">
              {current.name}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-white/40 uppercase tracking-widest font-bold">
                Slide {safeIndex + 1} of {playlist.length}
              </span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-xs text-white/40">
                {settings.intervalMs / 1000}s auto-advance
              </span>
            </div>
          </div>
        </div>
      )}

      {!isFullscreen && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div
            key={fadeKey}
            className="h-full bg-[#3F82FF] shadow-[0_0_10px_#3F82FF]"
            style={{
              animation: `slideshowProgress ${settings.intervalMs}ms linear forwards`,
            }}
          />
        </div>
      )}

    </div>
  );
}
