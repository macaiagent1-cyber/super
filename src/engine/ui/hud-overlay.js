/**
 * DOM-based HUD: health bar, energy bar, minimap canvas, reticle.
 * Updated each frame from S1B render loop.
 */
export function createHudOverlay({ root }) {
  // Health bar
  const healthRoot = document.createElement('div');
  healthRoot.className = 'hud-bar hud-bar-health';
  const healthLabel = document.createElement('div');
  healthLabel.className = 'hud-bar-label';
  healthLabel.textContent = 'HP';
  const healthFill = document.createElement('div');
  healthFill.className = 'hud-bar-fill';
  healthRoot.append(healthLabel, healthFill);

  // Energy bar
  const energyRoot = document.createElement('div');
  energyRoot.className = 'hud-bar hud-bar-energy';
  const energyLabel = document.createElement('div');
  energyLabel.className = 'hud-bar-label';
  energyLabel.textContent = 'ENERGY';
  const energyFill = document.createElement('div');
  energyFill.className = 'hud-bar-fill';
  energyRoot.append(energyLabel, energyFill);

  // Minimap
  const minimapWrap = document.createElement('div');
  minimapWrap.className = 'hud-minimap';
  const minimap = document.createElement('canvas');
  minimap.width = 160;
  minimap.height = 160;
  minimapWrap.appendChild(minimap);
  const ctx = minimap.getContext('2d');

  // Reticle (center)
  const reticle = document.createElement('div');
  reticle.className = 'hud-reticle';

  // Container at bottom-right (HUD), reticle at center
  const container = document.createElement('div');
  container.className = 'hud-container';
  container.append(healthRoot, energyRoot, minimapWrap);

  root.append(container, reticle);

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    .hud-container { position: fixed; right: 16px; bottom: 16px; display: grid; gap: 10px; z-index: 100; pointer-events: none; }
    .hud-bar { width: 220px; height: 18px; border-radius: 5px; background: rgba(5,12,24,0.65); border: 1px solid rgba(255,255,255,0.18); position: relative; overflow: hidden; }
    .hud-bar-label { position: absolute; top: 1px; left: 8px; right: 8px; font: 11px ui-monospace, monospace; color: rgba(255,255,255,0.85); z-index: 2; }
    .hud-bar-fill { height: 100%; background: linear-gradient(90deg, #ff5050 0%, #ff8080 100%); transition: width 0.1s ease-out; }
    .hud-bar-energy .hud-bar-fill { background: linear-gradient(90deg, #4af5ff 0%, #80ddff 100%); }
    .hud-minimap { width: 160px; height: 160px; border-radius: 8px; background: rgba(5,12,24,0.7); border: 1px solid rgba(255,255,255,0.18); overflow: hidden; }
    .hud-reticle { position: fixed; left: 50%; top: 50%; width: 16px; height: 16px; margin-left: -8px; margin-top: -8px; border: 1.5px solid rgba(255,255,255,0.7); border-radius: 50%; pointer-events: none; box-shadow: 0 0 8px rgba(0,0,0,0.6); z-index: 99; }
  `;
  document.head.appendChild(style);

  return {
    update({ hp, hpMax, energy, energyMax, heroPos, threats, cars }) {
      healthFill.style.width = `${Math.max(0, (hp / hpMax) * 100)}%`;
      energyFill.style.width = `${Math.max(0, (energy / energyMax) * 100)}%`;

      // Minimap
      ctx.clearRect(0, 0, 160, 160);
      // Background grid
      ctx.fillStyle = 'rgba(40, 60, 80, 0.4)';
      ctx.fillRect(0, 0, 160, 160);
      // Grid lines representing roads
      ctx.strokeStyle = 'rgba(140, 160, 200, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const z of [-1, 0, 1]) {
        const px = 80 + z * 40;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, 160);
      }
      for (const x of [-1, 0, 1]) {
        const py = 80 + x * 40;
        ctx.moveTo(0, py);
        ctx.lineTo(160, py);
      }
      ctx.stroke();

      // Range: +/-160 world units -> 160px
      const worldToMap = 0.5;
      function plot(x, z, color, size) {
        const mx = 80 + (x - heroPos.x) * worldToMap;
        const mz = 80 + (z - heroPos.z) * worldToMap;
        ctx.fillStyle = color;
        ctx.fillRect(mx - size / 2, mz - size / 2, size, size);
      }

      // Threats (red)
      for (const t of threats || []) {
        if (!t.dead) plot(t.mesh.position.x, t.mesh.position.z, '#ff3030', 4);
      }
      // Cars (yellow)
      for (const c of cars || []) {
        const tt = c.body?.translation?.() || c.mesh?.position;
        if (tt) plot(tt.x, tt.z, '#ffd060', 3);
      }
      // Hero (blue cross at center)
      ctx.fillStyle = '#3da6ff';
      ctx.fillRect(78, 78, 4, 4);
    },
  };
}
