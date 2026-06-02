import styled, { css, keyframes } from "styled-components";

const fire1Anime = keyframes`
 0% { transform:translateY(20px) rotate(50deg); height:0px; width:0px; border-radius:0%; background-color:#FFDC01; }
 20% { transform:translateY(15px) rotate(40deg); height:15px; width:15px; border-radius:5%; background-color:#FFDC01; }
 40% { transform:translateY(10px) rotate(30deg); height:15px; width:15px; border-radius:10%; background-color:#FDAC01; }
 60% { transform:translateY(5px) rotate(20deg); height:10px; width:10px; border-radius:20%; background-color:#FDAC01; }
 80% { transform:translateY(0px) rotate(10deg); height:0px; width:0px; border-radius:30%; background-color:#F73B01; }
`;

export const ShipContainer = styled.div<{ $length: number, $direction: number, $isSunk?: boolean, $boardSize?: number }>`
  position: absolute;
  height: calc((14rem + 10vw) / ${({ $boardSize }) => $boardSize || 10});
  width: calc((${({ $length }) => $length} * ((14rem + 10vw) / ${({ $boardSize }) => $boardSize || 10})) + ((${({ $length }) => $length} - 1) * 0.2rem));
  pointer-events: none;
  z-index: 5;
  filter: drop-shadow(4px 4px 3px rgba(0, 0, 0, 0.4));
  
  transform: rotate(${({ $direction }) => $direction}deg);
  transform-origin: calc(((14rem + 10vw) / ${({ $boardSize }) => $boardSize || 10}) / 2) calc(((14rem + 10vw) / ${({ $boardSize }) => $boardSize || 10}) / 2);

  ${({ $isSunk }) => $isSunk && css`
    opacity: 0.7;
    filter: grayscale(0.5) brightness(0.5) drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3));
  `}
`;

export const ShipPart = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`;

// Wrapper to allow drop-shadow outside of clip-path
export const InnerShadowWrapper = styled(ShipPart)<{ $shadow?: string }>`
  filter: ${({ $shadow }) => $shadow || 'drop-shadow(3px 5px 3px rgba(0, 0, 0, 0.6))'};
`;

// Carrier (Length 5)
export const CarrierBase = styled(ShipPart)`
  background-color: #555;
  filter: brightness(0.6);
  clip-path: polygon(4% 34%, 2% 34%, 2% 62%, 4% 72%, 4% 86%, 23% 87%, 24% 90%, 24% 97%, 26% 97%, 26% 94%, 26% 88%, 27% 88%, 27% 96%, 29% 97%, 30% 90%, 35% 88%, 36% 93%, 38% 88%, 40% 87%, 45% 89%, 46% 86%, 67% 87%, 74% 71%, 74% 78%, 77% 78%, 79% 70%, 97% 64%, 97% 38%, 91% 36%, 91% 34%, 81% 32%, 80% 26%, 77% 27%, 76% 31%, 75% 31%, 67% 8%, 57% 8%, 57% 7%, 55% 7%, 55% 13%, 49% 14%, 49% 10%, 48% 11%, 48% 13%, 47% 13%, 47% 12%, 45% 12%, 44% 13%, 44% 10%, 43% 9%, 43% 13%, 41% 12%, 41% 15%, 40% 15%, 40% 12%, 33% 12%, 33% 11%, 33% 7%, 32% 13%, 31% 8%, 26% 8%, 23% 15%, 15% 15%, 14% 13%, 11% 13%, 11% 18%, 8% 18%, 8% 19%, 4% 19%);
`;

export const CarrierPlatform = styled(ShipPart)`
  background-color: #777;
  filter: brightness(0.8);
  clip-path: polygon(2% 36%, 2% 59%, 3% 72%, 6% 72%, 6% 86%, 25% 86%, 25% 83%, 27% 78%, 28% 77%, 29% 80%, 31% 81%, 31% 86%, 39% 86%, 39% 71%, 45% 71%, 45% 86%, 54% 85%, 54% 71%, 60% 71%, 60% 86%, 67% 86%, 74% 69%, 96% 62%, 96% 39%, 75% 32%, 66% 9%, 58% 9%, 53% 15%, 43% 15%, 43% 13%, 41% 12%, 41% 15%, 32% 16%, 31% 12%, 25% 11%, 23% 15%, 21% 14%, 21% 30%, 15% 30%, 16% 15%, 11% 15%, 10% 32%);
