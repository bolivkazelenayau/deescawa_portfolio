// src/app/RootPageClient.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPageClient() {
  const router = useRouter();

  useEffect(() => {
    const savedLocale = localStorage.getItem('preferred-locale');
    
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'ru')) {
      router.push(`/${savedLocale}`);
      return;
    }

    const browserLocale = navigator.language.startsWith('ru') ? 'ru' : 'en';
    localStorage.setItem('preferred-locale', browserLocale);
    router.push(`/${browserLocale}`);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
