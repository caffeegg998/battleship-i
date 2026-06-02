import styled from "styled-components";

const BoardContainer = styled.div<{ $size?: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;

  .board-viewport-shell {
    position: relative;
    max-width: 100%;
  }

  .board-axis-y-viewport,
  .board-axis-x-viewport {
    position: absolute;
    z-index: 35;
    pointer-events: none;
    overflow: hidden;
    background-color: ${({ theme }) => theme.colors.gridBackground};
  }

  .board-axis-y-viewport {
    left: 0;
    top: 0;
    width: 1.5rem;
  }

  .board-axis-x-viewport {
    left: 0;
    bottom: 0;
    height: 1.5rem;
    max-width: calc(100vw - 2rem);
  }

  .board-axis-y-layer,
  .board-axis-x-layer {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .board-viewport {
    max-width: calc(100vw - 2rem);
    position: relative;
    scrollbar-width: thin;
  }

  .board-zoom-space {
    position: relative;
  }

  .board-viewport.zoomed {
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-radius: 6px;
    background-color: ${({ theme }) => theme.colors.gridBackground};
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
  }

  .board-minimap {
    position: absolute;
    right: 0.6rem;
    bottom: 0.6rem;
    width: 6.5rem;
    aspect-ratio: 1;
    z-index: 30;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.85);
    border-radius: 4px;
    background-color: ${({ theme }) => theme.colors.gridBackground};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
    cursor: pointer;
  }

  .board-minimap img,
  .board-minimap-grid {
    position: absolute;
    inset: 0;
  }

  .board-minimap img {
    width: 100%;
    height: 100%;
    object-fit: fill;
  }

  .board-minimap-grid {
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.18) 1px, transparent 1px);
    background-size:
      calc(100% / ${({ $size }) => $size || 10}) calc(100% / ${({ $size }) => $size || 10});
  }

  .board-minimap-viewport {
    position: absolute;
    right: auto;
    bottom: auto;
    border: 2px solid #ffffff;
    background-color: rgba(255, 255, 255, 0.18);
    box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.24);
    box-sizing: border-box;
    pointer-events: none;
  }

  .board-axis-label {
    position: absolute;
    z-index: 14;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
    transform-origin: center;
  }

  .board-axis-y-label {
    left: 0;
    width: 1.5rem;
    height: 1rem;
  }

  .board-axis-x-label {
    top: 0;
    width: 1.5rem;
    height: 1.5rem;
  }

  .board-wrapper {
    opacity: .4;
    
    position: relative; /* Container for absolute ships */
    display: flex;
    flex-direction: column;
    padding-left: 1.5rem; /* Space for row numbers */
    padding-bottom: 1.5rem; /* Space for column letters */
    counter-reset: row column;
    font-size: 1rem;
    font-weight: 700;

    .board-row {
    
      background-color: ${({ theme }) => theme.colors.gridBackground};
      display: flex;
      flex-direction: row;
      counter-increment: row;
      counter-reset: column;
      position: relative;
      font-size: 10px;

       

 
      
      &::before {
        display: none;
      }

      &:last-child {
       
        .board-tile {
          &::after {
            display: none;
          }
        }
      }

      .board-tile {
        position: relative;
        counter-increment: column;
        width: calc((14rem + 10vw) / ${({ $size }) => $size || 10});
        height: calc((14rem + 10vw) / ${({ $size }) => $size || 10});
        margin: .1rem;
        background-color: ${({ theme }) => theme.colors.gridBackground};
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        font-size: 10px;
        transition: border 0.2s ease;
      }

      .land-tile-logic {
        /* Logical land tiles are visually handled by texture overlay */
        border-color: transparent;
      }

        .ship-not-hit {
          background-color: ${({ theme }) => theme.colors.ship};
          cursor: pointer;
        }

        .ship-hit {
          background-color: #c86b85;

          &::before {
            content: '\\f00d';
            position: absolute;
            font-family: 'Font Awesome 5 Free', sans-serif;
            font-weight: 1000;
            font-size: 15px;
            left: 50%;
            top: 52%;
            transform: translate(-50%, -50%);
          }
        }

        .ship-sunk {
          background-color: #bbbbbb;

          &::before {
            content: '\\f00d';
            position: absolute;
            font-family: 'Font Awesome 5 Free', sans-serif;
            font-weight: 1000;
            font-size: 15px;
            left: 50%;
            top: 52%;
            transform: translate(-50%, -50%);
          }
        }

        .missed {
          background-color: #2c8af5;

          &::before {
            content: '💣';
            position: absolute;
            font-family: 'Font Awesome 5 Free', sans-serif;
            font-weight: 1000;
            font-size: 7px;
            left: 50%;
            color: white;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }

        .land-hit {
          background-color: #8B5E3C;

          &::before {
            content: '●';
            position: absolute;
            font-size: 10px;
            left: 50%;
            color: #FFE0B2;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }

        .marked {
          background-color: ${({ theme }) => theme.colors.marked};
        }

        .marked-origin {
          background-color: ${({ theme }) => theme.colors.marked};

          &::before {
            content: '\\f0e2';
            position: absolute;
            font-family: 'Font Awesome 5 Free', sans-serif;
            font-weight: 1000;
            font-size: 13px;
            left: 50%;
            top: 53%;
            transform: translate(-50%, -50%);
          }
        }

        .valid {
          background-color: ${({ theme }) => theme.colors.valid};
        }

        .valid-origin {
          background-color: ${({ theme }) => theme.colors.valid};
        }

        .invalid {
          background-color: ${({ theme }) => theme.colors.invalid};
        }

        .invalid-origin {
          background-color: ${({ theme }) => theme.colors.invalid};
        }
    }
  }

  .active {
    opacity: .8;

    .board-row {
      .board-tile {

        &:hover {
          border: 1px solid #ffffff;
          cursor: pointer;
        }
      }
    }
  }
`;

const Header = styled.h4`
  margin-top: .6rem;
  font-weight: 500;
  font-size: 1.3rem;
`;

export { BoardContainer, Header };
