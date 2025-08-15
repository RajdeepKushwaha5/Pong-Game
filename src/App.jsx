import React, { useState } from "react";
import DrawingCanvas from "./components/DrawingCanvas";
import { recognizeLetter } from "./components/LetterRecognition";
import AnimatedCharacter from "./components/AnimatedCharacter";
import RewardConfetti from "./components/RewardConfetti";
import ColorPicker from "./components/ColorPicker";
import ThemeSwitcher from "./components/ThemeSwitcher";
import StickerBook from "./components/StickerBook";

const ALL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function App() {
  const [color, setColor] = useState("#e74c3c");
  const [theme, setTheme] = useState("day");
  const [recognizedLetter, setRecognizedLetter] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stickers, setStickers] = useState(
    JSON.parse(localStorage.getItem("stickers") || "{}")
  );
  const [showStickerBook, setShowStickerBook] = useState(false);

  async function handleDrawEnd(canvas) {
    const letter = await recognizeLetter(canvas);
    setRecognizedLetter(letter);
    setShowConfetti(true);

    // Unlock sticker
    if (letter && !stickers[letter]) {
      const newStickers = { ...stickers, [letter]: true };
      setStickers(newStickers);
      localStorage.setItem("stickers", JSON.stringify(newStickers));
    }

    setTimeout(() => setShowConfetti(false), 2000);
  }

  function handleAnimationEnd() {
    setRecognizedLetter(null);
  }

  return (
    <div className={`main-bg theme-${theme}`}>
      <header>
        <h1 className="game-title">Alphabet Drawing Game</h1>
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
        <button className="big-btn" onClick={() => setShowStickerBook(true)}>
          🏆 Sticker Book
        </button>
      </header>
      <ColorPicker color={color} setColor={setColor} />
      <DrawingCanvas onDrawEnd={handleDrawEnd} color={color} />
      <AnimatedCharacter letter={recognizedLetter} onAnimationEnd={handleAnimationEnd} />
      <RewardConfetti trigger={showConfetti} />
      {showStickerBook && (
        <StickerBook
          unlocked={stickers}
          allLetters={ALL_LETTERS}
          onClose={() => setShowStickerBook(false)}
        />
      )}
    </div>
  );
}