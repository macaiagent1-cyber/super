import './styles.css';

const slice = import.meta.env.VITE_SUPER_SLICE || new URLSearchParams(window.location.search).get('slice') || 'S1A';

if (slice === 'S1B') {
  const { startS1B } = await import('./slices/s1b.js');
  await startS1B();
} else {
  const { startS1A } = await import('./slices/s1a.js');
  await startS1A();
}
