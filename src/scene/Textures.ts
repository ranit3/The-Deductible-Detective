import * as THREE from 'three';

/**
 * LAYER 2: PROCEDURAL TEXTURES
 * Generates high-resolution textures for the 3D investigation scenes.
 */
export class Textures {
  // Kitchen Floor Tile (Chequered Cream & Slate)
  public static createKitchenTile(): THREE.CanvasTexture {
    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 512;
    const ctx = cvs.getContext('2d')!;

    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
      }
    }

    // Grout lines
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // Charred Arson Burn Pattern with Hydrocarbon Rainbow Sheen
  public static createBurnMarkTexture(): THREE.CanvasTexture {
    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 512;
    const ctx = cvs.getContext('2d')!;

    // Transparent background
    ctx.clearRect(0, 0, 512, 512);

    // Deep black soot core
    const radGrad = ctx.createRadialGradient(256, 256, 30, 256, 256, 220);
    radGrad.addColorStop(0, 'rgba(15, 15, 18, 0.95)');
    radGrad.addColorStop(0.4, 'rgba(40, 25, 20, 0.85)');
    radGrad.addColorStop(0.7, 'rgba(80, 45, 25, 0.6)');
    radGrad.addColorStop(0.85, 'rgba(180, 80, 40, 0.25)'); // Rainbow edge
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    // V-shaped irregular pour contour
    ctx.moveTo(256, 60);
    ctx.bezierCurveTo(380, 100, 440, 280, 360, 420);
    ctx.bezierCurveTo(280, 490, 180, 460, 120, 380);
    ctx.bezierCurveTo(60, 240, 140, 80, 256, 60);
    ctx.fill();

    // Charcoal crack lines
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 3;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      const sx = 200 + Math.random() * 112;
      const sy = 180 + Math.random() * 140;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(cvs);
    return tex;
  }

  // Exterior Street Cobblestone
  public static createCobbleTexture(): THREE.CanvasTexture {
    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 512;
    const ctx = cvs.getContext('2d')!;
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#475569';
    for (let y = 0; y < 512; y += 32) {
      ctx.fillRect(0, y, 512, 3);
      const shift = (y / 32) % 2 === 0 ? 0 : 24;
      for (let x = -48; x < 512 + 48; x += 48) {
        ctx.fillRect(x + shift, y, 3, 32);
      }
    }
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // Red Brick Facade
  public static createBrickTexture(): THREE.CanvasTexture {
    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 512;
    const ctx = cvs.getContext('2d')!;
    ctx.fillStyle = '#C2410C';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16, rh = 512 / rows, bw = rh * 2.2;
    ctx.fillStyle = '#431407';
    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      ctx.fillRect(0, y, 512, 4);
      const offset = (r % 2) * (bw / 2);
      for (let x = -bw; x <= 512 + bw; x += bw) {
        ctx.fillRect(x + offset, y, 4, rh);
      }
    }
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
}

