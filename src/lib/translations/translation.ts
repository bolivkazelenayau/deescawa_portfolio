// lib/translations/translation.ts
import en_hero from '../../locales/en/en_hero.json';
import ru_hero from '../../locales/ru/ru_hero.json';
import en_common from '../../locales/en/en_common.json';
import ru_common from '../../locales/ru/ru_common.json';
import en_projects from '../../locales/en/en_projects.json';
import ru_projects from '../../locales/ru/ru_projects.json';
import en_lectures from '../../locales/en/en_lectures.json';
import ru_lectures from '../../locales/ru/ru_lectures.json';
import en_events from '../../locales/en/en_events.json';
import ru_events from '../../locales/ru/ru_events.json';
import en_music from '../../locales/en/en_music.json';
import ru_music from '../../locales/ru/ru_music.json';

// Fix the interface to match your actual structure
interface NamespaceTranslations {
  hero: typeof en_hero;
  common: typeof en_common;
  projects: typeof en_projects;
  lectures: typeof en_lectures;  
  events: typeof en_events;  
  music: typeof en_music;    
}

interface Translations {
  en: NamespaceTranslations;
  ru: NamespaceTranslations;
}

const translations = {
  en: {
    hero: en_hero,
    common: en_common,
    projects: en_projects,
    lectures: en_lectures,
    events: en_events,
    music: en_music,
  },
  ru: {
    hero: ru_hero,
    common: ru_common,
    projects: ru_projects,
    lectures: ru_lectures,
    events: ru_events,
    music: ru_music,
  }
};

export default translations;
