# Super

A 3D open-world flying superhero browser game.

Built with Three.js (WebGPU + WebGL2 fallback) + Vite + Rapier physics.

## Run

```bash
npm install
npm run dev        # http://127.0.0.1:5173/?slice=S1A  (vertical slice)
npm run dev:slice  # http://127.0.0.1:5174/?slice=S1B  (full city + combat)
npm test
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

## License

CC0 / MIT mixed (Poly Haven HDRI is CC0; project code is MIT-equivalent personal project).
