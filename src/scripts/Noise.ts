class MersenneTwister {
  private N = 624;
  private M = 397;
  private MATRIX_A = 0x9908b0df;
  private UPPER_MASK = 0x80000000;
  private LOWER_MASK = 0x7fffffff;
  private mt: number[];
  private mti: number;

  constructor(seed?: number) {
    if (seed === undefined) {
      seed = new Date().getTime();
    }
    this.mt = new Array(this.N);
    this.mti = this.N + 1;
    this.init_genrand(seed);
  }

  private init_genrand(s: number) {
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < this.N; this.mti++) {
      s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
      this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
        (s & 0x0000ffff) * 1812433253) + this.mti;
      this.mt[this.mti] >>>= 0;
    }
  }

  genrand_int32(): number {
    let y;
    const mag01 = [0x0, this.MATRIX_A];

    if (this.mti >= this.N) {
      let kk;
      if (this.mti === this.N + 1) this.init_genrand(5489);

      for (kk = 0; kk < this.N - this.M; kk++) {
        y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      for (; kk < this.N - 1; kk++) {
        y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
      this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
      this.mti = 0;
    }

    y = this.mt[this.mti++];
    y ^= (y >>> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >>> 18);
    return y >>> 0;
  }

  random(): number {
    return this.genrand_int32() * (1.0 / 4294967296.0);
  }
}

class PerlinNoise {
  private p: number[];

  constructor() {
    const permutation = [ 151,160,137,91,90,15,
      131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
      190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
      88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
      77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
      102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
      135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
      5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
      223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
      129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
      251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
      49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
      138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
    ];
    this.p = new Array(512);
    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i] = permutation[i];
    }
  }

  private fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  private lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  private grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    const A = this.p[xi] + yi, AA = this.p[A] + zi, AB = this.p[A + 1] + zi;
    const B = this.p[xi + 1] + yi, BA = this.p[B] + zi, BB = this.p[B + 1] + zi;

    const res = this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA], xf, yf, zf), this.grad(this.p[BA], xf - 1, yf, zf)),
        this.lerp(u, this.grad(this.p[AB], xf, yf - 1, zf), this.grad(this.p[BB], xf - 1, yf - 1, zf))),
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA + 1], xf, yf, zf - 1), this.grad(this.p[BA + 1], xf - 1, yf, zf - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], xf, yf, zf - 1), this.grad(this.p[BB + 1], xf - 1, yf - 1, zf - 1)))
    );
    return (res + 1) / 2;
  }
}

