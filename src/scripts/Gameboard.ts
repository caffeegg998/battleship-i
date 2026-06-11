import Battleship from "./Battleship";

class Gameboard {
  private size: number;
  private tiles: (boolean | Battleship)[][];
  private ships: Battleship[];
  private heightMap: number[][];
  private textureUrl: string;

  constructor(size: number, heightMap?: number[][], textureUrl?: string) {
    this.size = size;
    this.tiles = Array.from({ length: size }, () =>
      new Array(size).fill(false),
    );
    this.ships = [];
    this.heightMap = heightMap || Array.from({ length: size }, () => new Array(size).fill(0));
    this.textureUrl = textureUrl || "";
  }

  get getTiles(): (boolean | Battleship)[][] {
    return this.tiles;
  }

  get getSize(): number {
    return this.size;
  }

  get getShips(): Battleship[] {
    return this.ships;
  }

  get getHeightMap(): number[][] {
    return this.heightMap;
  }

  setHeightMap(heightMap: number[][], textureUrl: string): void {
    this.heightMap = heightMap;
    this.textureUrl = textureUrl;
  }

  get getTextureUrl(): string {
    return this.textureUrl;
  }

  get getBoardStates(): { [state: string]: [number, number][] } {
    const states: { [state: string]: [number, number][] } = {
      shipHit: [],
      shipNotHit: [],
      missed: [],
      landHit: [],
      notShot: [],
    };

    for(let i = 0; i < this.size; ++i) {
      for(let j = 0; j < this.size; ++j) {
        const tile = this.tiles[i][j];
        if(typeof tile === "boolean") {
          if(!tile) {
            states.notShot.push([i, j]);
          }
          else {
            if (this.heightMap[i] && this.heightMap[i][j] >= 0.3) {
              states.landHit.push([i, j]);
            } else {
              states.missed.push([i, j]);
            }
          }
        }
        else {
          const shipParts = tile.getParts;
          const shipOrigin = tile.getOrigin;
          const partToHit = Math.max(Math.abs(shipOrigin[0] - i), Math.abs(shipOrigin[1] - j));
          if(!shipParts[partToHit]) {
            states.shipNotHit.push([i, j]);
          }
          else {
            states.shipHit.push([i, j]);
          }
        }
      }
    }
    return states;
  }

  get getValidTiles(): [number, number][] {
    const valid: [number, number][] = [];
    const offset: [number, number][] = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    for(let i = 0; i < this.size; ++i) {
      for(let j = 0; j < this.size; ++j) {
        // Cannot place on Land
        if (this.heightMap[i][j] >= 0.3) continue;
        if (this.tiles[i][j] !== false) continue;

        if(
          offset.every((off) => {
            if(
              i + off[0] < 0 ||
              i + off[0] > this.size - 1 ||
              j + off[1] < 0 ||
              j + off[1] > this.size - 1
            ) {
              return true;
            }
            return this.tiles[i + off[0]][j + off[1]] === false;
          })
        ) {
          valid.push([i, j]);
        }
      }
    }
    return valid;
  }

  private getPlacementOffsets(shipLength: number, direction: number): [number, number][] {
    return Array.from({ length: shipLength }, (_, k) => {
      if (direction === 0) return [0, k]; // Grows left (origin is right)
      if (direction === 45) return [k, k]; // Grows up-left (origin is bottom-right)
      if (direction === 90) return [k, 0]; // Grows up (origin is bottom)
      if (direction === 135) return [k, -k]; // Grows up-right (origin is bottom-left)
      if (direction === 180) return [0, -k]; // Grows right (origin is left)
      if (direction === 225) return [-k, -k]; // Grows down-right (origin is top-left)
      if (direction === 270) return [-k, 0]; // Grows down (origin is top)
      if (direction === 315) return [-k, k]; // Grows down-left (origin is top-right)
      return [0, k];
    });
  }

