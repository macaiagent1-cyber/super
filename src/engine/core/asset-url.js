// Build an asset URL that respects Vite's `base` config across all hosts:
//   root-served (Vercel/Netlify/local):  BASE_URL='/'    → '/assets/x'
//   path-served (GitHub Pages /super/):  BASE_URL='/super' or '/super/' → '/super/assets/x'
//
// Vite normally guarantees BASE_URL ends with '/', but when `base` is set via
// an env var (process.env.SUPER_BASE_PATH) the value can be passed through
// without normalization. Strip any trailing slash, prepend '/' to the path
// fragment, and join — always exactly one slash between them.
export function assetUrl(pathFromAssets) {
  const baseRaw = import.meta.env.BASE_URL || '/';
  const base = baseRaw.replace(/\/+$/, '');
  const path = pathFromAssets.replace(/^\/+/, '');
  return `${base}/${path}`;
}