`;

export const CarrierLines1 = styled(ShipPart)`
  width: 65%;
  height: 0;
  border-top: yellow dashed 2px;
  transform: rotate(-9deg) translate(5%, 610%);
  border-radius: 10px;
`;

export const CarrierLines2 = styled(ShipPart)`
  width: 65%;
  height: 0;
  border-top: grey solid 2px;
  transform: rotate(-9deg) translate(2%, 460%);
  border-radius: 100px;
`;

export const CarrierLines3 = styled(ShipPart)`
  width: 65%;
  height: 0px;
  border-top: grey solid 2px;
  transform: rotate(-9deg) translate(12%, 800%);
  border-radius: 10px;
`;

// Battleship (Length 4)
export const BattleshipBase = styled(ShipPart)`
  background-color: #333;
  filter: brightness(0.6);
  clip-path: polygon(1% 15%, 1% 85%, 65% 85%, 76% 79%, 85% 72%, 99% 52%, 99% 48%, 85% 28%, 76% 21%, 65% 15%);
`;

export const BattleshipHeliport = styled(ShipPart)`
  background-color: #727272;
  filter: brightness(0.7);
  clip-path: inset(20% 82% 20% 3% round 2px);
`;

export const BattleshipFront = styled(ShipPart)`
  background-color: #dbdbdb;
  filter: brightness(0.7);
  clip-path: polygon(65% 20%, 64% 24%, 73% 40%, 73% 60%, 64% 76%, 65% 80%, 74% 78%, 85% 68%, 85% 32%, 74% 22%);
`;

export const BattleshipCover = styled(ShipPart)`
  background-color: #9c9c9c;
  filter: brightness(0.8);
  clip-path: polygon(20% 25%, 20% 75%, 30% 75%, 30% 70%, 36% 70%, 39% 65%, 39% 35%, 36% 30%, 30% 30%, 30% 25%);
`;

export const BattleshipHelicopter = styled(ShipPart)`
  background-color: #ffffff;
  filter: brightness(0.9);
  clip-path: polygon(0% 49%, 3% 49%, 3% 42%, 4% 42%, 5% 49%, 7% 49%, 8% 47%, 9% 46%, 6% 22%, 7% 20%, 10% 45%, 12% 45%, 15% 23%, 16% 24%, 13% 45%, 14% 46%, 15% 50%, 14% 54%, 13% 55%, 16% 76%, 15% 77%, 12% 55%, 10% 55%, 7% 80%, 6% 78%, 9% 54%, 8% 53%, 7% 51%, 5% 51%, 4% 58%, 3% 58%, 3% 51%, 0% 51%);
`;

export const BattleshipAntena = styled(ShipPart)`
  background-color: #c5c5c5;
  clip-path: polygon(50% 25%, 49% 43%, 48% 45%, 48% 55%, 49% 57%, 50% 75%, 51% 75%, 52% 60%, 56% 60%, 57% 75%, 61% 75%, 64% 68%, 64% 32%, 61% 25%, 57% 25%, 56% 40%, 52% 40%, 51% 25%, 50% 25%, 49% 43%);
`;

export const BattleshipCannon = styled(ShipPart)`
  background-color: #ffffff;
  filter: brightness(0.9);
  clip-path: polygon(90% 47%, 90% 53%, 80% 55%, 80% 65%, 76% 65%, 75% 60%, 75% 40%, 76% 35%, 80% 35%, 80% 45%);
`;

// Cruiser (Length 3)
export const CruiserPart1 = styled(ShipPart)`
  filter: brightness(0.6);
  background-color: #333;
  clip-path: polygon(4% 32%, 4% 68%, 8% 70%, 9% 75%, 13% 77%, 33% 79%, 60% 80%, 69% 80%, 77% 79%, 82% 76%, 87% 72%, 93% 65%, 96% 58%, 97% 50%, 96% 42%, 93% 35%, 87% 28%, 82% 24%, 77% 21%, 69% 20%, 60% 20%, 33% 21%, 13% 23%, 9% 25%, 8% 30%);
