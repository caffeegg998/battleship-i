import styled from "styled-components";

const BoardsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  position: relative;
  margin-top: 5rem;

  @media (max-width: 1035px) {
    flex-direction: column;
    align-items: center;
    gap: 3rem;
  }
`;

const BoardContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
  position: relative;
`;

const TimerDisplay = styled.div<{ $isLow: boolean }>`
  position: absolute;
  top: -4.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.displayBackground};
  border: 2px solid ${({ theme, $isLow }) => $isLow ? 'red' : theme.colors.displayBorder};
  padding: 0.4rem 1.5rem;
  border-radius: 20px;
  font-size: 1.3rem;
  font-weight: bold;
  color: ${({ $isLow }) => $isLow ? 'red' : 'inherit'};
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  z-index: 10;
`;

const ExplosionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  pointer-events: none;

  img {
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
  }
`;

const FooterContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  margin-top: 2rem;
  padding: 0.75rem 2rem;
  background: rgba(30, 30, 40, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  width: 100%;
  box-sizing: border-box;
`;

const FooterSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 200px;
`;

const FooterLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.5);
`;

const FooterRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
`;

const ShipsRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
`;

const ShipTile = styled.div<{ $selected?: boolean; $sunk?: boolean }>`
  position: relative;
  cursor: pointer;
  outline: ${({ $selected }) => ($selected ? '2px solid #2ecc71' : 'none')};
  outline-offset: 2px;
  border-radius: 2px;
  opacity: ${({ $sunk }) => ($sunk ? 0.4 : 1)};
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const FooterDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.1);
`;

export { BoardContainer, BoardsContainer, TimerDisplay, ExplosionOverlay, FooterContainer, FooterSection, FooterLabel, FooterRow, ShipsRow, ShipTile, FooterDivider };
