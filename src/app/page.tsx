// src/app/page.tsx
import type { Metadata } from 'next';
import RootPageClient from './RootPageClient';

export const metadata: Metadata = {
  title: 'Loading... | Your Site Name',
  description: 'Redirecting to your preferred language',
};

export default function RootPage() {
  return <RootPageClient />;
}
