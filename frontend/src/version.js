const BUILD_DATE = new Date().toISOString().slice(0,10).replace(/-/g,'');
export const VERSION = `v${BUILD_DATE}`;
