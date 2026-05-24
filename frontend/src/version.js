const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
const BUILD_DATE = now.toISOString().slice(0,10).replace(/-/g,'');
const BUILD_TIME = now.toISOString().slice(11,16).replace(':','');
export const VERSION = `v${BUILD_DATE}.${BUILD_TIME}`;
