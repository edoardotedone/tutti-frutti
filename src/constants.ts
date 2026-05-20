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
    { level: 0, radius: 15, color: '#e6193e', name: 'Cherry', score: 2, icon: '🍒', url: 'assets/fruit_0.png' },
    { level: 1, radius: 18, color: '#ff4444', name: 'Strawberry', score: 4, icon: '🍓', url: 'assets/fruit_1.png' },
    { level: 2, radius: 22, color: '#ff69b4', name: 'Grape', score: 6, icon: '🍇', url: 'assets/fruit_2.png' },
    { level: 3, radius: 27, color: '#ff8c00', name: 'Dekopon', score: 10, icon: '🍊', url: 'assets/fruit_3.png' },
    { level: 4, radius: 33, color: '#ffa500', name: 'Orange', score: 15, icon: '🍊', url: 'assets/fruit_4.png' },
    { level: 5, radius: 40, color: '#ffd700', name: 'Apple', score: 21, icon: '🍎', url: 'assets/fruit_5.png' },
    { level: 6, radius: 49, color: '#b5e61d', name: 'Pear', score: 28, icon: '🍐', url: 'assets/fruit_6.png' },
    { level: 7, radius: 60, color: '#4caf50', name: 'Peach', score: 36, icon: '🍑', url: 'assets/fruit_7.png' },
    { level: 8, radius: 74, color: '#00bcd4', name: 'Pineapple', score: 45, icon: '🍍', url: 'assets/fruit_8.png' },
    { level: 9, radius: 91, color: '#2196f3', name: 'Melon', score: 55, icon: '🍈', url: 'assets/fruit_9.png' },
    { level: 10, radius: 111, color: '#9c27b0', name: 'Watermelon', score: 66, icon: '🍉', url: 'assets/fruit_10.png' },
    { level: 11, radius: 136, color: '#d4af37', name: 'King Suika', score: 100, icon: '👑', url: 'assets/fruit_11.png' },
];
