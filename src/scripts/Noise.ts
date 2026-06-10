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

type UnifiedMap = {
  leftHeightMap: number[][];
  rightHeightMap: number[][];
  leftTextureUrl: string;
  rightTextureUrl: string;
};

const mapCache = new Map<string, UnifiedMap>();
const MAX_MAP_CACHE_ENTRIES = 8;

export const generateUnifiedMap = (size: number, seed: number = 20): UnifiedMap => {
  const cacheKey = `${size}:${seed}`;
  const cached = mapCache.get(cacheKey);
  if (cached) return cached;

  const pn = new PerlinNoise();
  const twister = new MersenneTwister(seed);
  const cols = size * 2;

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
  if (size <= 10) numIslands = 2;
  else if (size <= 15) numIslands = 4 + Math.floor(twister.random() * 3); // 4-6
  else if (size <= 20) numIslands = 6 + Math.floor(twister.random() * 2); // 6-7
  else if (size <= 25) numIslands = 7 + Math.floor(twister.random() * 3); // 7-9
  else numIslands = 9 + Math.floor(twister.random() * 3); // 9-11

  type LandMass = {
    centerRow: number;
    centerCol: number;
    radiusRow: number;
    radiusCol: number;
    elevationBoost?: number;
    noiseWeight?: number;
  };

  type ContinentAnchor = {
    row: number;
    col: number;
    kind: "corner" | "outerEdge" | "middleSeam" | "edgeSeam";
  };

  // Place islands across the full unified map
  const islands: LandMass[] = [];
  for (let n = 0; n < numIslands; n++) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const shape = shapes[Math.floor(twister.random() * shapes.length)];
      const w = shape[0], h = shape[1];
      const cr = Math.floor(twister.random() * size);
      const cc = Math.floor(twister.random() * cols);
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

  // Add large continents from 15x30 unified maps upward.
  // Some anchors sit near the center seam so the two boards can share landmasses.
  if (size >= 15) {
    let numContinents: number;
    if (size <= 15) numContinents = 2 + Math.floor(twister.random() * 2); // 2-3
    else if (size <= 20) numContinents = 3 + Math.floor(twister.random() * 2); // 3-4
    else if (size <= 25) numContinents = 3 + Math.floor(twister.random() * 2); // 3-4
    else numContinents = 4 + Math.floor(twister.random() * 3); // 4-6

    const cornerAnchors: ContinentAnchor[] = [
      { row: 2, col: 2, kind: "corner" },
      { row: 2, col: cols - 1 - 2, kind: "corner" },
      { row: size - 1 - 2, col: 2, kind: "corner" },
      { row: size - 1 - 2, col: cols - 1 - 2, kind: "corner" },
    ];
    const seamAnchors: ContinentAnchor[] = [
      { row: Math.floor(size * 0.25), col: size - 1, kind: "middleSeam" },
      { row: Math.floor(size * 0.5), col: size - 1, kind: "middleSeam" },
      { row: Math.floor(size * 0.75), col: size - 1, kind: "middleSeam" },
      { row: Math.floor(size * 0.25), col: size, kind: "middleSeam" },
      { row: Math.floor(size * 0.5), col: size, kind: "middleSeam" },
      { row: Math.floor(size * 0.75), col: size, kind: "middleSeam" },
    ];
    const edgeSeamAnchorGroups: ContinentAnchor[][] = [
      [
        { row: 2, col: size - 1, kind: "edgeSeam" },
        { row: 2, col: size, kind: "edgeSeam" },
      ],
      [
        { row: size - 1 - 2, col: size - 1, kind: "edgeSeam" },
        { row: size - 1 - 2, col: size, kind: "edgeSeam" },
      ],
    ];
    const shuffleAnchors = <T,>(anchors: T[]) => {
      for (let i = anchors.length - 1; i > 0; i--) {
        const j = Math.floor(twister.random() * (i + 1));
        [anchors[i], anchors[j]] = [anchors[j], anchors[i]];
      }
      return anchors;
    };
    const anchorHalf = (anchor: ContinentAnchor) => anchor.col < size ? "left" : "right";
    const halfCounts = {
      left: 0,
      right: 0,
    };
    const optionalSeamAnchors: ContinentAnchor[] = [];
    for (const anchor of shuffleAnchors([...seamAnchors])) {
      if (optionalSeamAnchors.length >= 2) break;
      if (twister.random() < 0.22) {
        optionalSeamAnchors.push(anchor);
        halfCounts[anchorHalf(anchor)] += 1;
      }
    }

    for (let i = edgeSeamAnchorGroups.length - 1; i > 0; i--) {
      const j = Math.floor(twister.random() * (i + 1));
      [edgeSeamAnchorGroups[i], edgeSeamAnchorGroups[j]] = [edgeSeamAnchorGroups[j], edgeSeamAnchorGroups[i]];
    }
    for (const group of edgeSeamAnchorGroups) {
      if (optionalSeamAnchors.length >= 2) break;
      if (twister.random() < 0.18) {
        const anchor = group[Math.floor(twister.random() * group.length)];
        optionalSeamAnchors.push(anchor);
        halfCounts[anchorHalf(anchor)] += 1;
      }
    }
    const anchors = [...optionalSeamAnchors];
    const maxCorners = numContinents <= 3 ? 1 : 2;
    const maxPerHalf = Math.ceil(numContinents / 2);
    let cornerCount = 0;
    const baseAnchorPool = shuffleAnchors([...cornerAnchors]);
    for (const anchor of baseAnchorPool) {
      if (anchors.length >= numContinents) break;
      const half = anchorHalf(anchor);
      if (halfCounts[half] >= maxPerHalf) continue;
      if (anchor.kind === "corner" && cornerCount >= maxCorners) continue;

      anchors.push(anchor);
      halfCounts[half] += 1;
      if (anchor.kind === "corner") cornerCount += 1;
    }
    for (const anchor of baseAnchorPool) {
      if (anchors.length >= numContinents) break;
      if (anchors.includes(anchor)) continue;

      anchors.push(anchor);
      if (anchor.kind === "corner") cornerCount += 1;
    }

    for (let c = 0; c < numContinents; c++) {
      const anchor = anchors[c % anchors.length];
      const isMiddleSeam = anchor.kind === "middleSeam";
      const isEdgeSeam = anchor.kind === "edgeSeam";
      const minRadius = isMiddleSeam || isEdgeSeam
        ? size <= 15 ? 4 : size <= 20 ? 5 : 6
        : size <= 15 ? 5 : size <= 20 ? 7 : 8;
      const radiusRange = isMiddleSeam || isEdgeSeam
        ? size <= 15 ? 2 : 3
        : size <= 15 ? 3 : 5;
      const continentR = minRadius + Math.floor(twister.random() * radiusRange);
      const radiusRow = isEdgeSeam ? Math.max(3, Math.floor(continentR * 0.7)) : continentR;
      const isSeam = isMiddleSeam || isEdgeSeam;
      islands.push({
        centerRow: anchor.row,
        centerCol: anchor.col,
        radiusRow,
        radiusCol: continentR,
        elevationBoost: isSeam ? 0.34 : 0.28,
        noiseWeight: isSeam ? 0.76 : 0.82,
      });
    }
  }

  const halfRows = size / 2;
  const halfCols = cols / 2;

  // Octave offsets with seedable random
  const octaveOffsets = Array.from({ length: octaves }, () => ({
    x: (twister.random() * 200000) - 100000,
    y: (twister.random() * 200000) - 100000
  }));

  // Generate height map over the full unified area
  const fullHeightMap: number[][] = Array.from({ length: size }, () => new Array(cols).fill(0));

  let minNoiseHeight = Number.MAX_VALUE;
  let maxNoiseHeight = -Number.MAX_VALUE;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < cols; x++) {
      const sampleY = (y - halfRows + 0.5) / noiseScale;
      const sampleX = (x - halfCols + 0.5) / noiseScale;

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
      fullHeightMap[y][x] = noiseHeight;
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
        const boostedVal = (val * (island.noiseWeight ?? 1)) + (island.elevationBoost ?? 0);
        const islandVal = boostedVal * falloff;
        if (islandVal > maxVal) maxVal = islandVal;
      }
    }
    return maxVal;
  };

  // Normalize and apply island mask
  const fullNormalized: number[][] = fullHeightMap.map((row, y) => row.map((val, x) => {
    const n = (val - minNoiseHeight) / (maxNoiseHeight - minNoiseHeight);
    return Math.max(0, Math.min(1, applyIslandMask(n, y + 0.5, x + 0.5)));
  }));

  // Split into left and right halves
  const leftHeightMap = fullNormalized.map(row => row.slice(0, size));
  const rightHeightMap = fullNormalized.map(row => row.slice(size));

  // Create High-Res Texture for the full unified map
  const resPerTile = size >= 25 ? 24 : size >= 20 ? 30 : 40;
  const canvasW = cols * resPerTile;
  const canvasH = size * resPerTile;
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  let leftTextureUrl = "";
  let rightTextureUrl = "";

  if (ctx) {
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= cols; i++) {
      const pos = i * resPerTile + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvasH);
      ctx.stroke();
    }
    for (let i = 0; i <= size; i++) {
      const pos = i * resPerTile + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvasW, pos);
      ctx.stroke();
    }

    const imgData = ctx.createImageData(canvasW, canvasH);
    for (let py = 0; py < canvasH; py++) {
      for (let px = 0; px < canvasW; px++) {
        const gridX = px / resPerTile;
        const gridY = py / resPerTile;

        let noiseHeight = 0;
        let amp = 1, freq = 1;
        for (let i = 0; i < octaves; i++) {
          const sampleX = (gridX - halfCols + 0.5) / noiseScale * freq + octaveOffsets[i].x;
          const sampleY = (gridY - halfRows + 0.5) / noiseScale * freq + octaveOffsets[i].y;
          noiseHeight += (pn.noise(sampleX, sampleY, 0) * 2 - 1) * amp;
          amp *= persistence;
          freq *= lacunarity;
        }

        let n = (noiseHeight - minNoiseHeight) / (maxNoiseHeight - minNoiseHeight);
        n = applyIslandMask(n, gridY, gridX);
        n = Math.max(0, Math.min(1, n));

        const idx = (py * canvasW + px) * 4;

        if (n < 0.3) {
          const wave1 = (pn.noise(gridX * 1.2, gridY * 1.2, 0.3) - 0.5) * 0.08;
          const wave2 = (pn.noise(gridX * 0.7, gridY * 0.7, 0.6) - 0.5) * 0.05;
          const perturbedN = n + wave1 + wave2;

          let r: number, g: number, b: number;
          const wn = Math.floor((pn.noise(gridX * 2.5, gridY * 2.5, 0.9) - 0.5) * 20);

          if (perturbedN < 0.10) {
            r = 4 + wn; g = 35 + wn; b = 75 + wn;
          } else if (perturbedN < 0.16) {
            r = 20 + wn; g = 65 + wn; b = 125 + wn;
          } else if (perturbedN < 0.22) {
            r = 55 + wn; g = 115 + wn; b = 175 + wn;
          } else if (perturbedN < 0.26) {
            r = 100 + wn; g = 165 + wn; b = 220 + wn;
          } else {
            r = 150 + wn; g = 200 + wn; b = 240 + wn;
          }
          imgData.data[idx] = Math.max(0, Math.min(255, Math.floor(r)));
          imgData.data[idx+1] = Math.max(0, Math.min(255, Math.floor(g)));
          imgData.data[idx+2] = Math.max(0, Math.min(255, Math.floor(b)));
          const waterAlpha = 140 + Math.floor((n / 0.3) * 85);
          imgData.data[idx+3] = Math.min(255, waterAlpha);
        } else if (n < 0.35) {
          imgData.data[idx] = 255; imgData.data[idx+1] = 235; imgData.data[idx+2] = 204; imgData.data[idx+3] = 255;
        } else if (n < 0.45) {
          imgData.data[idx] = 0; imgData.data[idx+1] = 185; imgData.data[idx+2] = 0; imgData.data[idx+3] = 255;
        } else if (n < 0.55) {
          imgData.data[idx] = 0; imgData.data[idx+1] = 150; imgData.data[idx+2] = 0; imgData.data[idx+3] = 255;
        } else if (n < 0.85) {
          imgData.data[idx] = 179; imgData.data[idx+1] = 145; imgData.data[idx+2] = 104; imgData.data[idx+3] = 255;
        } else {
          imgData.data[idx] = 255; imgData.data[idx+1] = 255; imgData.data[idx+2] = 255; imgData.data[idx+3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Extract left and right halves as separate textures
    const leftCanvas = document.createElement("canvas");
    leftCanvas.width = size * resPerTile;
    leftCanvas.height = size * resPerTile;
    const leftCtx = leftCanvas.getContext("2d");
    if (leftCtx) {
      leftCtx.drawImage(canvas, 0, 0, size * resPerTile, size * resPerTile, 0, 0, size * resPerTile, size * resPerTile);
      leftTextureUrl = leftCanvas.toDataURL("image/png");
    }

    const rightCanvas = document.createElement("canvas");
    rightCanvas.width = size * resPerTile;
    rightCanvas.height = size * resPerTile;
    const rightCtx = rightCanvas.getContext("2d");
    if (rightCtx) {
      rightCtx.drawImage(canvas, size * resPerTile, 0, size * resPerTile, size * resPerTile, 0, 0, size * resPerTile, size * resPerTile);
      rightTextureUrl = rightCanvas.toDataURL("image/png");
    }
  }

  const result = { leftHeightMap, rightHeightMap, leftTextureUrl, rightTextureUrl };
  mapCache.set(cacheKey, result);
  if (mapCache.size > MAX_MAP_CACHE_ENTRIES) {
    const firstKey = mapCache.keys().next().value;
    if (firstKey !== undefined) {
      mapCache.delete(firstKey);
    }
  }

  return result;
};
