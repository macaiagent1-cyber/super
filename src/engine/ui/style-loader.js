// Idempotent stylesheet mounter. Without this, every call to createHud() /
// createPauseMenu() / createTitleScreen() appends a fresh <style> block to
// <head> even if the same module already mounted one — which leaked DOM on
// any soft-restart path. Use a stable id per stylesheet and bail if it
// already exists.
export function mountStyle(id, css) {
  if (typeof document === 'undefined') return null;
  if (document.getElementById(id)) return document.getElementById(id);
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}
