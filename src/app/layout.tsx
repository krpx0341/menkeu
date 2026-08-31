import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { AdvisorPanel } from "@/components/advisor/AdvisorPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Menkeu",
  description: "Personal finance tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <TopNav />
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
        <BottomNav />
        <AdvisorPanel />
      </body>
    </html>
  );
}
