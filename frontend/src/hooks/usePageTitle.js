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

  const langData = titles[pageKey]?.[lang] || titles[pageKey] || {};

  return {
    title:    langData.title    || defaults.title,
    subtitle: langData.subtitle || defaults.subtitle,
  };
}