export const generateHeightMap = (size: number, seed: number = 20): { heightMap: number[][], textureUrl: string } => {
  const pn = new PerlinNoise();
  const twister = new MersenneTwister(seed);

  // Match reference JS parameters
  const octaves = 4;
  const persistence = 0.5;
  const lacunarity = 3.0;
  const noiseScale = 3.0;

  // Island shapes scale with board size
  const islandMultiplier = size > 25 ? 0.4 : size > 20 ? 0.35 : 0.3;
  const base = Math.max(3, Math.floor(size * islandMultiplier));
  const shapes = [
    [base, base],
    [base, base + 1],
    [base + 1, base + 1],
    [base + 1, base + 2],
    [base + 2, base + 2]
  ];

  // Number of islands based on board size
  let numIslands: number;
  if (size <= 10) numIslands = 1;
  else if (size <= 15) numIslands = 3 + Math.floor(twister.random() * 2); // 3-4
  else if (size <= 20) numIslands = 4 + Math.floor(twister.random() * 2); // 4-5
  else if (size <= 25) numIslands = 5 + Math.floor(twister.random() * 2); // 5-6
  else numIslands = 6 + Math.floor(twister.random() * 2); // 6-7

  // Place islands without overlapping
  const islands: { centerRow: number; centerCol: number; radiusRow: number; radiusCol: number }[] = [];
  for (let n = 0; n < numIslands; n++) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const shape = shapes[Math.floor(twister.random() * shapes.length)];
      const w = shape[0], h = shape[1];
      const cr = Math.floor(twister.random() * size);
      const cc = Math.floor(twister.random() * size);
      const rr = h / 2, rc = w / 2;

      const overlaps = islands.some(other =>
        Math.abs(cr - other.centerRow) < rr + other.radiusRow + 1 &&
        Math.abs(cc - other.centerCol) < rc + other.radiusCol + 1
      );

      if (!overlaps) {
        islands.push({ centerRow: cr, centerCol: cc, radiusRow: rr, radiusCol: rc });
        break;
      }
    }
  }

  // Add large continents anchored to corners (only for 20x20+ maps)
  if (size > 15) {
    let numContinents: number;
    if (size <= 20) numContinents = 1 + Math.floor(twister.random() * 2); // 1-2
    else if (size <= 25) numContinents = 2 + Math.floor(twister.random() * 2); // 2-3
    else numContinents = 2 + Math.floor(twister.random() * 3); // 2-4
    const cornerIndices = [0, 1, 2, 3];
    // Fisher-Yates shuffle
    for (let i = cornerIndices.length - 1; i > 0; i--) {
      const j = Math.floor(twister.random() * (i + 1));
      [cornerIndices[i], cornerIndices[j]] = [cornerIndices[j], cornerIndices[i]];
    }
    for (let c = 0; c < numContinents; c++) {
      const ci = cornerIndices[c];
      let cr: number, cc: number;
      const inset = 2;
      switch (ci) {
        case 0: cr = inset; cc = inset; break;
        case 1: cr = inset; cc = size - 1 - inset; break;
        case 2: cr = size - 1 - inset; cc = inset; break;
        default: cr = size - 1 - inset; cc = size - 1 - inset; break;
      }
      const continentR = 8 + Math.floor(twister.random() * 5); // 8-12
      islands.push({ centerRow: cr, centerCol: cc, radiusRow: continentR, radiusCol: continentR });
    }
  }

  const halfSize = size / 2;

  // Octave offsets with seedable random (matching reference style)
  const octaveOffsets = Array.from({ length: octaves }, () => ({
    x: (twister.random() * 200000) - 100000,
    y: (twister.random() * 200000) - 100000
  }));

  // Generate height map with centered noise coordinates (like reference)
  const heightMap: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));

  let minNoiseHeight = Number.MAX_VALUE;
  let maxNoiseHeight = -Number.MAX_VALUE;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sampleY = (y - halfSize + 0.5) / noiseScale;
      const sampleX = (x - halfSize + 0.5) / noiseScale;

      let amplitude = 1;
      let frequency = 1;
      let noiseHeight = 0;
      for (let i = 0; i < octaves; i++) {
        const px = sampleX * frequency + octaveOffsets[i].x;
        const py = sampleY * frequency + octaveOffsets[i].y;
        noiseHeight += (pn.noise(px, py, 0) * 2 - 1) * amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }
      if (noiseHeight > maxNoiseHeight) maxNoiseHeight = noiseHeight;
      if (noiseHeight < minNoiseHeight) minNoiseHeight = noiseHeight;
      heightMap[y][x] = noiseHeight;
    }
  }

  const applyIslandMask = (val: number, row: number, col: number): number => {
    let maxVal = 0;
    for (const island of islands) {
      const dR = Math.abs(row - island.centerRow);
      const dC = Math.abs(col - island.centerCol);
      if (dR <= island.radiusRow && dC <= island.radiusCol) {
        const er = dR / island.radiusRow;
        const ec = dC / island.radiusCol;
        const dist = Math.sqrt(er * er + ec * ec);
        const maxDist = 0.85;
        const delta = dist / maxDist;
        const gradient = delta * delta;
        const falloff = Math.max(0, 1 - gradient);
        const islandVal = val * falloff;
        if (islandVal > maxVal) maxVal = islandVal;
      }
    }
    return maxVal;
  };

  // Normalize and apply island mask (matching reference: 1 - delta² gradient falloff)
  const normalized: number[][] = heightMap.map((row, y) => row.map((val, x) => {
    const n = (val - minNoiseHeight) / (maxNoiseHeight - minNoiseHeight);
    return Math.max(0, Math.min(1, applyIslandMask(n, y + 0.5, x + 0.5)));
  }));

  // Create High-Res Texture with exact reference biome colors
  const resPerTile = 40;
  const canvasSize = size * resPerTile;
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  let textureUrl = "";

  if (ctx) {
    // Draw grid lines first (shows through semi-transparent water, hidden under opaque land)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      const pos = i * resPerTile + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvasSize, pos);
      ctx.stroke();
    }

    const imgData = ctx.createImageData(canvasSize, canvasSize);
    for (let py = 0; py < canvasSize; py++) {
      for (let px = 0; px < canvasSize; px++) {
        const gridX = px / resPerTile;
        const gridY = py / resPerTile;

        let noiseHeight = 0;
        let amp = 1, freq = 1;
        for (let i = 0; i < octaves; i++) {
          const sampleX = (gridX - halfSize + 0.5) / noiseScale * freq + octaveOffsets[i].x;
          const sampleY = (gridY - halfSize + 0.5) / noiseScale * freq + octaveOffsets[i].y;
          noiseHeight += (pn.noise(sampleX, sampleY, 0) * 2 - 1) * amp;
          amp *= persistence;
          freq *= lacunarity;
        }

        let n = (noiseHeight - minNoiseHeight) / (maxNoiseHeight - minNoiseHeight);
        n = applyIslandMask(n, gridY, gridX);
        n = Math.max(0, Math.min(1, n));

        const idx = (py * canvasSize + px) * 4;

        if (n < 0.3) {
          // Ocean layers — 4 contour bands with wavy edges
          // Perturb depth with noise for undulating wave boundaries
          const wave1 = (pn.noise(gridX * 1.2, gridY * 1.2, 0.3) - 0.5) * 0.08;
          const wave2 = (pn.noise(gridX * 0.7, gridY * 0.7, 0.6) - 0.5) * 0.05;
          const perturbedN = n + wave1 + wave2;

          let r: number, g: number, b: number;
          const wn = Math.floor((pn.noise(gridX * 2.5, gridY * 2.5, 0.9) - 0.5) * 20);

          if (perturbedN < 0.10) {
            // Layer 0 — deepest, widest
            r = 4 + wn; g = 35 + wn; b = 75 + wn;
          } else if (perturbedN < 0.16) {
            // Layer 1
            r = 20 + wn; g = 65 + wn; b = 125 + wn;
          } else if (perturbedN < 0.22) {
            // Layer 2
            r = 55 + wn; g = 115 + wn; b = 175 + wn;
          } else if (perturbedN < 0.26) {
            // Layer 3
            r = 100 + wn; g = 165 + wn; b = 220 + wn;
          } else {
            // Layer 4 — shallowest (near islands)
            r = 150 + wn; g = 200 + wn; b = 240 + wn;
          }
          imgData.data[idx] = Math.max(0, Math.min(255, Math.floor(r)));
          imgData.data[idx+1] = Math.max(0, Math.min(255, Math.floor(g)));
          imgData.data[idx+2] = Math.max(0, Math.min(255, Math.floor(b)));
          // Semi-transparent water: deeper = more transparent, shallower = more opaque
          const waterAlpha = 140 + Math.floor((n / 0.3) * 85);
          imgData.data[idx+3] = Math.min(255, waterAlpha);
        } else if (n < 0.35) {
          imgData.data[idx] = 255;
          imgData.data[idx+1] = 235;
          imgData.data[idx+2] = 204;
          imgData.data[idx+3] = 255;
        } else if (n < 0.45) {
          imgData.data[idx] = 0;
          imgData.data[idx+1] = 185;
          imgData.data[idx+2] = 0;
          imgData.data[idx+3] = 255;
        } else if (n < 0.55) {
          imgData.data[idx] = 0;
          imgData.data[idx+1] = 150;
          imgData.data[idx+2] = 0;
          imgData.data[idx+3] = 255;
        } else if (n < 0.85) {
          imgData.data[idx] = 179;
          imgData.data[idx+1] = 145;
          imgData.data[idx+2] = 104;
          imgData.data[idx+3] = 255;
        } else {
          imgData.data[idx] = 255;
          imgData.data[idx+1] = 255;
          imgData.data[idx+2] = 255;
          imgData.data[idx+3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    textureUrl = canvas.toDataURL("image/png");
  }

  return { heightMap: normalized, textureUrl };
};
