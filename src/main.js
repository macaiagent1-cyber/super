import './styles.css';

const slice = import.meta.env.VITE_SUPER_SLICE || new URLSearchParams(window.location.search).get('slice') || 'S1A';

document.body.dataset.slice = slice;
document.getElementById('hud-root').textContent = `Super ${slice} booting`;
