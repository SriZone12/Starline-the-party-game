export interface Player {
  id: string;
  name: string;
  color: string;
  glowColor: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface GameNode {
  id: number; // 1, 2, 3, ... N
  x: number;  // normalized [0, 1] for responsive canvas scaling
  y: number;  // normalized [0, 1]
  radius: number; // visual radius in pixels
}

export interface DrawnStroke {
  id: string;
  fromNode: number;
  toNode: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  points: Point[]; // normalized or pixel coordinates
  hadIntersection: boolean;
  intersectionPoint?: Point;
  dareText?: string;
  timestamp: number;
}

export type DareCategory = 'party' | 'physical' | 'social' | 'custom';

export interface DareItem {
  id: string;
  category: DareCategory;
  text: string;
  isCustom?: boolean;
}

export type GameStateMode = 'LOBBY' | 'PLAYING' | 'DARE_POPUP' | 'COMPLETED' | 'PAUSED';

export interface GameSettings {
  nodeCount: number;
  nodeSize: 'small' | 'medium' | 'large';
  enabledCategories: {
    party: boolean;
    physical: boolean;
    social: boolean;
    custom: boolean;
  };
  customDares: DareItem[];
  allowDareSwap: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}
