"use client";

import { Settings, Play, Image as ImageIcon } from "lucide-react";
import "./globals.css";

export default function AppLayout({ children }) {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const isDisplay = pathname === "/display";

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-[#0F1117] text-white font-sans flex flex-col">
          {!isDisplay && (
            <header className="border-b border-[#1C222B] bg-[#0C1016]/80 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#3F82FF] rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="font-bold text-lg tracking-tight">
                    SlideSync MVP
                  </span>
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
          )}

          <main
            className={`flex-1 ${!isDisplay ? "max-w-7xl mx-auto w-full p-4 md:p-8" : ""}`}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
