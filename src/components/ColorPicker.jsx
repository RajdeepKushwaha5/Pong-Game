import React from "react";

export default function ColorPicker({ color, setColor }) {
  const colors = ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#9b59b6"];
  return (
    <div className="color-picker">
      Brush Color:&nbsp;
      {colors.map((c) => (
        <button
          key={c}
          style={{
            background: c,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: color === c ? "3px solid #fff" : "none",
            margin: 6,
            boxShadow: "0 2px 10px #bbb"
          }}
          onClick={() => setColor(c)}
        />
      ))}
    </div>
  );
}