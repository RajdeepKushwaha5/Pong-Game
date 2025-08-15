import React from "react";

export default function StickerBook({ unlocked, allLetters, onClose }) {
  return (
    <div className="sticker-modal">
      <div className="sticker-book">
        <h2>Sticker Collection</h2>
        <div className="stickers-grid">
          {allLetters.map((l) => (
            <div key={l} className={`sticker ${unlocked[l] ? "unlocked" : ""}`}>
              {unlocked[l] ? (
                <img
                  src={`/animations/letters/${l.toLowerCase()}.png`}
                  alt={l}
                  width={60}
                  height={60}
                />
              ) : (
                <span className="locked">?</span>
              )}
              <div>{l}</div>
            </div>
          ))}
        </div>
        <button className="big-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}