  placeShip(shipLength: number, location: [number, number], direction: number | boolean, shipType: string = "", placeLen?: number): void {
    const dir = typeof direction === 'boolean' ? (direction ? 90 : 0) : direction;
    const battleship = new Battleship(shipLength, [location[0], location[1]], dir, shipType);
    const useLen = placeLen ?? shipLength;
    battleship.placedLength = useLen;
    const placementOffset = this.getPlacementOffsets(useLen, dir);
    const contactOffset: number[][] = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    placementOffset.forEach((placement) => {
      const tx = location[0] - placement[0];
      const ty = location[1] - placement[1];

      if(
        tx < 0 ||
        tx > this.size - 1 ||
        ty < 0 ||
        ty > this.size - 1
      ) {
        throw new Error("Invalid location.");
      }

      // Block land placement
      if (this.heightMap[tx][ty] >= 0.3) {
        throw new Error("Invalid location. Cannot place ships on land.");
      }

      if(this.tiles[tx][ty] !== false) {
        throw new Error("Invalid location.");
      }

      contactOffset.forEach((contact) => {
        if(
          tx + contact[0] < 0 ||
          tx + contact[0] > this.size - 1 ||
          ty + contact[1] < 0 ||
          ty + contact[1] > this.size - 1
        ) {
          return;
        }
        if(this.tiles[tx + contact[0]][ty + contact[1]]) {
          throw new Error("Invalid location.");
        }
      });
    });
    placementOffset.forEach((placement) => {
      this.tiles[location[0] - placement[0]][location[1] - placement[1]] = battleship;
    });
    this.ships.push(battleship);
  }

  removeShip(location: number[]): void | Battleship {
    if(typeof this.tiles[location[0]][location[1]] === "boolean") return;

    const ship = this.tiles[location[0]][location[1]] as Battleship;
    const shipLength = ship.placedLength;
    const shipOrigin = ship.getOrigin;
    const shipDirection = ship.getDirection;
    const offset = this.getPlacementOffsets(shipLength, shipDirection);

    offset.forEach((off) => {
      this.tiles[shipOrigin[0] - off[0]][shipOrigin[1] - off[1]] = false;
    });
    this.ships = this.ships.filter((s) => s !== ship);

    return ship;
  }

  rotateShip(location: [number, number]): boolean {
    const ship = this.removeShip(location);
    if(ship) {
      try {
        this.placeShip(ship.getLength, ship.getOrigin, (ship.getDirection + 90) % 360, ship.shipType);
        return true;
      }
      catch {
        this.placeShip(ship.getLength, ship.getOrigin, ship.getDirection, ship.shipType);
        return false;
      }
    }
    return false;
  }

  moveShip(from: [number, number], to: [number, number]): boolean {
    const ship = this.removeShip(from);
    if(ship) {
      try {
        this.placeShip(ship.getLength, to, ship.getDirection, ship.shipType);
        return true;
      }
      catch {
        this.placeShip(ship.getLength, from, ship.getDirection, ship.shipType);
        return false;
      }
    }
    return false;
  }

  canMoveShipTo(ship: Battleship, newR: number, newC: number): boolean {
    const useLen = ship.placedLength;
    const dir = ship.getDirection;
    const offsets = this.getPlacementOffsets(useLen, dir);

    const newPositions: [number, number][] = [];
    for (const [ox, oy] of offsets) {
      const tx = newR - ox;
      const ty = newC - oy;
      if (tx < 0 || tx >= this.size || ty < 0 || ty >= this.size) return false;
      if (this.heightMap[tx][ty] >= 0.3) return false;
      newPositions.push([tx, ty]);
    }

    for (const [tx, ty] of newPositions) {
      const tile = this.tiles[tx][ty];
      if (typeof tile !== 'boolean' && tile !== ship) return false;
    }
    return true;
  }

  moveShipDelta(shipIndex: number, deltaRow: number, deltaCol: number): boolean {
    if (deltaRow === 0 && deltaCol === 0) return false;
    const ship = this.ships[shipIndex];
    if (!ship) return false;

    const [origR, origC] = ship.getOrigin;
    const newR = origR + deltaRow;
    const newC = origC + deltaCol;

    if (!this.canMoveShipTo(ship, newR, newC)) return false;

    const useLen = ship.placedLength;
    const dir = ship.getDirection;
    const offsets = this.getPlacementOffsets(useLen, dir);

    for (const [ox, oy] of offsets) {
      this.tiles[origR - ox][origC - oy] = false;
    }
    for (const [ox, oy] of offsets) {
      this.tiles[newR - ox][newC - oy] = ship;
    }
    ship.setOrigin([newR, newC]);
    return true;
  }

