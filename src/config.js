// =============================================================
//  src/config.js
//  All magic numbers and timing constants in one place.
// =============================================================

/** Delay (ms) before the nucleus blob starts animating */
export const NUCLEUS_START_DELAY = 6_000;

/** Delay (ms) before the moving-stars animation starts */
export const MOVING_STARS_START_DELAY = 15_000;

/** Delay (ms) before stars begin expanding outward */
export const EXPANSION_START_DELAY = 9_000;

/** Maximum distance (scene units) a star can expand to */
export const MAX_EXPANSION_DISTANCE = 95;

/** Delay (ms) before the contraction phase begins */
export const CONTRACTION_START_DELAY = 20_000;

/** Duration (ms) of the contraction phase */
export const CONTRACTION_DURATION = 8_000;

/** Delay (ms) before the centering phase begins */
export const CENTERING_START_DELAY = 25_000;

/** Duration (ms) of the centering phase */
export const CENTERING_DURATION = 8_000;

/** Delay (ms) before distant point-stars contract to TARGET_RADIUS */
export const POINT_STARS_CONTRACT_START_DELAY = 25_000;

/** Duration (ms) of the point-star contraction phase */
export const POINT_STARS_CONTRACT_DURATION = 6_000;

/** Target orbit radius (scene units) for point-star contraction */
export const TARGET_RADIUS = 95;

/** Remote texture URLs */
export const TEXTURES = {
  sky:     'https://i.ibb.co/HC0vxMw/sky2.jpg',
  star:    'https://i.ibb.co/NpJzwns/star.jpg',
  flare1:  'https://i.ibb.co/TRsJ1tm/p1.png',
  flare2:  'https://i.ibb.co/YQcTCRG/p2.png',
  flare3:  'https://i.ibb.co/v1S8YW7/p7.png',
  planet1: 'https://i.ibb.co/s1cZDnM/planet1.webp',
  planet2: 'https://i.ibb.co/Lt5Kn7y/planet2.webp',
  planet3: 'https://i.ibb.co/T8V57p4/planet3.webp',
};
