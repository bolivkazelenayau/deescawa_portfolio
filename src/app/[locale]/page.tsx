// src/app/[locale]/page.tsx

import Hero from "@/sections/Hero";
import Projects from "@/sections/Projects";
import Footer from "@/sections/Footer";
import Lectures from "@/sections/Lectures";
import EventsServerWrapper from "@/components/EventsServerWrapper";
import Music from "@/sections/Music";

export default async function Home({
  params
}: {
  params: Promise<{ locale: 'en' | 'ru' }>
}) {
  const { locale } = await params;

  return (
    <>
      <Hero locale={locale} /> 
      <Projects locale={locale} />
      <Lectures locale={locale} />
      <EventsServerWrapper locale={locale} />
      <Music locale={locale}/>
      {/* <Footer locale={locale} /> */}
    </>
  );
}
