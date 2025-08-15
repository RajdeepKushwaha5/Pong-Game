import * as tf from "@tensorflow/tfjs";

/**
 * Loads model once and caches it.
 * Place your trained model at: public/models/letter_model/model.json
 */
let model = null;
async function ensureModelLoaded() {
  if (!model) {
    model = await tf.loadLayersModel("/models/letter_model/model.json");
  }
}

export async function recognizeLetter(canvas) {
  await ensureModelLoaded();
  // Preprocess: resize to 28x28 grayscale, match training input
  const tfImg = tf.browser.fromPixels(canvas, 1)
    .resizeNearestNeighbor([28, 28])
    .toFloat()
    .div(255.0)
    .expandDims(0); // [1, 28, 28, 1]
  const prediction = model.predict(tfImg);
  const idx = prediction.argMax(1).dataSync()[0];
  const letter = String.fromCharCode(65 + idx); // 65 = 'A'
  return letter;
}

// For development, if no model is present, you may fallback to a random letter:
// export async function recognizeLetter(canvas) {
//   const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//   return alphabet[Math.floor(Math.random() * alphabet.length)];
// }