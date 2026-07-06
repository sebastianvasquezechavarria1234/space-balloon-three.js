// =============================================================
//  src/Effect.js
//  Main scene class.  Orchestrates renderer, scene, camera,
//  all meshes and the multi-phase animation timeline.
//  Author: isladjan — https://isladjan.com/
// =============================================================

import * as THREE from 'three';
import { OrbitControls }       from 'three/addons/controls/OrbitControls.js';
import { createNoise2D }       from 'https://esm.sh/simplex-noise';

import { loadTextures }        from './textureLoader.js';
import { createPointParticles, randomPointOnSphere } from './particleUtils.js';
import {
  NUCLEUS_START_DELAY,
  MOVING_STARS_START_DELAY,
  EXPANSION_START_DELAY,
  MAX_EXPANSION_DISTANCE,
  CONTRACTION_START_DELAY,
  CONTRACTION_DURATION,
  CENTERING_START_DELAY,
  CENTERING_DURATION,
  POINT_STARS_CONTRACT_START_DELAY,
  POINT_STARS_CONTRACT_DURATION,
  TARGET_RADIUS,
} from './config.js';

export class Effect {

  // ─── Constructor ─────────────────────────────────────────────
  constructor() {
    // Three.js core objects
    this.renderer  = null;
    this.scene     = null;
    this.camera    = null;
    this.clock     = null;
    this.controls  = null;

    // Meshes / particle systems
    this.nucleus    = null;
    this.sphereBg   = null;
    this.pointStars  = null;
    this.pointStars2 = null;
    this.pointComet1 = null;
    this.planet1    = null;
    this.planet2    = null;
    this.planet3    = null;
    this.stars      = null;   // moving stars

    // Animation state
    this.noise              = null;
    this.blobScale          = 2;
    this.originalPositions  = null;   // nucleus vertex rest positions
    this.time               = 0;
    this.delta              = 0;
    this.hasInteracted      = false;

    // Scheduled start times (absolute ms from epoch)
    this._t0 = Date.now();
    this.animationStartTime3          = this._t0 + NUCLEUS_START_DELAY;
    this.animationStartTime6          = this._t0 + MOVING_STARS_START_DELAY;
    this.expansionStartTime           = this._t0 + EXPANSION_START_DELAY;
    this.contractionStartTime         = this._t0 + CONTRACTION_START_DELAY;
    this.centeringStartTime           = this._t0 + CENTERING_START_DELAY;
    this.pointStarsContractStartTime  = this._t0 + POINT_STARS_CONTRACT_START_DELAY;
  }

  // ─── Public API ──────────────────────────────────────────────

  /** Async boot sequence */
  async init() {
    this._initThree();
    this._createElements();
    this._createMovingStars();
    this._createPointElements();
    this._initFullscreenButton();
    this._initBanner();

    // Load all textures, then apply them
    const textures = await loadTextures();
    this._applyTextures(textures);

    // Responsive resizing
    const container = document.getElementById('webgl');
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(container);

    // Start the capped render loop
    this._limitFPS(1 / 60);
  }

  // ─── Three.js setup ──────────────────────────────────────────

  _initThree() {
    const container = document.getElementById('webgl');

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      alpha:     true,
      antialias: true,
      stencil:   false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    this.camera.position.set(0, 0, 150);

    this.clock = new THREE.Clock();

    // Lighting
    const dirLight = new THREE.DirectionalLight('#fff', 3);
    dirLight.position.set(0, 50, -20);
    this.scene.add(dirLight);

    const ambLight = new THREE.AmbientLight('#ffffff', 1);
    ambLight.position.set(0, -20, -40);
    this.scene.add(ambLight);

    // Camera controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate      = true;
    this.controls.autoRotateSpeed = 5;
    this.controls.maxDistance     = 350;
    this.controls.minDistance     = 150;
    this.controls.enablePan       = false;
  }

  // ─── Scene objects ───────────────────────────────────────────

