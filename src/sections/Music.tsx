// sections/Music.tsx
"use client"

import { memo } from 'react'
import MusicSection from "@/components/music/MusicSection"

interface MusicProps {
  locale: 'en' | 'ru';
}

const Music = memo<MusicProps>(({ locale }) => {
  return <MusicSection locale={locale} />
})

Music.displayName = 'Music'

export default Music
