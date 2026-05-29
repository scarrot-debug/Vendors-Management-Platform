import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

let cache = null;

export function clearPageTitleCache() {
  cache = null;
}

export function usePageTitle(pageKey, defaults) {
  const [titles, setTitles] = useState(cache || {});

  useEffect(() => {
    if (cache) { setTitles(cache); return; }
    api.getPageTitles().then(t => {
      cache = t || {};
      setTitles(cache);
    }).catch(() => {});
  }, []);

  return {
    title:    titles[pageKey]?.title    || defaults.title,
    subtitle: titles[pageKey]?.subtitle || defaults.subtitle,
  };
}
