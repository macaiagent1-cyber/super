import { mountStyle } from './style-loader.js';

/**
 * DOM-based pause menu. Triggered by Escape key.
 * Provides: Resume, Settings (quality, mouse sensitivity, music volume), New Game (re-seed).
 */
export function createPauseMenu({
  root,
  initialSettings = {},
  onResume,
  onSetSeed,
  onSetQuality,
  onSetVolume,
  onSetSensitivity,
}) {
  const overlay = document.createElement('div');
  overlay.className = 'pause-overlay';
  overlay.style.display = 'none';
  const qualityOptions = ['low', 'medium', 'high', 'ultra'];
  const initialQuality = qualityOptions.includes(initialSettings.quality) ? initialSettings.quality : 'high';
  const initialSensitivity = numberOrDefault(initialSettings.mouseSensitivity, 1);
  const initialVolume = numberOrDefault(initialSettings.musicVolume, 0.5);

  const panel = document.createElement('div');
  panel.className = 'pause-panel';

  const title = document.createElement('h1');
  title.textContent = 'SUPER';
  title.className = 'pause-title';

  const subtitle = document.createElement('div');
  subtitle.className = 'pause-subtitle';
  subtitle.textContent = 'Paused';

  const settings = document.createElement('div');
  settings.className = 'pause-settings';

  const qualityRow = makeRow('Quality', qualityOptions, initialQuality, value => {
    onSetQuality?.(value);
  });
  const sensRow = makeSliderRow('Mouse Sensitivity', 0.2, 2.5, initialSensitivity, 0.1, value => {
    onSetSensitivity?.(value);
  });
  const volRow = makeSliderRow('Music Volume', 0, 1, initialVolume, 0.05, value => {
    onSetVolume?.(value);
  });

  settings.append(qualityRow, sensRow, volRow);

  const buttons = document.createElement('div');
  buttons.className = 'pause-buttons';

  const resumeBtn = document.createElement('button');
  resumeBtn.textContent = 'Resume';
  resumeBtn.className = 'pause-btn pause-btn-primary';
  resumeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    onResume?.();
  });

  const newGameBtn = document.createElement('button');
  newGameBtn.textContent = 'New Game';
  newGameBtn.className = 'pause-btn';
  newGameBtn.addEventListener('click', () => {
    onSetSeed?.(Math.floor(Math.random() * 1e9));
  });

  buttons.append(resumeBtn, newGameBtn);
  panel.append(title, subtitle, settings, buttons);
  overlay.append(panel);
  root.append(overlay);

  mountStyle('super-pause-style', `
    .pause-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(5,12,24,0.78); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
    .pause-panel { width: min(420px, 90vw); padding: 28px 32px; background: rgba(15,22,34,0.92); border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; color: #f4f7fb; font-family: ui-sans-serif, system-ui, sans-serif; }
    .pause-title { margin: 0; font-size: 3rem; letter-spacing: 0.04em; background: linear-gradient(135deg, #6fc3ff 0%, #a06bff 50%, #ff5ea8 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-align: center; }
    .pause-subtitle { text-align: center; opacity: 0.7; margin-bottom: 20px; font-size: 0.95rem; }
    .pause-settings { display: grid; gap: 14px; margin-bottom: 22px; }
    .pause-row { display: grid; gap: 6px; }
    .pause-row-label { font: 0.85rem ui-monospace, monospace; opacity: 0.85; }
    .pause-row-options { display: flex; gap: 6px; }
    .pause-row-options button { flex: 1; padding: 6px 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 4px; color: #f4f7fb; font: 0.8rem ui-monospace, monospace; cursor: pointer; }
    .pause-row-options button.active { background: rgba(100,180,255,0.35); border-color: rgba(100,180,255,0.7); }
    .pause-row input[type=range] { width: 100%; }
    .pause-buttons { display: grid; gap: 8px; }
    .pause-btn { padding: 10px 14px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.22); border-radius: 6px; color: #f4f7fb; font: 0.95rem ui-sans-serif, sans-serif; cursor: pointer; }
    .pause-btn:hover { background: rgba(255,255,255,0.14); }
    .pause-btn-primary { background: linear-gradient(135deg, #4af, #a06bff); border-color: rgba(160,107,255,0.5); }
  `);

  return {
    show() {
      overlay.style.display = 'flex';
    },
    hide() {
      overlay.style.display = 'none';
    },
    isVisible() {
      return overlay.style.display !== 'none';
    },
  };

  function makeRow(label, options, defaultValue, onChange) {
    const row = document.createElement('div');
    row.className = 'pause-row';
    const labelEl = document.createElement('div');
    labelEl.className = 'pause-row-label';
    labelEl.textContent = label;
    const optsEl = document.createElement('div');
    optsEl.className = 'pause-row-options';
    const btns = [];
    for (const opt of options) {
      const button = document.createElement('button');
      button.textContent = opt;
      if (opt === defaultValue) button.className = 'active';
      button.addEventListener('click', () => {
        for (const existing of btns) existing.classList.remove('active');
        button.classList.add('active');
        onChange?.(opt);
      });
      btns.push(button);
      optsEl.append(button);
    }
    row.append(labelEl, optsEl);
    return row;
  }

  function makeSliderRow(label, min, max, defaultValue, step, onChange) {
    const row = document.createElement('div');
    row.className = 'pause-row';
    const labelEl = document.createElement('div');
    labelEl.className = 'pause-row-label';
    labelEl.textContent = `${label}: ${defaultValue.toFixed(2)}`;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(defaultValue);
    input.addEventListener('input', () => {
      const value = Number(input.value);
      labelEl.textContent = `${label}: ${value.toFixed(2)}`;
      onChange?.(value);
    });
    row.append(labelEl, input);
    return row;
  }

  function numberOrDefault(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }
}
