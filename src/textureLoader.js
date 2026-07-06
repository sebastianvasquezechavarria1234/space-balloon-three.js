// =============================================================
//  src/textureLoader.js
//  Loads all scene textures in parallel and returns them as a
//  named map.
// =============================================================

import * as THREE from 'three';
import { TEXTURES } from './config.js';

/**
 * Loads every texture listed in config.TEXTURES.
 * @returns {Promise<Record<string, THREE.Texture>>}
 */
export function loadTextures() {
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  const promises = Object.entries(TEXTURES).map(([key, url]) =>
    new Promise((resolve, reject) => {
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 16;
          resolve([key, texture]);
        },
        undefined,
        (err) => reject(new Error(`Failed to load texture "${key}" (${url}): ${err}`))
      );
    })
  );

  return Promise.all(promises).then(Object.fromEntries);
}
