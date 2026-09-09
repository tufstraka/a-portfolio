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

Portfolio content lives in `PORTFOLIO_DATA` in `js/main.js`. The original game's styles are in `css/styles.css`; `css/cockpit.css` provides the responsive cockpit design. No analytics service is used: existing discovery and score data stays in browser storage.

The regression tests cover input isolation, pause behavior, a single animation loop, reversible mute, input reset, and unique HTML identifiers. They do not replace a real WebGL playthrough on desktop and mobile hardware.
