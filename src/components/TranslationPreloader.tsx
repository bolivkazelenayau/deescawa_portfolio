// 'use client';

// import { useEffect } from 'react';
// import { preloadTranslation } from '@/hooks/useClientTranslation';

// const TranslationPreloader = () => {
//   useEffect(() => {
//     // Use the correct namespace names that exist in your translation files
//     const criticalNamespaces = ['hero', 'common'] as const; // Removed 'footer'
//     const locales = ['en', 'ru'] as const;
    
//     locales.forEach(locale => {
//       criticalNamespaces.forEach(namespace => {
//         preloadTranslation(locale, namespace);
//       });
//     });
//   }, []);

//   return null;
// };

// export default TranslationPreloader;
