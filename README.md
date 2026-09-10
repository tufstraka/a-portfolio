# Keith Kadima's interactive portfolio

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

## Rally car and meadow art pass

The vehicle is now an original compact rally wagon, with rounded tangerine bodywork, cream trim, blue glazing, roof rack/spare, numbered door panels, and treaded wheels. Static body geometry is merged by material; steering pivots and wheel rotation are separate. The existing driving footprint is preserved.

`js/surface-materials.js` shares small 256 × 256 procedural color/height maps for wood, stone, plaster, painted steel, rubber, and foliage. Maps use mipmaps, capped anisotropy, and separate color-space handling for color versus height data. Breaking crates preserves shared materials instead of disposing surfaces still used elsewhere.

`js/grass.js` adds twelve meadow clusters using two instanced draws: ground cover and tapered grass blades. Density scales from 1,800 clumps on low to 7,600 on ultra. Placement excludes roads, the pond, and destination entrances. Comfort mode disables wind. Ground-cover lighting and the pond shader support the renderer’s logarithmic depth buffer.

Art-pass validation: 12 tests cover the existing interactions plus grass placement exclusions, the vehicle footprint, body draw count, and independent wheel pivots. Browser visual review covers the new vehicle, lit ground cover, foliage, pond, and quality controls. The generated textures require no external downloads or third-party asset licenses. Physical-device performance still varies.

## Living world and cleaner menus

Grass now covers the surrounding landscape, with 6,000 / 12,000 / 18,000 / 24,000 clumps by quality tier. The two-draw grass system is retained. Twelve animated birds, bounded dust particles, reeds and lily pads add environmental detail; pond shading adds shoreline foam and layered ripples. Comfort mode freezes flight and wind and hides dust.

The cockpit groups mission progress, relocates scores into Destinations, removes the duplicate content sidebar, and puts audio controls in one dock. Radio uses a native dialog; Settings groups advanced graphics controls in a disclosure and keeps focus within the panel while open.

Radio includes Kevin MacLeod’s recorded “Local Forecast,” under CC BY 4.0, with visible attribution and `public/audio/CREDITS.txt`. The 128 kbps MP3 is approximately 2.65 MB and is loaded only when selected. It loops locally, honors master volume/mute, pauses on hidden tabs, and offers the built-in synth as a fallback. It is a curated recording, not a live broadcast. Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300010

## Racing instruments and scanned surfaces

The HUD now uses a 0–240 km/h analog speedometer with a physics-driven needle and arc, a digital inset, N/D/R drive state, and actual boost/airborne indicators. A heading compass and circular minimap complete the driving instruments. Touch layouts retain room for steering and action controls, and reduced motion disables needle transitions.

Scanned CC0 Poly Haven materials replace procedural wood, bark, rock, terrain and road surfaces. They use separate diffuse, OpenGL normal and roughness maps. A scanned meadow diffuse map removes the checker-like ground pattern. The maps are locally hosted 512px WebP files with mipmapping, bounded anisotropy and procedural fallbacks; credits and source URLs are in `public/textures/CREDITS.txt`. Road UVs use world coordinates to avoid stretching along long road segments. The rally car adds clear-coated paint and a small prefiltered reflection environment for paint/glass.

Validation includes 13 tests, production build, browser visual review, and phone-width layout checks. These maps improve surface shading without adding displacement geometry or promising a particular frame rate.
