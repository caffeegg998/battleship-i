class Battleship {
    private parts: boolean[];
    private origin: [number, number];
    public direction: number;
    public shipType: string;

    constructor(shipLength: number, origin: [number, number], direction: number | boolean, shipType: string = "") {
        this.parts = new Array(shipLength).fill(false);
        this.origin = origin;
        if (typeof direction === 'boolean') {
            this.direction = direction ? 90 : 0;
        } else {
            this.direction = direction;
        }
        this.shipType = shipType;
    }

    get getParts(): boolean[] {
        return this.parts;
    }

    get getLength(): number {
        return this.parts.length;
    }

    get getOrigin(): [number, number] {
        return this.origin;
    }

    get getRotated(): boolean {
        return this.direction === 90 || this.direction === 270;
    }

    get getDirection(): number {
        return this.direction;
    }

    setOrigin(origin: [number, number]): void {
        this.origin = origin;
    }

    setDirection(direction: number): void {
        this.direction = (direction % 360 + 360) % 360;
    }

    setRotated(rotated: boolean): void {
        this.direction = rotated ? 90 : 0;
    }

    hit(part: number): void {
        if(part > this.parts.length - 1) {
            throw new Error("Value higher than ship length");
        }
        this.parts[part] = true;
    }

    isSunk(): boolean {
        return this.parts.every((part) => part);
    }
}

export default Battleship;