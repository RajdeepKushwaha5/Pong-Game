import React, { useEffect } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import { Howl } from "howler";

// Map letters to { animation, label, sfx, voice }
const MAP = {
  A: { label: "Apple", anim: "apple.json", sfx: "apple.mp3", voice: "A.mp3" },
  B: { label: "Ball", anim: "ball.json", sfx: "ball.mp3", voice: "B.mp3" },
  C: { label: "Cat", anim: "cat.json", sfx: "cat.mp3", voice: "C.mp3" },
  // ...continue for all 26 letters
  // Place all asset files in public/animations/letters/, public/audio/letter_voices/, public/audio/sfx/
};

export default function AnimatedCharacter({ letter, onAnimationEnd }) {
  useEffect(() => {
    if (!letter || !MAP[letter]) return;

    // Play voice then SFX
    const voice = new Howl({ src: [`/audio/letter_voices/${MAP[letter].voice}`] });
    const sfx = new Howl({ src: [`/audio/sfx/${MAP[letter].sfx}`] });

    voice.play();
    setTimeout(() => sfx.play(), 1200);

    const timer = setTimeout(() => onAnimationEnd && onAnimationEnd(), 2600);
    return () => clearTimeout(timer);
  }, [letter]);

  if (!letter || !MAP[letter]) return null;

  return (
    <div className="anim-char">
      <Player
        autoplay
        keepLastFrame
        src={`/animations/letters/${MAP[letter].anim}`}
        style={{ height: "200px", width: "200px" }}
      />
      <h2>{letter} for {MAP[letter].label}</h2>
    </div>
  );
}