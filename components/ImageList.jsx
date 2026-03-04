"use client";

import React from "react";
import { Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";

export default function ImageList({ images, onDelete, onMove, onClearAll }) {
  if (!images.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/40 gap-3 border border-[#1C222B] rounded-xl bg-[#0C1016]">
        <ImageIcon className="w-8 h-8 opacity-20" />
        <p className="text-sm">No images in your queue yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-white/70">
          Queue ({images.length})
        </h3>
        <button
          onClick={onClearAll}
          className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1 hover:bg-red-400/10 rounded"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="flex items-center gap-4 p-3 bg-[#1B1F27] border border-[#242A34] rounded-xl group transition hover:border-[#3F82FF]/50"
          >
            <div className="relative w-20 h-12 flex-shrink-0">
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover rounded-lg shadow-sm"
              />
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-[#3F82FF] rounded-full flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {img.name}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider font-semibold">
                {new Date(img.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => onMove(img.id, "up")}
                disabled={idx === 0}
                className="p-1.5 hover:bg-white/10 rounded-md text-white/60 disabled:opacity-20"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onMove(img.id, "down")}
                disabled={idx === images.length - 1}
                className="p-1.5 hover:bg-white/10 rounded-md text-white/60 disabled:opacity-20"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(img.id)}
                className="p-1.5 hover:bg-red-400/10 text-red-400 rounded-md ml-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
