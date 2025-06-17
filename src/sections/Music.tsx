// sections/Music.tsx
"use client"

import MusicSection from "@/components/music/MusicSection"

type MusicProps = {
  locale: 'en' | 'ru';
};

const Music = ({ locale }: MusicProps) => {
  return <MusicSection locale={locale} />
}

export default Music
