import styled, { css } from "styled-components";

const ShipsContainer = styled.div<{ player: string }>`
  display: flex;
  flex-direction: column;
  gap: .7rem;
  width: 8rem; /* Fixed width matched with PlayerProfile */
  margin-top: 2rem; /* Align with the board grid */
  
  ${({ player }) => player === "player" && css`
    align-items: flex-end;
  `};
  ${({ player }) => player === "computer" && css`
    align-items: flex-start;
  `};
`;

const ShipWrapper = styled.div`
  display: flex;
  gap: .3rem;
`;

const Part = styled.div<{ $sunk: boolean }>`
  width: .7rem;
  height: .7rem;
  background-color: ${props => props.$sunk ? ({theme})=>theme.colors.shipSunk : ({theme})=>theme.colors.ship};
`;

export {ShipsContainer, ShipWrapper, Part};