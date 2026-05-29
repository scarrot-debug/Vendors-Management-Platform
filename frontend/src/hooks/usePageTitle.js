import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import i18n from 'i18next';

let cache = null;

export function clearPageTitleCache() {
  cache = null;
}

export function usePageTitle(pageKey, defaults) {
  const [titles, setTitles] = useState(cache || {});
  const lang = i18n.language === 'he' ? 'he' : 'en';

  useEffect(() => {
    if (cache) { setTitles(cache); return; }
    api.getPageTitles().then(t => {
      cache = t || {};
      setTitles(cache);
    }).catch(() => {});
  }, []);

  const pageData = titles[pageKey];

  // Support both new format {en:{title,subtitle}, he:{title,subtitle}}
  // and old flat format {title, subtitle}
  let title, subtitle;
  if (pageData?.en || pageData?.he) {
    const langData = pageData[lang] || pageData['en'] || {};
    title    = langData.title    || defaults.title;
    subtitle = langData.subtitle || defaults.subtitle;
  } else {
    title    = pageData?.title    || defaults.title;
    subtitle = pageData?.subtitle || defaults.subtitle;
  }

  return { title, subtitle };
}
