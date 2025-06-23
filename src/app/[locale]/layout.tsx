// src/app/[locale]/layout.tsx
import i18nConfig from "@/i18nconfig";
import { ClientLayout } from "@/components/ui/header_nav/ClientLayout";
import { Metadata, Viewport } from "next";

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

export function generateStaticParams() {
  return i18nConfig.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ClientLayout locale={locale as 'en' | 'ru'}>
      {children}
    </ClientLayout>
  );
}
