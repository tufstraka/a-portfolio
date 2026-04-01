# Keith Kadima — Interactive 3D Portfolio

> Because regular portfolios are boring. Drive around, explore, and discover.

🎮 **[Live Demo](https://tufstraka.github.io/a-portfolio/)**

![Three.js](https://img.shields.io/badge/Three.js-black?style=flat&logo=three.js&logoColor=white)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=flat&logo=webgl&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## 🚗 Features

### Core Experience
- **Driveable car** with realistic physics (acceleration, braking, drifting)
- **5 explorable buildings** containing portfolio sections
- **Day/Night cycle** with dynamic lighting
- **Minimap** with real-time position tracking

### Game Feel
- 🎵 **Synthesized audio** — Engine sounds, horn, tire screech (Web Audio API)
- 💨 **Particle effects** — Dust, drift smoke, landing impact
- 📸 **Screen shake** on collisions and landings
- 🏆 **Achievements** — Explorer, Speed Demon, Drift King

### Easter Eggs
- 🎮 **Konami Code** (↑↑↓↓←→←→BA) — Rainbow mode + super boost
- 🌅 **Time of Day** — Press `T` to cycle dawn/day/sunset/night
- 🌙 **Night Mode** — Press `N` for instant night

## 🎮 Controls

| Key | Action |
|-----|--------|
| `WASD` / `Arrows` | Drive |
| `Shift` | Turbo boost |
| `J` | Jump |
| `Space` | Enter building (hold near entrance) |
| `H` | Honk |
| `C` | Toggle camera view |
| `M` | Toggle minimap |
| `T` | Cycle time of day |
| `N` | Toggle night mode |
| `Esc` | Close modal |

## 🏗️ Architecture

```
a-portfolio/
├── index.html          # Main entry point
├── css/
│   └── main.css        # All styles
├── js/                 # (Future: modular JS)
├── assets/             # (Future: textures, models)
└── README.md
```

## 🛠️ Tech Stack

- **Three.js** — 3D rendering
- **Web Audio API** — Synthesized sounds (no audio files!)
- **Custom shaders** — Terrain, sky gradient
- **Post-processing** — Bloom, SMAA/FXAA anti-aliasing
- **Vanilla JS** — No frameworks, pure performance

## 🚀 Performance

- Auto-quality adjustment based on FPS
- Object pooling for particles
- Frustum culling
- Level-of-detail shadows
- Mobile-responsive with touch controls

## 📊 Portfolio Sections

| Building | Content |
|----------|---------|
| **About Me** | Background, interests, philosophy |
| **Tech Stack** | Languages, frameworks, tools |
| **Projects** | Locsafe, SafeBite, Colosseum, etc. |
| **Experience** | Niche Traffic Kit, PaydHQ, Safaricom |
| **Contact** | Email, LinkedIn, GitHub, Phone |

## 🎨 Inspiration

- [Bruno Simon's Portfolio](https://bruno-simon.com/) — The OG 3D portfolio
- Steve Swink's "Game Feel" — Polish and juice principles
- Modern game HUDs — Minimal, typography-driven UI

## 📝 License

MIT — Feel free to fork and make your own!

---

**Built by [Keith Kadima](https://github.com/tufstraka)** 🇰🇪

*Code is art.*
