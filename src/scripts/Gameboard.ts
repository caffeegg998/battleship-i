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
          const partToHit = Math.abs(shipOrigin[0] - i) + Math.abs(shipOrigin[1] - j);
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

  receiveAttack(location: [number, number]): boolean {
    const state = this.getBoardStates;
    const validAttacks = [...state.shipNotHit, ...state.notShot];
    if(!validAttacks.some((attack) => attack[0] === location[0] && attack[1] === location[1])) {
      return false;
    }
    if(state.notShot.find((el) => el[0] === location[0] && el[1] === location[1])) {
      this.tiles[location[0]][location[1]] = true;
      return true;
    }
    if(state.shipNotHit.find((el) => el[0] === location[0] && el[1] === location[1])) {
      const tile = this.tiles[location[0]][location[1]];
      (tile as Battleship).hit(
        Math.abs((tile as Battleship).getOrigin[0] - location[0]) + Math.abs((tile as Battleship).getOrigin[1] - location[1])
      );
      this.markAroundSunk(tile as Battleship);
      return true;
    }
    return false;
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
      const partsOffset = this.getPlacementOffsets(ship.getLength, ship.getDirection);
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
