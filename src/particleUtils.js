// =============================================================
//  src/particleUtils.js
//  Factory helpers for creating Three.js point-particle systems.
// =============================================================

import * as THREE from 'three';

// ─── Golden star texture ──────────────────────────────────────

/**
 * Generates a canvas-based golden starburst glow texture.
 * Core is white-hot, fading through yellow → orange → transparent.
 * Includes a soft 4-point diffraction spike.
 * @returns {THREE.CanvasTexture}
 */
export function createStarGlowTexture() {
  const SIZE   = 256;
  const CENTER = SIZE / 2;

  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // ── Radial glow ──────────────────────────────────────────
  const glow = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, CENTER);
  glow.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');   // white-hot core
  glow.addColorStop(0.08, 'rgba(255, 248, 180, 0.95)');  // warm white
  glow.addColorStop(0.20, 'rgba(255, 220,  60, 0.85)');  // golden yellow
  glow.addColorStop(0.40, 'rgba(255, 170,  20, 0.55)');  // amber
  glow.addColorStop(0.65, 'rgba(255, 110,  10, 0.25)');  // deep orange
  glow.addColorStop(1.00, 'rgba(200,  60,   0, 0.00)');  // transparent edge
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 4-point diffraction spike ─────────────────────────────
  ctx.globalCompositeOperation = 'screen';

  const drawSpike = (x1, y1, x2, y2) => {
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0.00, 'rgba(255,255,220,0.00)');
    grad.addColorStop(0.35, 'rgba(255,255,220,0.45)');
    grad.addColorStop(0.50, 'rgba(255,255,255,0.90)');
    grad.addColorStop(0.65, 'rgba(255,255,220,0.45)');
    grad.addColorStop(1.00, 'rgba(255,255,220,0.00)');
    ctx.fillStyle = grad;
  };

  // Horizontal spike
  drawSpike(0, CENTER, SIZE, CENTER);
  ctx.fillRect(0, CENTER - 1.5, SIZE, 3);

  // Vertical spike
  drawSpike(CENTER, 0, CENTER, SIZE);
  ctx.fillRect(CENTER - 1.5, 0, 3, SIZE);

  // Diagonal spikes (softer)
  ctx.globalAlpha = 0.35;
  drawSpike(0, 0, SIZE, SIZE);
  ctx.fillRect(0, 0, SIZE, SIZE);
  drawSpike(SIZE, 0, 0, SIZE);
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.globalAlpha = 1.0;

  ctx.globalCompositeOperation = 'source-over';

  return new THREE.CanvasTexture(canvas);
}

// ─── Trail / comet-tail geometry ─────────────────────────────

/**
 * Creates the BufferGeometry + PointsMaterial for the star trail system.
 * Returns a THREE.Points object. Positions and colors are updated each frame
 * by Effect._updateMovingStars().
 *
 * @param {number} totalStars     - number of moving stars
 * @param {number} trailPerStar  - trail particles per star
 * @param {THREE.Texture} texture
 * @returns {THREE.Points}
 */
export function createTrailSystem(totalStars, trailPerStar, texture) {
  const total     = totalStars * trailPerStar;
  const positions = new Float32Array(total * 3);   // all zeros (hidden far away)
  const colors    = new Float32Array(total * 3);   // RGB, starts black

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size:         9,
    map:          texture,
    vertexColors: true,
    blending:     THREE.AdditiveBlending,
    transparent:  true,
    depthWrite:   false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

/**
 * Generates a random point on the surface of a sphere.
 * @param {number} radius
 * @returns {THREE.Vector3}
 */
export function randomPointOnSphere(radius) {
  const theta = 2 * Math.PI * Math.random();
  const phi   = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

/**
 * Creates a Three.js Points object with random positions on a sphere.
 *
 * @param {object} opts
 * @param {number}  opts.size        - Particle size
 * @param {number}  opts.total       - Number of particles
 * @param {boolean} [opts.transparent=true]  - Use additive blending
 * @param {number}  [opts.max=150]   - Maximum radius
 * @param {number}  [opts.min=70]    - Minimum radius
 * @param {number}  [opts.pointY]    - Fixed Y value (stores real Y in originalY attribute)
 * @returns {THREE.Points}
 */
export function createPointParticles({
  size,
  total,
  transparent = true,
  max = 150,
  min = 70,
  pointY,
}) {
  const positions = new Float32Array(total * 3);
  const originalY = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const radius = THREE.MathUtils.randInt(max, min);
    const point  = randomPointOnSphere(radius);
    const idx    = i * 3;

    positions[idx]     = point.x;
    positions[idx + 2] = point.z;

    if (pointY !== undefined) {
      positions[idx + 1] = pointY;
      originalY[i]       = point.y;
    } else {
      positions[idx + 1] = point.y;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',  new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('originalY', new THREE.BufferAttribute(originalY, 1));

  const material = new THREE.PointsMaterial({
    size,
    blending:    transparent ? THREE.AdditiveBlending : THREE.NormalBlending,
    transparent: true,
    depthWrite:  false,
  });

  return new THREE.Points(geometry, material);
}
