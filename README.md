# My interactive portfolio

A drivable Three.js world with five portfolio destinations. Explore by car, drift, jump, discover projects, and find a few surprises along the way.

## Development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
npm test
npm run build
```

The `dist` directory is the deployable static site. Relative asset paths support both a domain root and GitHub Pages' `/a-portfolio/` path. Merging into `main` runs the existing GitHub Pages deployment.

## Controls

- WASD or arrow keys: drive
- J: jump; Shift: boost
- Hold Space near a destination: open its portfolio information
- C: camera; H: horn; M: map
- T / N: time of day / night mode
- R: radio; V: sound
- Escape: close portfolio information or settings

Touch devices have a joystick and boost, jump, and enter buttons. Destinations also provides direct navigation without driving. The game pauses while reading, changing settings, or viewing another tab. Browser zoom, keyboard focus, and reduced motion preferences are supported.

## Content and interface

Portfolio content lives in `js/portfolio-data.js`. The printable `resume.html` presents the supplied résumé without a city label. The original game's styles are in `css/styles.css`; `css/cockpit.css` provides the responsive cockpit design. No analytics service is used: existing discovery and score data stays in browser storage.

Ten regression tests cover input isolation, pause behavior, a single animation loop, reversible mute, input reset, unique HTML identifiers, atmosphere continuity, quality restoration, content, and bounded diagnostics. They do not replace a real WebGL playthrough on desktop and mobile hardware.

## World systems

- `js/environment.js`: smooth seven-minute atmosphere cycle, procedural water, stars, workshop landmarks, clear routes, and destination beacons.
- `js/quality.js`: reversible quality tiers, bounded device pixel ratio, shadow resolution, distance culling, and optional bloom/color grading. No motion blur or grain render passes.
- `js/touch-input.js`: analog pointer-captured steering, simultaneous boost/jump, cancellation recovery.
- `js/discoveries.js`: three optional field notes with a CI workflow illustration, authorization challenge, and radio discovery. Press F nearby, or use the on-screen action.
- `js/diagnostics.js`: bounded local frame-time history and interaction counts. Settings → Performance shows frame rate, p95 frame time, and draw calls. No analytics endpoint.
- `css/world.css`: responsive discovery/settings controls and comfort mode.

Physics runs at a fixed 60 Hz with capped catch-up. The renderer pauses in menus and hidden tabs. Comfort mode steadies the camera and disables decorative motion; volume and comfort preferences persist locally. The radio uses synthesized original music, with no streaming dependency.

## Performance and review

The stylized art uses lightweight geometry and procedural materials. The unused 1.09 MB brick image previously named `bark.jpg` is no longer bundled. Production game JavaScript is approximately 38 KB gzip and the Three.js vendor is 127 KB gzip; Vite still reports its 502 KB uncompressed vendor warning. Keeping the engine separate lets browsers cache it between content updates.

Targets for physical-device profiling: 16.7 ms median / 25 ms p95 frame time, fewer than 150 visible draw calls on low quality, and no growth in geometry/texture counts during repeated visits. These are budgets, not a promise of 60 fps on every device. The automated desktop browser sampled about 50 fps on low quality during review, with transition spikes; physical mobile GPU and sustained driving profiling remain necessary.

Browser review covered WebGL startup, destination/project navigation, workshop completion, settings, time selection, comfort mode, and the 390 × 844 layout. Node tests and production build pass. Keep the PR in draft until Keith reviews the private playable preview. GitHub Pages remains tied to merging `main`.
