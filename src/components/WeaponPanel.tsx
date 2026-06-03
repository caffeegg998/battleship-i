import React from 'react';
import Battleship from '../scripts/Battleship';
import { getWeaponsForShip } from '../scripts/WeaponDefs';
import { PanelContainer, PanelTitle, WeaponButton, CloseButton } from './styled_components/WeaponPanelStyles';

type WeaponPanelProps = {
  ship: Battleship | null;
  onSelectWeapon: (weaponId: string) => void;
  selectedWeapon: string | null;
  onClose: () => void;
};

const WeaponPanel = ({ ship, onSelectWeapon, selectedWeapon, onClose }: WeaponPanelProps) => {
  if (!ship) return null;

  const weapons = getWeaponsForShip(ship.shipType);
  const cooldowns = ship.getWeaponCooldowns();

  return (
    <PanelContainer>
      <PanelTitle>{ship.shipType.charAt(0).toUpperCase() + ship.shipType.slice(1)} Weapons</PanelTitle>
      {weapons.map(w => {
        const cd = cooldowns[w.id] || 0;
        const isOnCooldown = cd > 0;
        return (
          <WeaponButton
            key={w.id}
            $active={selectedWeapon === w.id}
            $cooldown={isOnCooldown}
            onClick={() => !isOnCooldown && onSelectWeapon(w.id)}
            disabled={isOnCooldown}
          >
            <span>{w.name}</span>
            <span>{w.description}</span>
            {isOnCooldown && <span>Cooldown: {cd} turn{cd > 1 ? 's' : ''}</span>}
          </WeaponButton>
        );
      })}
      <CloseButton onClick={onClose}>Close</CloseButton>
    </PanelContainer>
  );
};

export default WeaponPanel;
