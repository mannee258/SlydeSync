import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata = {
  title: "SlydeSync",
  description: "Slideshow sync and control",
};

export default function AppLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-[#0F1117] text-white font-sans flex flex-col">
          <NavBar />
          <main className="flex-1">
              <div className="max-w-[1152px] mx-auto w-full px-6 py-8 md:px-10 md:py-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