  /** Nucleus icosahedron + background sphere */
  _createElements() {
    // Nucleus
    const icoGeo = new THREE.IcosahedronGeometry(20, 28);
    this.originalPositions = new Float32Array(icoGeo.attributes.position.array);

    this.nucleus = new THREE.Mesh(icoGeo, new THREE.MeshPhongMaterial());
    this.nucleus.position.set(0, 0, 0);
    this.scene.add(this.nucleus);

    this.noise = createNoise2D();

    // Background sphere
    this.sphereBg = new THREE.Mesh(
      new THREE.SphereGeometry(90, 50, 50),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide })
    );
    this.scene.add(this.sphereBg);
  }

  /** All point-particle systems */
  _createPointElements() {
    // Distant small white stars
    this.pointStars = createPointParticles({ size: 0.5, total: 200, transparent: true, max: 130, min: 130 });
    this.scene.add(this.pointStars);

    // Smaller orange stars in the mid-field (Y starts at 0)
    this.pointStars2 = createPointParticles({ size: 3, total: 600, transparent: true, max: 33, min: 25, pointY: 0 });
    this.scene.add(this.pointStars2);

    // Orange comet
    this.pointComet1 = createPointParticles({ size: 12, total: 1, transparent: true, max: 25, min: 25 });
    this.scene.add(this.pointComet1);

    // Planets
    this.planet1 = createPointParticles({ size: 9,  total: 1, transparent: false, max: 60, min: 40 });
    this.planet2 = createPointParticles({ size: 12, total: 1, transparent: false, max: 60, min: 40 });
    this.planet3 = createPointParticles({ size: 12, total: 1, transparent: false, max: 60, min: 40 });
    this.scene.add(this.planet1);
    this.scene.add(this.planet2);
    this.scene.add(this.planet3);
  }

  /** Stars that fly in from the far boundary toward the centre */
  _createMovingStars() {
    const total         = 5;
    const positions     = new Float32Array(total * 3);
    const velocities    = new Float32Array(total);
    const startPositions = new Float32Array(total * 3);

    for (let i = 0; i < total; i++) {
      const radius = THREE.MathUtils.randFloat(200, 300);
      const point  = randomPointOnSphere(radius);
      const idx    = i * 3;

      positions[idx]     = startPositions[idx]     = point.x;
      positions[idx + 1] = startPositions[idx + 1] = point.y;
      positions[idx + 2] = startPositions[idx + 2] = point.z;

      velocities[i] = THREE.MathUtils.randInt(50, 400);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',      new THREE.BufferAttribute(positions,      3));
    geo.setAttribute('velocity',      new THREE.BufferAttribute(velocities,     1));
    geo.setAttribute('startPosition', new THREE.BufferAttribute(startPositions, 3));

    this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
      size:        14,
      transparent: true,
      opacity:     0.8,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    }));
    this.stars.name    = 'moving_stars';
    this.stars.visible = false;
    this.scene.add(this.stars);
  }

  // ─── Texture application ──────────────────────────────────────

  _applyTextures(t) {
    this.pointStars.material.map  = t.flare1;
    this.pointStars2.material.map = t.flare2;
    this.pointComet1.material.map = t.flare3;
    this.planet1.material.map     = t.planet1;
    this.planet2.material.map     = t.planet2;
    this.planet3.material.map     = t.planet3;
    this.nucleus.material.map     = t.star;
    this.sphereBg.material.map    = t.sky;
    this.stars.material.map       = t.flare2;
  }

  // ─── UI helpers ───────────────────────────────────────────────

  _initFullscreenButton() {
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) =>
          console.warn('Fullscreen error:', err.message)
        );
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  _initBanner() {
    const banner = document.getElementById('interactionBanner');
    if (!banner) return;

    const hide = () => {
      if (this.hasInteracted) return;
      this.hasInteracted = true;
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 500);
    };

    window.addEventListener('wheel',       hide, { once: true });
    this.renderer.domElement.addEventListener('pointerdown', hide, { once: true });
  }

  // ─── Resize ───────────────────────────────────────────────────

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Render loop ──────────────────────────────────────────────

  _limitFPS(interval) {
    requestAnimationFrame(this._limitFPS.bind(this, interval));
    this.delta += this.clock.getDelta();

    if (this.delta > interval) {
      this._loop();
      this.delta %= interval;
    }
  }

  _loop() {
    this.time = Date.now();

    this._updateNucleus();
    this._updateMovingStars();
    this._updatePointStars2();
    this._updateRotations();

    if (this.time >= this.pointStarsContractStartTime) {
      this._updatePointStarsContraction();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ─── Animation updates ────────────────────────────────────────

  /** Blob-deform the nucleus using simplex noise */
  _updateNucleus() {
    if (this.time < this.animationStartTime3) return;

    const easing = Math.min(1, (this.time - this.animationStartTime3) / 2000);
    const pos    = this.nucleus.geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const ox = this.originalPositions[i * 3];
      const oy = this.originalPositions[i * 3 + 1];
      const oz = this.originalPositions[i * 3 + 2];

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx  = ox / len;
      const ny  = oy / len;
      const nz  = oz / len;

      const d = 20 + this.noise(
        nx + this.time * 0.0004,
        ny + this.time * 0.0004
      ) * this.blobScale * easing;

      pos.array[i * 3]     = nx * d;
      pos.array[i * 3 + 1] = ny * d;
      pos.array[i * 3 + 2] = nz * d;
    }

    pos.needsUpdate = true;
    this.nucleus.geometry.computeVertexNormals();
  }

  /** Animate incoming "shooting" stars toward the origin */
  _updateMovingStars() {
    if (this.time < this.animationStartTime6) return;

    const easing    = Math.min(1, (this.time - this.animationStartTime6) / 2000);
    const positions = this.stars.geometry.attributes.position;
    const velocities    = this.stars.geometry.attributes.velocity;
    const startPositions = this.stars.geometry.attributes.startPosition;

    for (let i = 0; i < positions.count; i++) {
      const idx = i * 3;

      const moveX = easing * ((0 - positions.array[idx])     / velocities.array[i]);
      const moveY = easing * ((0 - positions.array[idx + 1]) / velocities.array[i]);
      const moveZ = easing * ((0 - positions.array[idx + 2]) / velocities.array[i]);

      positions.array[idx]     += moveX;
      positions.array[idx + 1] += moveY;
      positions.array[idx + 2] += moveZ;

      velocities.array[i] -= 0.1 * easing;

      // Reset when close to centre
      if (
        Math.abs(positions.array[idx])     <= 2 &&
        Math.abs(positions.array[idx + 2]) <= 2
      ) {
        positions.array[idx]     = startPositions.array[idx];
        positions.array[idx + 1] = startPositions.array[idx + 1];
        positions.array[idx + 2] = startPositions.array[idx + 2];
        velocities.array[i] = 120;
      }
    }

    positions.needsUpdate  = true;
    velocities.needsUpdate = true;
  }

  /** Drive the four animation phases for the orange star field */
  _updatePointStars2() {
    const positions = this.pointStars2.geometry.attributes.position;
    const originalY = this.pointStars2.geometry.attributes.originalY;

    for (let i = 0; i < originalY.count; i++) {
      // Phase 1 — rise to original Y
      if (this.time >= this.animationStartTime3) {
        const cy = positions.array[i * 3 + 1];
        const ty = originalY.array[i];
        positions.array[i * 3 + 1] = cy + (ty - cy) * 0.02;
      }

      // Phase 2 — expand outward
      if (this.time >= this.expansionStartTime && this.time < this.contractionStartTime) {
        const x = positions.array[i * 3];
        const y = positions.array[i * 3 + 1];
        const z = positions.array[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);

        if (dist < MAX_EXPANSION_DISTANCE) {
          const factor = 1 + 0.008 * (1 - dist / MAX_EXPANSION_DISTANCE);
          positions.array[i * 3]     = x * factor;
          positions.array[i * 3 + 1] = y * factor;
          positions.array[i * 3 + 2] = z * factor;
        }
      }

      // Phase 3 — contract back toward a tighter shell
      if (this.time >= this.contractionStartTime) {
        const elapsed = this.time - this.contractionStartTime;
        const easing  = Math.min(1, elapsed / CONTRACTION_DURATION);

        const x = positions.array[i * 3];
        const y = positions.array[i * 3 + 1];
        const z = positions.array[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);
        const r    = THREE.MathUtils.randFloat(25, 33);

        const speed = 0.02 * easing;
        positions.array[i * 3]     += ((x / dist) * r - x) * speed;
        positions.array[i * 3 + 1] += ((y / dist) * r - y) * speed;
        positions.array[i * 3 + 2] += ((z / dist) * r - z) * speed;
      }

      // Phase 4 — gather at origin, fade out, reveal moving stars
      if (this.time >= this.centeringStartTime) {
        const elapsed = this.time - this.centeringStartTime;
        const easing  = Math.min(1, elapsed / CENTERING_DURATION);
        const speed   = 0.02 * easing;

        positions.array[i * 3]     += (0 - positions.array[i * 3])     * speed;
        positions.array[i * 3 + 1] += (0 - positions.array[i * 3 + 1]) * speed;
        positions.array[i * 3 + 2] += (0 - positions.array[i * 3 + 2]) * speed;

        this.pointStars2.material.opacity = 1 - easing;

        if (easing >= 1) {
          this.pointStars2.visible = false;
          this.stars.visible       = true;
        }
      }
    }

    positions.needsUpdate = true;
  }

  /** Steady per-frame rotations for all particle systems */
  _updateRotations() {
    this.pointStars.rotation.y    -= 0.0007;
    this.pointComet1.rotation.z   -= 0.01;
    this.pointComet1.rotation.y   += 0.001;
    this.pointStars2.rotation.x   -= 0.001;
    this.planet1.rotation.y       += 0.001;
    this.planet2.rotation.z       += 0.003;
    this.planet3.rotation.x       += 0.0005;
  }

  /** Pull the distant white star field toward TARGET_RADIUS */
  _updatePointStarsContraction() {
    const elapsed = this.time - this.pointStarsContractStartTime;
    const easing  = Math.min(1, elapsed / POINT_STARS_CONTRACT_DURATION);
    const pos     = this.pointStars.geometry.attributes.position;

    this.pointStars.material.size = 0.4 + 0.7 * easing;

    for (let i = 0; i < pos.count; i++) {
      const x    = pos.array[i * 3];
      const y    = pos.array[i * 3 + 1];
      const z    = pos.array[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);

      const speed = 0.02 * easing;
      pos.array[i * 3]     += ((x / dist) * TARGET_RADIUS - x) * speed;
      pos.array[i * 3 + 1] += ((y / dist) * TARGET_RADIUS - y) * speed;
      pos.array[i * 3 + 2] += ((z / dist) * TARGET_RADIUS - z) * speed;
    }

    pos.needsUpdate = true;
  }
}
