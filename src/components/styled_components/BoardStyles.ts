import styled from "styled-components";

const BoardContainer = styled.div<{ $size?: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;

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
      
        position: absolute;
        right: 100%;
        margin-right: .5rem;
        top: 50%;
        transform: translateY(-50%);
        content: counter(row);
      }

      &:last-child {
       
        .board-tile {
          &::after {
            position: absolute;
            top: 110%;
            left: 50%;
            transform: translateX(-50%);
            content: counter(column, upper-latin);
            
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
        border: 1px solid rgba(255, 255, 255, 0.04);
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