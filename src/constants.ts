// --- Constants ---
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;
export const GAME_OVER_Y = 120;
export const SPAWN_Y = 60;

export interface FruitLevel {
  level: number;
  radius: number;
  color: string;
  name: string;
  score: number;
  icon: string;
  url: string;
}

export const FRUIT_LEVELS: FruitLevel[] = [
   { level: 0, radius: 15, color: '#ff4d4d', name: 'Cherry', score: 2, icon: '🍒', url: 'assets/fruit_0.png' },
   { level: 1, radius: 22, color: '#ffb3b3', name: 'Strawberry', score: 4, icon: '🍓', url: 'assets/fruit_1.png' },
   { level: 2, radius: 32, color: '#9933ff', name: 'Grape', score: 6, icon: '🍇', url: 'assets/fruit_2.png' },
   { level: 3, radius: 40, color: '#ffcc00', name: 'Dekopon', score: 10, icon: '🍊', url: 'assets/fruit_3.png' },
   { level: 4, radius: 52, color: '#ffa31a', name: 'Orange', score: 15, icon: '🍊', url: 'assets/fruit_4.png' },
   { level: 5, radius: 64, color: '#ff3333', name: 'Apple', score: 21, icon: '🍎', url: 'assets/fruit_5.png' },
   { level: 6, radius: 78, color: '#ffff33', name: 'Pear', score: 28, icon: '🍐', url: 'assets/fruit_6.png' },
   { level: 7, radius: 92, color: '#ff99ff', name: 'Peach', score: 36, icon: '🍑', url: 'assets/fruit_7.png' },
   { level: 8, radius: 105, color: '#99ff33', name: 'Pineapple', score: 45, icon: '🍍', url: 'assets/fruit_8.png' },
   { level: 9, radius: 120, color: '#33cc33', name: 'Melon', score: 55, icon: '🍈', url: 'assets/fruit_9.png' },
   { level: 10, radius: 138, color: '#006600', name: 'Watermelon', score: 66, icon: '🍉', url: 'assets/fruit_10.png' },
   { level: 11, radius: 155, color: '#ff0000', name: 'King Suika', score: 100, icon: '👑', url: 'assets/fruit_11.png' },
];