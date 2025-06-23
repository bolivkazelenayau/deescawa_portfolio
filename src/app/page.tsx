// src/app/page.tsx
import type { Metadata } from 'next';
import RootPageClient from './RootPageClient';

export const metadata: Metadata = {
  title: 'Loading... | Deescawa',
  description: 'Redirecting to your preferred language',
};

export default function RootPage() {
  return <RootPageClient />;
}
