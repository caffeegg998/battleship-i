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

export { BoardContainer, BoardsContainer, TimerDisplay, ExplosionOverlay };
