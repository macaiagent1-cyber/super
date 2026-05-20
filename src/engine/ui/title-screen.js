/**
 * Click-to-play splash screen. Shows once on first load.
 * Required for browser autoplay (audio context must unlock on user gesture).
 */
export function createTitleScreen({ root, onStart }) {
  let shown = true;

  const overlay = document.createElement('div');
  overlay.className = 'title-overlay';

  const card = document.createElement('div');
  card.className = 'title-card';

  const title = document.createElement('h1');
  title.textContent = 'SUPER';
  title.className = 'title-h1';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Open-world flying superhero';
  subtitle.className = 'title-sub';

  const controls = document.createElement('div');
  controls.className = 'title-controls';
  const lines = [
    ['WASD + mouse', 'Fly with banking'],
    ['Shift', 'Boost'],
    ['Left click', 'Punch'],
    ['E (hold)', 'Heat vision'],
    ['F or RMB', 'Grab + throw'],
    ['Space / Q / R', 'Dodge / dash'],
    ['Escape', 'Pause + settings'],
    ['~ (backtick)', 'Dev console'],
  ];
  for (const [key, desc] of lines) {
    const row = document.createElement('div');
    row.className = 'title-control-row';
    const k = document.createElement('span');
    k.className = 'title-key';
    k.textContent = key;
    const d = document.createElement('span');
    d.className = 'title-desc';
    d.textContent = desc;
    row.append(k, d);
    controls.append(row);
  }

  const playBtn = document.createElement('button');
  playBtn.textContent = 'CLICK TO PLAY';
  playBtn.className = 'title-play';
  playBtn.addEventListener('click', () => {
    shown = false;
    overlay.style.display = 'none';
    onStart?.();
  });

  card.append(title, subtitle, controls, playBtn);
  overlay.append(card);
  root.append(overlay);

  const style = document.createElement('style');
  style.textContent = `
    .title-overlay { position: fixed; inset: 0; z-index: 999; background: radial-gradient(ellipse at center, #1a2240 0%, #050811 70%); display: flex; align-items: center; justify-content: center; }
    .title-card { width: min(540px, 92vw); padding: 36px 40px; background: rgba(15,22,34,0.92); border: 1px solid rgba(255,255,255,0.18); border-radius: 14px; color: #f4f7fb; font-family: ui-sans-serif, system-ui, sans-serif; text-align: center; box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
    .title-h1 { margin: 0 0 4px; font-size: clamp(3.5rem, 10vw, 5rem); letter-spacing: 0.05em; background: linear-gradient(135deg, #6fc3ff 0%, #a06bff 50%, #ff5ea8 100%); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800; }
    .title-sub { margin: 0 0 24px; opacity: 0.72; font-size: 1.05rem; }
    .title-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; margin-bottom: 24px; text-align: left; font: 0.85rem ui-monospace, monospace; }
    .title-key { color: #6fc3ff; }
    .title-desc { opacity: 0.85; margin-left: 8px; }
    .title-play { padding: 14px 24px; font: 700 1.05rem ui-sans-serif, sans-serif; background: linear-gradient(135deg, #4af 0%, #a06bff 100%); border: none; color: white; border-radius: 8px; cursor: pointer; letter-spacing: 0.05em; box-shadow: 0 8px 24px rgba(80,140,255,0.4); }
    .title-play:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(80,140,255,0.55); }
  `;
  document.head.appendChild(style);

  return {
    hide() {
      shown = false;
      overlay.style.display = 'none';
    },
    show() {
      shown = true;
      overlay.style.display = 'flex';
    },
    isShown() {
      return shown;
    },
  };
}
