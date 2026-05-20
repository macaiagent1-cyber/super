import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('project scaffold', () => {
  it('has the Vite browser entry files', () => {
    expect(fs.existsSync('package.json')).toBe(true);
    expect(fs.existsSync('vite.config.js')).toBe(true);
    expect(fs.existsSync('index.html')).toBe(true);
    expect(fs.existsSync('src/main.js')).toBe(true);
  });
});
