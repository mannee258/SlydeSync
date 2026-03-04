"use client";

import React from "react";
import { Timer, Maximize, Layout, Shuffle, Type } from "lucide-react";

export default function SettingsPanel({ settings, onChange }) {
  function patch(p) {
    onChange({ ...settings, ...p });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
            <Timer className="w-4 h-4" />
            Interval (ms)
          </label>
          <input
            type="number"
            min={500}
            step={100}
            value={settings.intervalMs}
            onChange={(e) => patch({ intervalMs: Number(e.target.value) })}
            className="w-full bg-[#1B1F27] border border-[#242A34] text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3F82FF] outline-none"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
            <Layout className="w-4 h-4" />
            Transition
          </label>
          <select
            value={settings.transition}
            onChange={(e) => patch({ transition: e.target.value })}
            className="w-full bg-[#1B1F27] border border-[#242A34] text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3F82FF] outline-none"
          >
            <option value="fade">Fade</option>
            <option value="none">None</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
            <Maximize className="w-4 h-4" />
            Fit mode
          </label>
          <select
            value={settings.fitMode}
            onChange={(e) => patch({ fitMode: e.target.value })}
            className="w-full bg-[#1B1F27] border border-[#242A34] text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3F82FF] outline-none"
          >
            <option value="contain">Contain (Original Aspect)</option>
            <option value="cover">Cover (Full Screen Crop)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
        <label className="flex items-center justify-between p-3 bg-[#1B1F27] border border-[#242A34] rounded-xl cursor-pointer hover:bg-[#242A34] transition">
          <div className="flex items-center gap-3">
            <Shuffle className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/80">Shuffle Playback</span>
          </div>
          <input
            type="checkbox"
            checked={settings.shuffle}
            onChange={(e) => patch({ shuffle: e.target.checked })}
            className="w-4 h-4 accent-[#3F82FF]"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-[#1B1F27] border border-[#242A34] rounded-xl cursor-pointer hover:bg-[#242A34] transition">
          <div className="flex items-center gap-3">
            <Type className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/80">Show Captions</span>
          </div>
          <input
            type="checkbox"
            checked={settings.showCaptions}
            onChange={(e) => patch({ showCaptions: e.target.checked })}
            className="w-4 h-4 accent-[#3F82FF]"
          />
        </label>
      </div>
    </div>
  );
}
