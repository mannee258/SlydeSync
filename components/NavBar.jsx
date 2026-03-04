"use client";

import { usePathname } from "next/navigation";
import { Settings, Play, Image as ImageIcon } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#1C222B] bg-[#0C1016]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1152px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3F82FF] rounded-lg flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SlydeSync</span>
        </div>

        <nav className="flex items-center gap-1">
          <a
            href="/admin"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              pathname === "/admin"
                ? "bg-[#3F82FF] text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4" />
            Admin
          </a>
          <a
            href="/display"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              pathname === "/display"
                ? "bg-[#3F82FF] text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Display
          </a>
        </nav>
      </div>
    </header>
  );
}
