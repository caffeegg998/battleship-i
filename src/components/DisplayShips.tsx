import React from "react";
import Battleship from "../scripts/Battleship";
import { ShipsContainer } from "./styled_components/DisplayShipsStyles";
import ShipVisual from "./ShipVisual";

type DisplayShipsProps = {
  player: string,
  ships: Battleship[],
  onShipClick?: (index: number) => void,
  selectedIndex?: number | null,
};

const DisplayShips = ({player, ships, onShipClick, selectedIndex}: DisplayShipsProps) => {
  return (
    <ShipsContainer player={player}>
      {ships.sort((a, b) => a.getLength - b.getLength).map((ship, i) => {
        const zoom = 0.27;
        const isSelected = selectedIndex === i;
        return (
          <div
            key={i}
            onClick={() => onShipClick?.(i)}
            style={{
              position: 'relative',
              height: `calc(((20rem + 14vw) / 10) * ${zoom})`,
              width: `calc((${ship.getLength} * ((20rem + 14vw) / 10) + (${ship.getLength - 1} * 0.2rem)) * ${zoom})`,
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              outline: isSelected ? '2px solid #2ecc71' : 'none',
              outlineOffset: '2px',
              borderRadius: '2px',
              opacity: ship.isSunk() ? 0.5 : 1,
            }}
          >
            <ShipVisual
              length={ship.getLength}
              direction={0}
              isSunk={ship.isSunk()}
              index={ship.shipType === "submarine" ? 1 : 0}
              boardSize={10}
              zoom={zoom}
            />
          </div>
        );
      })}
    </ShipsContainer>
  );
};

export default DisplayShips;
