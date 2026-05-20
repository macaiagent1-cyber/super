export function createDevConsole({ setQuality, setSeed, setBackend, setPerfCapture }) {
  return {
    execute(line) {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === 'quality' && parts[1]) {
        setQuality(parts[1]);
        return `quality ${parts[1]}`;
      }
      if (parts[0] === 'seed' && parts[1]) {
        const seed = Number(parts[1]);
        if (!Number.isInteger(seed)) return 'seed must be an integer';
        setSeed(seed);
        return `seed ${seed}`;
      }
      if (parts[0] === 'render' && parts[1] === 'backend' && parts[2]) {
        setBackend(parts[2]);
        return `render backend ${parts[2]}`;
      }
      if (parts[0] === 'perf' && parts[1] === 'capture' && parts[2]) {
        setPerfCapture(parts[2]);
        return `perf capture ${parts[2]}`;
      }
      return `unknown command: ${line}`;
    },
  };
}

export function attachDevConsole({ inputElement, outputElement, devConsole }) {
  inputElement.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const result = devConsole.execute(inputElement.value);
    outputElement.textContent = result;
    inputElement.value = '';
  });
}
