// page.tsx

import Hero from "@/sections/Hero";
import Projects from "@/sections/Projects";
import Footer from "@/sections/Footer";
import Lectures from "@/sections/Lectures";
import Events from "@/sections/Events";
import Music from "@/sections/Music";
import { getEventsTranslations } from "@/lib/events/Translations";

// page.tsx
export default async function Home({ 
  params 
}: { 
  params: Promise<{ locale: 'en' | 'ru' }> 
}) {
  const { locale } = await params;

  const eventsTranslations = await getEventsTranslations(locale);

  return (
    <>
      <Hero locale={locale} /> 
      <Projects locale={locale} />
      <Lectures locale={locale} />
<Events 
        locale={locale} 
        serverTranslations={eventsTranslations} 
      />
      <Music
      locale={locale}/>
      <Footer locale={locale} />
    </>
  );
}