  rotateShipInPlace(shipIndex: number, deltaDir: number): boolean {
    const ship = this.ships[shipIndex];
    if (!ship) return false;

    const [origR, origC] = ship.getOrigin;
    const oldDir = ship.getDirection;
    const newDir = ((oldDir + deltaDir) % 360 + 360) % 360;
    if (oldDir === newDir) return false;

    const oldUseLen = ship.placedLength;
    const newUseLen = ship.getLength >= 3 && newDir % 90 !== 0 ? ship.getLength - 1 : ship.getLength;
    const oldOffsets = this.getPlacementOffsets(oldUseLen, oldDir);
    const newOffsets = this.getPlacementOffsets(newUseLen, newDir);

    const newR = origR - oldOffsets[oldUseLen - 1][0] + newOffsets[newUseLen - 1][0];
    const newC = origC - oldOffsets[oldUseLen - 1][1] + newOffsets[newUseLen - 1][1];

    for (const [ox, oy] of newOffsets) {
      const tx = newR - ox;
      const ty = newC - oy;
      if (tx < 0 || tx >= this.size || ty < 0 || ty >= this.size) return false;
      if (this.heightMap[tx][ty] >= 0.3) return false;
    }

    for (const [ox, oy] of newOffsets) {
      const tx = newR - ox;
      const ty = newC - oy;
      const tile = this.tiles[tx][ty];
      if (typeof tile !== 'boolean' && tile !== ship) return false;
    }

    for (const [ox, oy] of oldOffsets) {
      this.tiles[origR - ox][origC - oy] = false;
    }
    ship.setDirection(newDir);
    ship.setOrigin([newR, newC]);
    ship.placedLength = newUseLen;
    for (const [ox, oy] of newOffsets) {
      this.tiles[newR - ox][newC - oy] = ship;
    }
    return true;
  }

  moveAndRotate(shipIndex: number, deltaDir: number): boolean {
    return this.moveRotateWithStep(shipIndex, deltaDir, 1, "tail");
  }

  reverseAndRotate(shipIndex: number, deltaDir: number): boolean {
    return this.moveRotateWithStep(shipIndex, deltaDir, -1, "origin");
  }

  canReverseAndRotate(shipIndex: number, deltaDir: number): boolean {
    return this.getMoveRotatePlacement(shipIndex, deltaDir, -1, "origin") !== null;
  }

  private getMoveRotatePlacement(shipIndex: number, deltaDir: number, stepDirection: 1 | -1, pivot: "tail" | "origin") {
    const ship = this.ships[shipIndex];
    if (!ship) return null;

    const [origR, origC] = ship.getOrigin;
    const oldDir = ship.getDirection;
    const newDir = ((oldDir + deltaDir) % 360 + 360) % 360;
    if (oldDir === newDir) return null;

    const fwdMap: Record<number, [number, number]> = {
      0: [0, 1], 45: [1, 1], 90: [1, 0], 135: [1, -1],
      180: [0, -1], 225: [-1, -1], 270: [-1, 0], 315: [-1, 1],
    };
    const fd = fwdMap[oldDir] ?? [0, -1];

    const movedR = origR + (fd[0] * stepDirection);
    const movedC = origC + (fd[1] * stepDirection);
    const oldUseLen = ship.placedLength;
    const newUseLen = ship.getLength >= 3 && newDir % 90 !== 0 ? ship.getLength - 1 : ship.getLength;
    const oldOffsets = this.getPlacementOffsets(oldUseLen, oldDir);
    const newOffsets = this.getPlacementOffsets(newUseLen, newDir);

    const tailR = movedR - oldOffsets[oldUseLen - 1][0];
    const tailC = movedC - oldOffsets[oldUseLen - 1][1];
    const newR = pivot === "tail" ? tailR + newOffsets[newUseLen - 1][0] : movedR;
    const newC = pivot === "tail" ? tailC + newOffsets[newUseLen - 1][1] : movedC;

    for (const [ox, oy] of newOffsets) {
      const tx = newR - ox;
      const ty = newC - oy;
      if (tx < 0 || tx >= this.size || ty < 0 || ty >= this.size) return null;
      if (this.heightMap[tx][ty] >= 0.3) return null;
    }
    for (const [ox, oy] of newOffsets) {
      const tx = newR - ox;
      const ty = newC - oy;
      const tile = this.tiles[tx][ty];
      if (typeof tile !== 'boolean' && tile !== ship) return null;
    }

    return { ship, origR, origC, oldOffsets, newOffsets, newR, newC, newDir, newUseLen };
  }

