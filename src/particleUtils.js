// =============================================================
//  src/particleUtils.js
//  Factory helpers for creating Three.js point-particle systems.
// =============================================================

import * as THREE from 'three';

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
