import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
import { GlobalAssistant } from "@/components/studio/GlobalAssistant";
import { ThemeProvider } from "@/components/studio/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "EMY Studio — DJ Emy",
  description: "Master your mixes, design covers, package releases. Your whole production studio — laptop and phone, offline and online.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "EMY Studio" },
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a0f] text-zinc-100 antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          {children}
          <PwaRegister />
          <GlobalAssistant />
          <ThemeProvider />
        </ErrorBoundary>
      </body>
    </html>
  );
}
