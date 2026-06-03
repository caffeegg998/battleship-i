import styled, { css } from "styled-components";

const ShipsContainer = styled.div<{ player: string }>`
  display: flex;
  flex-direction: column;
  gap: .5rem;
  width: 8rem;
  margin-top: 2rem;
  
  ${({ player }) => player === "player" && css`
    align-items: flex-end;
  `};
  ${({ player }) => player === "computer" && css`
    align-items: flex-start;
  `};
`;

export { ShipsContainer };
