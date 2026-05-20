import { startS1A } from './s1a.js';

export async function startS1B() {
  await startS1A();
}