  private moveRotateWithStep(shipIndex: number, deltaDir: number, stepDirection: 1 | -1, pivot: "tail" | "origin"): boolean {
    const placement = this.getMoveRotatePlacement(shipIndex, deltaDir, stepDirection, pivot);
    if (!placement) return false;
    const { ship, origR, origC, oldOffsets, newOffsets, newR, newC, newDir, newUseLen } = placement;

    for (const [ox, oy] of oldOffsets) {
      this.tiles[origR - ox][origC - oy] = false;
    }
    ship.setDirection(newDir);
    ship.setOrigin([newR, newC]);
    ship.placedLength = newUseLen;
    for (const [ox, oy] of newOffsets) {
      this.tiles[newR - ox][newC - oy] = ship;
    }
    return true;
  }

  receiveAttack(location: [number, number]): boolean {
    if (
      location[0] < 0 || location[0] >= this.size ||
      location[1] < 0 || location[1] >= this.size
    ) return false;

    const tile = this.tiles[location[0]][location[1]];

    if (typeof tile !== 'boolean') {
      const partIndex = Math.max(
        Math.abs(tile.getOrigin[0] - location[0]),
        Math.abs(tile.getOrigin[1] - location[1])
      );
      tile.hit(partIndex);
      this.markAroundSunk(tile);
      return true;
    }

    this.tiles[location[0]][location[1]] = true;
    return true;
  }

  allSunk(): boolean {
    return this.ships.every((ship) => ship.isSunk());
  }

  clearShips(): void {
    this.ships = [];
    this.tiles = Array.from({ length: this.size }, () =>
      new Array(this.size).fill(false),
    );
  }

  distributeShips(ships: number[]): boolean {
    const done: boolean[] = [];
    const types = ["carrier", "battleship", "cruiser", "submarine", "destroyer"];
    ships
      .map((len, idx) => ({ len, type: types[idx] }))
      .sort((a, b) => b.len - a.len)
      .forEach(({ len, type }) => {
        let success = false;
        const tried: [[number, number], number][] = [];
        let location: [number, number] = [
          Math.floor(Math.random() * this.size),
          Math.floor(Math.random() * this.size)
        ];
        let direction: number = Math.floor(Math.random() * 4) * 90;
        const find = () => {
          return tried.find((el) =>
            el[0][0] === location[0] && el[0][1] === location[1] && el[1] === direction
          );
        }
        do {
          try {
            do {
              location = [
                Math.floor(Math.random() * this.size),
                Math.floor(Math.random() * this.size)
              ];
              direction = Math.floor(Math.random() * 4) * 90;
            } while(
              find()
            );
            this.placeShip(len, location, direction, type);
            success = true;
          }
          catch {
            tried.push([location, direction]);
            success = false;
          }
        } while(!success && tried.length < this.size * this.size * 4); // * 4 for directions
        done.push(success);
      });
    return done.every((d) => d);
  }

  private markAroundSunk(ship: Battleship): void {
    if(ship.isSunk()) {
      const origin = ship.getOrigin;
      const partsOffset = this.getPlacementOffsets(ship.placedLength, ship.getDirection);
      const aroundOffset: number[][] = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];
      partsOffset.forEach((part) => {
        aroundOffset.forEach((around) => {
          const tx = origin[0] - part[0] + around[0];
          const ty = origin[1] - part[1] + around[1];
          if(
            tx < 0 ||
            tx > this.size - 1 ||
            ty < 0 ||
            ty > this.size - 1
          ) {
            return;
          }
          // Don't mark Land as 'true' (missed/hit marker) automatically
          if (this.heightMap[tx][ty] >= 0.3) return;

          if(!this.tiles[tx][ty]) {
            this.tiles[tx][ty] = true;
          }
        });
      });
    }
  }
}

export default Gameboard;
