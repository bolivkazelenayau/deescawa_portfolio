// src/app/layout.tsx
import { ReactScan } from "@/components/ReactScan";
import React from "react";
import localFont from "next/font/local"
import "./[locale]/globals.css";
import { ThemeProvider } from "next-themes";
import { ScrollRestorationHandler } from "@/components/ScrollRestorationHandler";
import { ThemeMetaUpdater } from "@/components/theme_management/ThemeMetaUpdater";
import { VideoProvider } from "@/contexts/VideoContext";
import { Metadata, Viewport } from "next";
import { ConditionalLenis } from "@/components/ConditionalLenis";

const pretendard = localFont({
  src: "../fonts/Pretendard/variable/woff2/PretendardStdVariable.woff2",
  variable: '--font-pretendard',
  display: 'swap',
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={pretendard.variable}>
            {/* <ReactScan /> */}
      <body className="antialiased font-sans dark:bg-neutral-950" suppressHydrationWarning>
        <ConditionalLenis>
          <VideoProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem={true}
              disableTransitionOnChange={false}
              value={{
                dark: 'dark',
                light: 'light',
                system: 'system',
              }}>
              <ThemeMetaUpdater />
              <ScrollRestorationHandler locale={""} />
              {children}
            </ThemeProvider>
          </VideoProvider>
        </ConditionalLenis>
      </body>
    </html>
  );
}