import React, { ReactNode } from 'react'

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