"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_FOLDER,
  loadActiveFolder,
  loadImages,
  loadSettings,
} from "@/utils/storage";
import SlideshowPlayer from "@/components/SlideshowPlayer";
import { Maximize2 } from "lucide-react";

export default function DisplayPage() {
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const activeFolderRef = useRef(DEFAULT_FOLDER);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const refreshData = useCallback(async (folderOverride) => {
    const folder = folderOverride || (await loadActiveFolder());
    activeFolderRef.current = folder;
    setImages(await loadImages(folder));
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refreshData();
    });

    window.addEventListener("focus", refreshData);
    return () => window.removeEventListener("focus", refreshData);
  }, [refreshData]);

  useEffect(() => {
    const onStorage = (e) => {
      if (
        e.key === "mvp_slideshow_images_updated_at" ||
        e.key === "mvp_slideshow_active_folder_updated_at"
      ) {
        refreshData();
      }
    };

    let channel = null;
    const onChannelMessage = (event) => {
      if (event?.data?.type === "active-folder-updated") {
        const nextFolder = event?.data?.folder;
        refreshData(nextFolder);
        return;
      }
      if (event?.data?.type === "images-updated") {
        const folder = event?.data?.folder || DEFAULT_FOLDER;
        if (folder !== activeFolderRef.current) {
          return;
        }
        if (Array.isArray(event.data.images)) {
          setImages(event.data.images);
        } else {
          refreshData(folder);
        }
      }
    };

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("slydesync_updates");
      channel.addEventListener("message", onChannelMessage);
    }

    const pollId = setInterval(refreshData, 1500);
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(pollId);
      window.removeEventListener("storage", onStorage);
      if (channel) {
        channel.removeEventListener("message", onChannelMessage);
        channel.close();
      }
    };
  }, [refreshData]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    onFullscreenChange();
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      return;
    }
    await document.documentElement.requestFullscreen?.();
  };

  useEffect(() => {
    const hideDelayMs = 2000;

    const showControlsTemporarily = () => {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, hideDelayMs);
    };

    showControlsTemporarily();
    window.addEventListener("mousemove", showControlsTemporarily);

    return () => {
      window.removeEventListener("mousemove", showControlsTemporarily);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!settings) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      <SlideshowPlayer images={images} settings={settings} />

      <button
        onClick={toggleFullscreen}
        className={`absolute bottom-4 right-4 z-60 p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:bg-black/60 transition duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <div className="absolute bottom-4 right-16 text-[10px] text-white/10 pointer-events-none uppercase tracking-[0.2em] font-medium">
        SlideSync Display Mode
      </div>
    </div>
  );
}
