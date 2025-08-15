import React, { useEffect } from "react";
import confetti from "canvas-confetti";

export default function RewardConfetti({ trigger }) {
  useEffect(() => {
    if (trigger) confetti({ particleCount: 120, spread: 80 });
  }, [trigger]);
  if (!trigger) return null;
  return (
    <div className="reward-message">
      🎉 Great Job! 🎉
    </div>
  );
}