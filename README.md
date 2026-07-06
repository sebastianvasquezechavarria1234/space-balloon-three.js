<div align="center">

![Space Balloon](https://img.shields.io/badge/Space%20Balloon-Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)

# Space Balloon

### An Interactive Journey Through the Cosmos

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-v0.161-049EF4)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/ES2022-JavaScript-F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

<br />

*A procedural universe born from mathematics and light.*

[**Explore Live Demo**](https://space-balloon-three.js.vercel.app/) · [**View Source Code**](https://github.com/sebastianvasquezechavarria1234/space-balloon-three.js)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Visual Experience](#visual-experience)
- [Key Features](#key-features)
- [Animation Timeline](#animation-timeline)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Controls](#controls)
- [Technical Decisions](#technical-decisions)
- [Performance](#performance)
- [Author](#author)
- [License](#license)

---

## Overview

Space Balloon is a real-time 3D scene that unfolds like a cosmic ballet. At its core, an organic nucleus deforms endlessly through Simplex Noise, surrounded by layered particle systems that breathe, expand, and converge in choreographed sequences.

This is not a static render. Every frame is calculated live — every star, every comet, every pulse of the nucleus exists in constant motion.

> *"The universe is not something you observe. It is something you inhabit."*

The project explores what happens when procedural generation meets deliberate artistic direction: a scene that feels alive, yet follows a precise temporal script.

---

## Visual Experience

```
                         ✦
            ·  ✦           ·
      ✦  ·        ·    ✦
           ·   ✦    ·
        ·      ·       ✦
    ·    ✦  ·      ·
          ◉        ·    ✦
      ·     ✦   ·
            ·       ✦
   ✦    ·      ·
```

The scene progresses through distinct emotional phases:

| Phase | Moment | Feeling |
|-------|--------|---------|
| **I** | Nucleus awakens | Anticipation |
| **II** | Stars rise from below | Wonder |
| **III** | Particles expand outward | Freedom |
| **IV** | Contraction begins | Tension |
| **V** | Convergence to center | Resolution |
| **VI** | Moving stars appear | Discovery |

Each phase transitions smoothly into the next, creating a narrative without words.

---

## Key Features

### Organic Nucleus

The central form uses an *IcosahedronGeometry* with 28 subdivisions, deformed in real-time via 2D Simplex Noise. Vertices shift along their normals, creating an ever-breathing, liquid surface that never repeats.

### Multi-Layered Star Field

Three distinct particle layers create depth:

- **Distant white stars** — 200 points at radius 130, subtle and constant
- **Orange mid-field stars** — 600 points that rise, expand, contract, and fade
- **Moving stars** — 5 comets that fly inward from the cosmic boundary

### Coordinated Animation

A master timeline orchestrates every element. Delays are measured in absolute milliseconds from scene initialization, ensuring perfect synchronization across all systems.

### Texture Pipeline

All textures load asynchronously before rendering begins. The sky sphere, nucleus surface, and particle sprites each receive their designated map through a unified application phase.

---

## Animation Timeline

```
Time    0s      2s      4s      6s      8s      10s
        │───────│───────│───────│───────│───────│
        
Nucleus ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
        Blob deformation begins (continuous)

Stars   ░░░░░░░██████████████████████████████████
        Rise → Expand → Contract → Converge

Moving  ░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████████
Stars                              Fly inward
```

The keyframe system uses three constants:

```javascript
EXPANSION_START_DELAY    // When particles begin spreading
CONTRACTION_START_DELAY  // When particles pull inward
CENTERING_START_DELAY    // When convergence begins
```

---

## Project Architecture

```
space-balloon/
│
├── index.html              Entry point
│                           └── Import map for Three.js modules
│
├── style.css               Visual foundation
│                           └── Full-viewport dark theme
│
└── src/
    │
    ├── main.js             Bootstrap
    │                       └── Creates Effect, calls init()
    │
    ├── Effect.js           Orchestrator
    │                       ├── Three.js renderer setup
    │                       ├── Scene object creation
    │                       ├── Animation loop
    │                       └── Phase state management
    │
    ├── config.js           Parameters
    │                       └── All timing and size constants
    │
    ├── particleUtils.js    Generators
    │                       ├── Point particle creation
    │                       └── Random sphere distribution
    │
    └── textureLoader.js    Assets
                            └── Async texture pipeline
```

Each module has a single responsibility. `Effect.js` orchestrates; `config.js` parameterizes; `particleUtils.js` generates; `textureLoader.js` loads.

---

## Getting Started

### Prerequisites

A modern browser with WebGL support. No build tools required.

### Installation

```bash
git clone https://github.com/sebastianvasquezechavarria1234/space-balloon-three.js.git
cd space-balloon-three.js
```

### Running Locally

```bash
# Using Node.js
npx serve .

# Using Python
python -m http.server 8000

# Or simply open index.html in a browser
```

The scene loads all textures before rendering. Expect a brief moment of black before the universe appears.

---

## Controls

| Input | Action | Notes |
|:------|:-------|:------|
| **Scroll** | Zoom in / out | Limited between 150–350 units |
| **Click + Drag** | Rotate camera | Orbit around nucleus |
| **Auto-rotate** | Continuous orbit | Speed: 5 units/second |

Pan is disabled to maintain focus on the central scene.

---

## Technical Decisions

### Why Simplex Noise?

Perlin noise produces visible artifacts at extreme deformations. Simplex Noise maintains smooth gradients even at high frequencies, creating organic movement that feels biological rather than mechanical.

### Why Absolute Timestamps?

Using `Date.now()` offsets instead of frame counters ensures animations progress consistently regardless of frame drops. The scene ages in real time, not in render cycles.

### Why Capped FPS?

The render loop targets 60fps via a delta accumulator. This prevents GPU saturation on high-refresh displays while maintaining smooth animation on standard screens.

### Why BufferGeometry?

All particle systems use `BufferGeometry` with `Float32Array` attributes. This enables direct GPU memory access for position updates, avoiding object allocation during animation.

---

## Performance

The scene is designed to run smoothly on mid-range hardware:

| Metric | Target |
|--------|--------|
| Frame rate | 60fps (capped) |
| Draw calls | ~15 |
| Triangle count | ~50,000 |
| Texture memory | ~12MB |

**Optimizations applied:**

- Pre-allocated buffer arrays (zero GC pressure during animation)
- Single `requestAnimationFrame` loop (no nested loops)
- Material reuse across particle systems
- `depthWrite: false` on transparent particles
- Additive blending for natural light accumulation

---

## Author

**Sebastian Vasquez**

| | |
|---|---|
| Portfolio | [sebas-dev.vercel.app](https://sebas-dev.vercel.app/) |
| GitHub | [@sebastianvasquezechavarria1234](https://github.com/sebastianvasquezechavarria1234) |

---

## License

Released under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2024 Sebastian Vasquez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

*Built with Three.js, simplex-noise, and curiosity.*

</div>