const fs = require('fs');
const file = 'c:/Users/svasquez/Desktop/cosmos-museum/script.js';
let code = fs.readFileSync(file, 'utf8');

const orangeStars = `
// ── ORANGE STAR FIELD (estrellas naranjas estáticas, estilo space-balloon) ──
(function createOrangeStars() {
  const total = 800;
  const positions = new Float32Array(total * 3);

  for (let i = 0; i < total; i++) {
    const radius = 150 + Math.random() * 350;
    const theta  = Math.random() * Math.PI * 2;
    const phi    = Math.acos(2 * Math.random() - 1);

    positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = 'anonymous';
  const texture = textureLoader.load('https://i.ibb.co/YQcTCRG/p2.png');

  const mat = new THREE.PointsMaterial({
    size: 14,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: texture
  });

  const points = new THREE.Points(geo, mat);
  points.name  = 'orangeStars';
  scene.add(points);
})();
`;

const cometStars = `// ── SHOOTING STARS (COMET STYLE FROM SPACE-BALLOON) ──
const shootingStars = [];
const cometTexture = new THREE.TextureLoader().load('https://i.ibb.co/v1S8YW7/p7.png');

function spawnShootingStar() {
  const start = new THREE.Vector3(
    (Math.random() - 0.5) * 500,
    50 + Math.random() * 200,
    (Math.random() - 0.5) * 500
  );
  const dir = new THREE.Vector3(
    (Math.random() - 0.5) * 2, -(0.3 + Math.random() * 0.7), (Math.random() - 0.5) * 2
  ).normalize();

  const mat = new THREE.SpriteMaterial({
    map: cometTexture,
    color: 0xffffff,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const sprite = new THREE.Sprite(mat);
  sprite.position.copy(start);
  sprite.scale.set(30, 30, 1);

  sprite.userData = { dir, speed: 4 + Math.random() * 5, life: 0, maxLife: 35 + Math.random() * 35 };
  scene.add(sprite);
  shootingStars.push(sprite);
}

function updateShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    s.userData.life++;
    
    s.position.x += s.userData.dir.x * s.userData.speed;
    s.position.y += s.userData.dir.y * s.userData.speed;
    s.position.z += s.userData.dir.z * s.userData.speed;
    
    s.material.opacity = 1.0 - (s.userData.life / s.userData.maxLife);
    if (s.userData.life >= s.userData.maxLife) {
      scene.remove(s); 
      s.material.dispose();
      shootingStars.splice(i, 1);
    }
  }
  if (Math.random() < 0.008) spawnShootingStar();
}`;

code = code.replace('scene.add(createStarfield());', 'scene.add(createStarfield());\\n' + orangeStars);

const shootStart = code.indexOf('// ── SHOOTING STARS ──');
const cometEnd = code.indexOf('// ── COMET ──');
if (shootStart > -1 && cometEnd > -1) {
  const originalShooting = code.substring(shootStart, cometEnd);
  code = code.replace(originalShooting, cometStars + '\\n\\n');
} else {
  console.log("Could not find shooting stars block");
}

fs.writeFileSync(file, code);
console.log("Patch applied successfully!");
