import styled from "styled-components";

const BoardsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  position: relative;
  margin-top: 0.5rem;
  padding-bottom: 0.5rem;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;

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
  position: relative;
  z-index: 100;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem;
  background: rgba(30, 30, 40, 0.9);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
`;

const FooterSide = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
`;

const FooterCenter = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
`;

const FooterRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
`;

const FooterRowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
`;

const FooterSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
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
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
`;

const ShipsRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.3rem;
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

export { BoardContainer, BoardsContainer, TimerDisplay, ExplosionOverlay, FooterContainer, FooterSection, FooterLabel, FooterRow, ShipsRow, ShipTile, FooterDivider, FooterRowWrapper, FooterSide, FooterCenter, FooterRight };
