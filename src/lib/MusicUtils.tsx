// utils/musicUtils.ts
import type { ReactNode } from 'react'
import { BREAKPOINTS } from '@/lib/MusicData'

export const getSlidesToShow = (width: number): number => {
  if (width >= BREAKPOINTS.lg) return 3
  if (width >= BREAKPOINTS.sm) return 2
  return 1
}

export const renderTextWithFragments = (text: string | ReactNode): ReactNode => {
  if (typeof text !== 'string') return text

  const parts = text.split('\n')
  if (parts.length === 1) return text

  return parts.map((part, index) => (
    <span key={index}>
      {part}
      {index < parts.length - 1 && <br />}
    </span>
  ))
}
