export interface Move {
  id: number;
  name: string;
  shortName: string;
}

export const UnknownMove: Move = {
  id: -1,
  name: "Unknown Move",
  shortName: "unknown",
};

const moves: { [id: number]: Move } = {
  0: {
    // This includes Grab, Grab Release, DK Cargo Grab, DK Cargo Grab Release, Barrel Cannon, and various Stage Hazards
    id: 0,
    name: "Grab",
    shortName: "grab",
  },
  1: {
    // This includes all thrown items, zair, luigi's taunt, samus bombs, etc
    id: 1,
    name: "Miscellaneous",
    shortName: "misc",
  },
  2: {
    id: 2,
    name: "Jab",
    shortName: "jab",
  },
  3: {
    id: 3,
    name: "Jab",
    shortName: "jab",
  },
  4: {
    id: 4,
    name: "Jab",
    shortName: "jab",
  },
  5: {
    id: 5,
    name: "Rapid Jabs",
    shortName: "rapid-jabs",
  },
  6: {
    id: 6,
    name: "Dash Attack",
    shortName: "dash",
  },
  7: {
    id: 7,
    name: "Forward Tilt",
    shortName: "ftilt",
  },
  8: {
    id: 8,
    name: "Up Tilt",
    shortName: "utilt",
  },
  9: {
    id: 9,
    name: "Down Tilt",
    shortName: "dtilt",
  },
  10: {
    id: 10,
    name: "Forward Smash",
    shortName: "fsmash",
  },
  11: {
    id: 11,
    name: "Up Smash",
    shortName: "usmash",
  },
  12: {
    id: 12,
    name: "Down Smash",
    shortName: "dsmash",
  },
  13: {
    id: 13,
    name: "Neutral Air",
    shortName: "nair",
  },
  14: {
    id: 14,
    name: "Forward Air",
    shortName: "fair",
  },
  15: {
    id: 15,
    name: "Back Air",
    shortName: "bair",
  },
  16: {
    id: 16,
    name: "Up Air",
    shortName: "uair",
  },
  17: {
    id: 17,
    name: "Down Air",
    shortName: "dair",
  },
  18: {
    id: 18,
    name: "Neutral B",
    shortName: "neutral-b",
  },
  19: {
    id: 19,
    name: "Side B",
    shortName: "side-b",
  },
  20: {
    id: 20,
    name: "Up B",
    shortName: "up-b",
  },
  21: {
    id: 21,
    name: "Down B",
    shortName: "down-b",
  },
  50: {
    id: 50,
    name: "Getup Attack",
    shortName: "getup",
  },
  51: {
    id: 51,
    name: "Getup Attack (Slow)",
    shortName: "getup-slow",
  },
  52: {
    id: 52,
    name: "Grab Pummel",
    shortName: "pummel",
  },
  53: {
    id: 53,
    name: "Forward Throw",
    shortName: "fthrow",
  },
  54: {
    id: 54,
    name: "Back Throw",
    shortName: "bthrow",
  },
  55: {
    id: 55,
    name: "Up Throw",
    shortName: "uthrow",
  },
  56: {
    id: 56,
    name: "Down Throw",
    shortName: "dthrow",
  },
  61: {
    id: 61,
    name: "Edge Attack (Slow)",
    shortName: "edge-slow",
  },
  62: {
    id: 62,
    name: "Edge Attack",
    shortName: "edge",
  },
  63: {
    id: 63,
    name: "Beam Sword Jab",
    shortName: "beamsword-jab",
  },
  64: {
    id: 64,
    name: "Beam Sword Tilt Attack",
    shortName: "beamsword-tilt",
  },
  65: {
    id: 65,
    name: "Beam Sword Smash Attack",
    shortName: "beamsword-smash",
  },
  66: {
    id: 66,
    name: "Beam Sword Dash Attack",
    shortName: "beamsword-dash",
  },
  67: {
    id: 67,
    name: "Home Run Bat Jab",
    shortName: "homerun-jab",
  },
  68: {
    id: 68,
    name: "Home Run Bat Tilt Attack",
    shortName: "homerun-tilt",
  },
  69: {
    id: 69,
    name: "Home Run Bat Smash Attack",
    shortName: "homerun-smash",
  },
  70: {
    id: 70,
    name: "Home Run Bat Dash Attack",
    shortName: "homerun-dash",
  },
  71: {
    id: 71,
    name: "Parasol Jab",
    shortName: "parasol-jab",
  },
  72: {
    id: 72,
    name: "Parasol Tilt Attack",
    shortName: "parasol-tilt",
  },
  73: {
    id: 73,
    name: "Parasol Smash Attack",
    shortName: "parasol-smash",
  },
  74: {
    id: 74,
    name: "Parasol Dash Attack",
    shortName: "parasol-dash",
  },
  75: {
    id: 75,
    name: "Fan Jab",
    shortName: "fan-jab",
  },
  76: {
    id: 76,
    name: "Fan Tilt Attack",
    shortName: "fan-tilt",
  },
  77: {
    id: 77,
    name: "Fan Smash Attack",
    shortName: "fan-smash",
  },
  78: {
    id: 78,
    name: "Fan Dash Attack",
    shortName: "fan-dash",
  },
  79: {
    id: 79,
    name: "Star Rod Jab",
    shortName: "starrod-jab",
  },
  80: {
    id: 80,
    name: "Star Rod Tilt Attack",
    shortName: "starrod-tilt",
  },
  81: {
    id: 81,
    name: "Star Rod Smash Attack",
    shortName: "starrod-smash",
  },
  82: {
    id: 82,
    name: "Star Rod Dash Attack",
    shortName: "starrod-dash",
  },
  83: {
    id: 83,
    name: "Lip's Stick Jab",
    shortName: "lipsstick-jab",
  },
  84: {
    id: 84,
    name: "Lip's Stick Tilt Attack",
    shortName: "lipsstick-tilt",
  },
  85: {
    id: 85,
    name: "Lip's Stick Smash Attack",
    shortName: "lipsstick-smash",
  },
  86: {
    id: 86,
    name: "Lip's Stick Dash Attack",
    shortName: "lipsstick-dash",
  },
  87: {
    id: 87,
    name: "Open Parasol",
    shortName: "open-parasol",
  },
  88: {
    id: 88,
    name: "Ray Gun Shoot",
    shortName: "raygun-shoot",
  },
  89: {
    id: 89,
    name: "Fire Flower Shoot",
    shortName: "fireflower-shoot",
  },
  90: {
    id: 90,
    name: "Screw Attack",
    shortName: "screw-attack",
  },
  91: {
    id: 91,
    name: "Super Scope (Rapid)",
    shortName: "super-scope-rapid",
  },
  92: {
    id: 92,
    name: "Super Scope (Charged)",
    shortName: "super-scope-charged",
  },
  93: {
    id: 93,
    name: "Hammer",
    shortName: "hammer",
  },
};

export function getMoveInfo(moveId: number): Move {
  const m = moves[moveId];
  if (!m) {
    return UnknownMove;
  }
  return m;
}

export function getMoveShortName(moveId: number): string {
  const move = getMoveInfo(moveId);
  return move.shortName;
}

export function getMoveName(moveId: number): string {
  const move = getMoveInfo(moveId);
  return move.name;
}
