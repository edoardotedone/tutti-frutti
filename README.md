# Tutti Frutti 🍒

**Tutti Frutti** is a physics-based puzzle game inspired by the "Suika Game" mechanics. Players drop various fruits into a container, aiming to merge identical fruits to evolve them into larger, more valuable ones. The ultimate goal is to achieve the highest score possible without letting the fruit stack overflow the top line.

## 🎮 Gameplay

- **Drop & Merge:** Drop fruits from the top of the screen. When two fruits of the same level touch, they merge into a single fruit of the next level.
- **Evolution:** Fruits evolve through several stages, starting from small cherries and progressing up to the legendary **King Suika**.
- **Score:** Earn points with every successful merge. Your best score is saved locally in your browser.
- **Game Over:** If any fruit stays above the red danger line for too long, the game ends.

## ✨ Features

- **Realistic Physics:** Powered by [Matter.js](https://brm.io/matter-js/) to provide satisfying and predictable fruit collisions and stacking behavior.
- **Generative Audio:** High-performance, procedural sound effects (merges and collisions) implemented using the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), ensuring a dynamic auditory experience without heavy audio assets.
- **Responsive Design:** Optimized for both desktop (mouse) and mobile (touch) interactions.
- **Visual Polish:** Smooth animations, color-matched outlines, and a clean UI built with Tailwind CSS.

## 🛠️ Tech Stack

- **Framework:** [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Physics Engine:** [Matter.js](https://brm.io/matter-js/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Icons & UI:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn]

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd tutti-frutti
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🕹️ Controls

- **Desktop:** Move your mouse horizontally to position the fruit, then click to drop.
- **Mobile:** Drag your finger horizontally to position the fruit, then tap to drop.
