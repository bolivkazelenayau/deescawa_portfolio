// src/app/layout.tsx
import { ReactScan } from "@/components/ReactScan";
import React from "react";
import localFont from "next/font/local"
import "./[locale]/globals.css";
import { ThemeProvider } from "next-themes";
import { ScrollRestorationHandler } from "@/components/ScrollRestorationHandler";
import { ReactLenis } from "@/lib/lenis"
import { ThemeMetaUpdater } from "@/components/theme_management/ThemeMetaUpdater";
import { VideoProvider } from "@/contexts/VideoContext";

const pretendard = localFont({
  src: "../fonts/Pretendard/variable/woff2/PretendardStdVariable.woff2",
  variable: '--font-pretendard',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={pretendard.variable}>
      <body className="antialiased font-sans dark:bg-neutral-950" suppressHydrationWarning>
        {/* <ReactScan /> */}
        <ReactLenis root>
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
        </ReactLenis>
      </body>
    </html>
  );
}
