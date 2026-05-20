# Super

A 3D open-world flying superhero browser game.

**▶ Play live: https://macaiagent1-cyber.github.io/super/?slice=S1B&seed=42**

Built with Three.js (WebGPU + WebGL2 fallback) + Vite + Rapier physics + Howler audio.

## Run locally

```bash
npm install
npm run dev        # http://127.0.0.1:5173/?slice=S1A  (vertical slice)
npm run dev:slice  # http://127.0.0.1:5174/?slice=S1B  (full city + combat)
npm test           # unit tests (Vitest)
npm run test:smoke # Playwright smoke tests
```

## Deploy

The repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds + publishes to GitHub Pages on every push to `main`/`master`. Vite's
`base` is configurable via the `SUPER_BASE_PATH` env var so the same build
works on root-served hosts (Vercel/Netlify/Cloudflare Pages) and path-served
hosts (GitHub Pages: `/<repo>/`). For a one-off Vercel deploy:

```bash
npm run build
npx vercel --prod dist
```

## Controls

- WASD + mouse — fly with banking
- Shift — boost
- Left click — punch
- E (hold) — heat vision
- F or RMB — grab + throw
- Space / Q / R — dodge
- Escape — pause + settings
- ~ (backtick) — dev console

## Milestones

- M1 vertical slice — engine + city + flight
- M2 hero polish — rigged humanoid + cape + lighting
- M3 combat — Rapier physics + punch + heat vision + grab + dodge + destructibles
- M4 life — civilians + traffic + drone threats + procedural audio
- M5 ship polish — HUD + pause menu + save + title + gamepad

## Credits

- HDRI sky — *Belfast Sunset (Pure Sky)* by Greg Zaal / Poly Haven — **CC0**
- Music — *"Heroic Age"* by Kevin MacLeod (incompetech.com) — licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Physics — Rapier 3D (Apache-2.0) by Sébastien Crozet
- Rendering — Three.js (MIT) — WebGPU + WebGL2 backends
- Audio — Howler.js (MIT)
- All meshes, materials, shaders, and gameplay code in `src/` are original/procedural

## License

Project source code: MIT-equivalent personal project. Third-party assets retain their original licenses (see Credits).
