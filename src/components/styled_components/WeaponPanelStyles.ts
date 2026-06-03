import styled, { css } from "styled-components";

export const PanelContainer = styled.div`
  width: 10rem;
  background: rgba(30, 30, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  backdrop-filter: blur(4px);
`;

export const PanelTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const WeaponButton = styled.button<{ $active: boolean; $cooldown: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.4rem 0.5rem;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: ${({ $cooldown }) => ($cooldown ? 'not-allowed' : 'pointer')};
  background: ${({ $active }) => ($active ? 'rgba(46, 204, 113, 0.25)' : 'rgba(255, 255, 255, 0.05)')};
  color: ${({ $cooldown }) => ($cooldown ? 'rgba(255,255,255,0.35)' : '#fff')};
  transition: background 0.15s;
  width: 100%;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: ${({ $cooldown, $active }) =>
      $cooldown ? 'rgba(255, 255, 255, 0.05)' : $active ? 'rgba(46, 204, 113, 0.35)' : 'rgba(255, 255, 255, 0.12)'};
  }

  span:first-child {
    font-size: 0.7rem;
    font-weight: 600;
  }

  span:not(:first-child) {
    font-size: 0.6rem;
    opacity: 0.65;
  }
`;

export const CloseButton = styled.button`
  margin-top: 0.25rem;
  padding: 0.35rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  cursor: pointer;
  font-size: 0.65rem;
  font-family: inherit;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;