`;

export const CruiserPart2 = styled(ShipPart)`
  filter: brightness(0.7);
  background-color: #636262;
  clip-path: polygon(12% 24%, 12% 49%, 12% 76%, 36% 79%, 58% 79%, 73% 79%, 78% 75%, 81% 65%, 82% 54%, 86% 50%, 82% 46%, 81% 35%, 78% 25%, 73% 21%, 58% 21%, 36% 21%);
`;

export const CruiserPart3 = styled(ShipPart)`
  filter: brightness(0.8);
  background-color: #8d8c8c;
  clip-path: polygon(30% 26%, 33% 32%, 33% 50%, 33% 68%, 30% 74%, 33% 77%, 68% 77%, 71% 70%, 73% 50%, 71% 30%, 68% 23%, 33% 23%);
`;

export const CruiserPart4 = styled(ShipPart)`
  filter: brightness(0.9);
  background-color: #ffffff;
  clip-path: polygon(55% 31%, 57% 43%, 57% 57%, 55% 69%, 53% 72%, 43% 72%, 34% 70%, 32% 50%, 34% 30%, 43% 28%, 53% 28%);
`;

export const SubmarinePart1 = styled(ShipPart)`
  background-color: #333;
  filter: brightness(0.6);
  clip-path: polygon(94% 41%, 91% 36%, 87% 33%, 85% 30%, 84% 18%, 83% 18%, 82% 30%, 33% 29%, 29% 30%, 23% 33%, 14% 40%, 13% 33%, 12% 29%, 10% 29%, 10% 43%, 7% 46%, 7% 41%, 3% 43%, 3% 57%, 7% 59%, 7% 54%, 10% 57%, 10% 71%, 12% 71%, 13% 67%, 14% 60%, 23% 67%, 29% 70%, 33% 71%, 82% 70%, 83% 82%, 84% 82%, 85% 70%, 87% 67%, 91% 64%, 94% 59%, 95% 50%);
`;

export const SubmarinePart2 = styled(ShipPart)`
  background-color: #f7f7f7;
  filter: brightness(0.9);
  clip-path: polygon(78% 40%, 74% 38%, 61% 40%, 58% 42%, 56% 50%, 58% 58%, 61% 60%, 74% 62%, 78% 60%, 80% 50%);
`;

// Destroyer (Length 2)
export const DestroyerPart1 = styled(ShipPart)`
  background-color: #333;
  filter: brightness(0.6);
  clip-path: polygon(14% 30%, 9% 35%, 5% 50%, 9% 65%, 14% 70%, 37% 78%, 55% 79%, 70% 75%, 83% 67%, 94% 50%, 83% 33%, 70% 25%, 55% 21%, 37% 22%);
`;

export const DestroyerPart2 = styled(ShipPart)`
  background-color: #ffffff;
  filter: brightness(0.8);
  clip-path: polygon(35% 30%, 35% 70%, 39% 60%, 50% 64%, 51% 77%, 60% 67%, 60% 33%, 51% 23%, 50% 36%, 39% 40%);
`;

export const DestroyerPart3 = styled(ShipPart)`
  background-color: #bebebe;
  filter: brightness(0.9);
  clip-path: polygon(16% 38%, 16% 62%, 34% 70%, 34% 30%);
`;

// Fire Effect
export const FireContainer = styled.div`
  position: absolute;
  width: calc(1.4rem + 1vw);
  height: calc(1.4rem + 1vw);
  pointer-events: none;
`;

export const Flame = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 15px;
  height: 15px;
  background-color: yellow;
  border-radius: 5%;
  transform: translateX(-50%) rotate(45deg);
  animation: ${fire1Anime} 1.5s infinite linear;
`;

export const Hole = styled.div`
  position: absolute;
  width: 70%;
  height: 70%;
  top: 15%;
  left: 15%;
  background-color: black;
  clip-path: polygon(50% 17%, 62% 31%, 98% 35%, 73% 58%, 65% 79%, 48% 80%, 23% 85%, 20% 56%, 2% 35%, 30% 29%);
`;
