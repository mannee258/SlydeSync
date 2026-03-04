"use client";

import { useEffect } from "react";

export default function RootPage() {
  useEffect(() => {
    window.location.href = "/admin";
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-[#3F82FF] rounded-xl flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white/40 text-sm font-medium tracking-widest uppercase">
          Initializing
        </p>
      </div>
    </div>
  );
}
