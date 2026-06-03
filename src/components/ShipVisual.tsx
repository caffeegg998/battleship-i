import React from 'react';
import {
  ShipContainer,
  InnerShadowWrapper,
  CarrierBase,
  CarrierPlatform,
  CarrierLines1,
  CarrierLines2,
  CarrierLines3,
  BattleshipBase,
  BattleshipHeliport,
  BattleshipFront,
  BattleshipCover,
  BattleshipHelicopter,
  BattleshipAntena,
  BattleshipCannon,
  CruiserPart1,
  CruiserPart2,
  CruiserPart3,
  CruiserPart4,
  SubmarinePart1,
  SubmarinePart2,
  DestroyerPart1,
  DestroyerPart2,
  DestroyerPart3
} from './styled_components/ShipTextures';

type ShipVisualProps = {
  length: number;
  rotated?: boolean;
  direction?: number;
  isSunk?: boolean;
  index?: number;
  boardSize?: number;
  zoom?: number;
};

const ShipVisual = ({ length, rotated = false, direction, isSunk = false, index = 0, boardSize = 10, zoom = 1 }: ShipVisualProps) => {
  const renderShipModel = () => {
    switch (length) {
      case 5:
        return (
          <>
            <CarrierBase />
            <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">

              <CarrierPlatform />
            </InnerShadowWrapper>
            <CarrierLines1 />
            <CarrierLines2 />
            <CarrierLines3 />
          </>
        );
      case 4:
        return (
          <>
            <BattleshipBase />
            <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">
              <BattleshipHeliport />
            </InnerShadowWrapper>
            <InnerShadowWrapper>
              <BattleshipFront />
            </InnerShadowWrapper>
            <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">
              <BattleshipCover />
            </InnerShadowWrapper>
            <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">
              <BattleshipHelicopter />
            </InnerShadowWrapper>
            <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">
              <BattleshipAntena />
            </InnerShadowWrapper>
            <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">
              <BattleshipCannon />
            </InnerShadowWrapper>
          </>
        );
      case 3:
        if (index === 1) {
          return (
            <>
              <SubmarinePart1 />
              <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">
                <SubmarinePart2 />
              </InnerShadowWrapper>
            </>
          );
        }
        return (
          <>
            <CruiserPart1 />
            <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">
              <CruiserPart2 />
            </InnerShadowWrapper>
            <InnerShadowWrapper>
              <CruiserPart3 />
            </InnerShadowWrapper>
            <InnerShadowWrapper>
              <CruiserPart4 />
            </InnerShadowWrapper>
          </>
        );
      case 2:
        return (
          <>
            <DestroyerPart1 />
            <InnerShadowWrapper $shadow="drop-shadow(4px 2px 2px rgba(0, 0, 0, 0.8))">
              <DestroyerPart2 />
            </InnerShadowWrapper>
            <InnerShadowWrapper>
              <DestroyerPart3 />
            </InnerShadowWrapper>
          </>
        );
      default:
        return null;
    }
  };

  const finalDirection = direction !== undefined ? direction : (rotated ? 90 : 0);

  return (
    <ShipContainer $length={length} $direction={finalDirection} $isSunk={isSunk} $boardSize={boardSize} $zoom={zoom}>
      {renderShipModel()}
    </ShipContainer>
  );
};

export default ShipVisual;
