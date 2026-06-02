import Gameboard from "./Gameboard";
import Battleship from "./Battleship";

class Player {
  private board: Gameboard;
  private name: string;
  private avatar: string;

  constructor(board: Gameboard, name: string) {
    this.board = board;
    this.name = name;
    this.avatar = '';
  }

  get getBoard(): Gameboard {
    return this.board;
  }

  get getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  get getAvatar(): string {
    return this.avatar;
  }

  setAvatar(avatar: string): void {
    this.avatar = avatar;
  }

  chooseAttack(board: Gameboard): number[] {
    const state = board.getBoardStates;
    let attacks: [number, number][] = [];

    if(state.shipHit.length > 0) {
      const shipsDamaged = state.shipHit.filter((loc) => {
        return !(board.getTiles[loc[0]][loc[1]] as Battleship).isSunk();
      });
      if(shipsDamaged.length > 0) {
        let offset: [number, number][] = [
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, 0]
        ];
        shipsDamaged.forEach((pos) => {
          if((board.getTiles[pos[0]][pos[1]] as Battleship).getParts.filter((part) => part).length > 1) {
            offset = (board.getTiles[pos[0]][pos[1]] as Battleship).getRotated
              ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
          }
          offset.forEach((off) => {
            if(
              pos[0] + off[0] < 0 ||
              pos[0] + off[0] > board.getSize - 1 ||
              pos[1] + off[1] < 0 ||
              pos[1] + off[1] > board.getSize - 1
            ) {
              return;
            }
            const nr = pos[0] + off[0];
            const nc = pos[1] + off[1];
            if(!state.shipHit.find((el) => el[0] === nr && el[1] === nc)
            && !state.missed.find((el) => el[0] === nr && el[1] === nc)
            && !state.landHit?.find((el) => el[0] === nr && el[1] === nc)) {
              attacks.push([nr, nc]);
            }
          });
        });
        if(attacks.length > 0) {
          return attacks[Math.floor(Math.random() * attacks.length)];
        }
      }
    }
    attacks = [...state.shipNotHit, ...state.notShot];
    return attacks[Math.floor(Math.random() * attacks.length)];
  }
}

export default Player;