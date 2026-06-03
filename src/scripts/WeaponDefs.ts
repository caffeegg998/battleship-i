export type WeaponType = 'normal' | 'sonar' | 'barrage' | 'bomb' | 'torpedo' | 'cannon_volley';

export interface WeaponDef {
  id: string;
  name: string;
  description: string;
  cooldown: number;
}

export const SHIP_WEAPONS: Record<string, WeaponDef[]> = {
  carrier: [
    { id: 'normal', name: 'Normal Fire', description: 'Fire 1 shot', cooldown: 0 },
    { id: 'bomb', name: 'Bomb Drop', description: 'Drop bomb, hits after 2 turns', cooldown: 2 },
  ],
  battleship: [
    { id: 'normal', name: 'Normal Fire', description: 'Fire 1 shot', cooldown: 0 },
    { id: 'cannon_volley', name: 'Cannon Volley', description: 'Fire 4 shots at once', cooldown: 1 },
  ],
  cruiser: [
    { id: 'normal', name: 'Normal Fire', description: 'Fire 1 shot', cooldown: 0 },
    { id: 'sonar', name: 'Sonar Radar', description: 'Scan 3×3 area to detect ships', cooldown: 2 },
    { id: 'barrage', name: 'Barrage', description: 'Fire 6 shots at once', cooldown: 2 },
  ],
  submarine: [
    { id: 'normal', name: 'Normal Fire', description: 'Fire 1 shot', cooldown: 0 },
    { id: 'torpedo', name: 'Torpedo', description: 'Fire 3 shots in a line', cooldown: 1 },
  ],
  destroyer: [
    { id: 'normal', name: 'Normal Fire', description: 'Fire 1 shot', cooldown: 0 },
  ],
};

export const getWeaponsForShip = (shipType: string): WeaponDef[] => {
  return SHIP_WEAPONS[shipType] || SHIP_WEAPONS.destroyer;
};
