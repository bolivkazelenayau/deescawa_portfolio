// layout.tsx
import { ReactScan } from "@/components/ReactScan";
import React from "react";
import { Metadata, Viewport } from "next";
import localFont from "next/font/local"
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ScrollRestorationHandler } from "@/components/ScrollRestorationHandler";
import { ReactLenis } from "@/lib/lenis"
import i18nConfig from "@/i18nconfig";
import { ClientLayout } from "@/components/ui/header_nav/ClientLayout";
import { ThemeMetaUpdater } from "@/components/theme_management/ThemeMetaUpdater";
import { VideoProvider } from "@/contexts/VideoContext";

const pretendard = localFont({
  src: "../../fonts/Pretendard/variable/woff2/PretendardStdVariable.woff2",
  variable: '--font-pretendard',
  display: 'swap',
});

// Convert static metadata to dynamic based on locale
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === 'en' ? "Deescawa | Main" : "Deescawa | Главная",
    description: locale === 'en' ? "Sound designer" : "Звуковой дизайнер",
    keywords: ["sound design", "audio", "music"],
    authors: [{ name: "Lev Deescawa" }],
    robots: "index, follow",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Deescawa",
    },
  };
}

export const generateViewport = (): Viewport => {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  };
};

// Generate static params for all supported locales
export function generateStaticParams() {
  return i18nConfig.locales.map(locale => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning className={pretendard.variable}>
      {/* <ReactScan /> */}

      <ReactLenis root>
        <body className="antialiased font-sans dark:bg-neutral-950" suppressHydrationWarning>
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
              <ClientLayout locale={locale as 'en' | 'ru'}>
                {children}
              </ClientLayout>
            </ThemeProvider>
          </VideoProvider>
        </body>
      </ReactLenis>
    </html>
  );
}
