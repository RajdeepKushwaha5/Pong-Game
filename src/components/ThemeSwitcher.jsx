import React from "react";

const THEMES = [
  { key: "day", label: "Day", emoji: "🌞" },
  { key: "space", label: "Space", emoji: "🚀" },
  { key: "ocean", label: "Ocean", emoji: "🌊" }
];

export default function ThemeSwitcher({ theme, setTheme }) {
  return (
    <div className="theme-switch">
      Theme:&nbsp;
      {THEMES.map((t) => (
        <button
          key={t.key}
          className={`big-btn${theme === t.key ? " active" : ""}`}
          onClick={() => setTheme(t.key)}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  );
}