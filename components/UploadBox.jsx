"use client";

import React, { useRef, useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { uploadImages } from "@/utils/storage";

export default function UploadBox({ onAddImages }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e) {
    setError("");
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded = await uploadImages(files);
      onAddImages(uploaded);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err?.message || "Upload failed. Try smaller images.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div
        onClick={() => !busy && inputRef.current?.click()}
        className={`border-2 border-dashed border-[#242A34] rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition hover:border-[#3F82FF] hover:bg-white/5 ${
          busy ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <div className="w-12 h-12 bg-[#1B1F27] rounded-full flex items-center justify-center">
          <Upload className="w-6 h-6 text-[#3F82FF]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">
            Click to upload images
          </p>
          <p className="text-xs text-white/40">
            PNG, JPG or WEBP (Max 15MB total per upload)
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={busy}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <p className="text-xs text-white/30 italic">
        Uploaded images are stored in the project's local uploads folder.
      </p>
    </div>
  );
}
