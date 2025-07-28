import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

// Puoi aggiungere un font personalizzato se vuoi uno stile anime
// registerFont(path.resolve(__dirname, "../assets/yourfont.ttf"), { family: "AnimeFont" });

export async function combineImages(cards: { imageUrl: string; name: string; anime: string; id: number }[], width = 230, height = 360) {
  const marginX = 50;
  const marginY = 40;
  const cardCount = cards.length;
  const canvasWidth = cardCount * width + (cardCount + 1) * marginX;
  const canvasHeight = height + 2 * marginY;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Carica la cornice
  const framePath = path.resolve(__dirname, "../assets/frame.png");
  const frame = await loadImage(framePath);

  ctx.textAlign = "center";
  ctx.fillStyle = "#222";

  for (let i = 0; i < cardCount; i++) {
    const card = cards[i];
    if (!card) continue;
    const { imageUrl, name, anime, id } = card;
    const img = await loadImage(imageUrl);
    const x = marginX + i * (width + marginX);
    const y = marginY;

    // Calcola il resize mantenendo le proporzioni
    const ratio = Math.min(width / img.width, height / img.height);
    const drawWidth = img.width * ratio;
    const drawHeight = img.height * ratio;
    const offsetX = x + (width - drawWidth) / 2;
    const offsetY = y + (height - drawHeight) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.drawImage(frame, x, y, width, height);

    // Nome centrato nella parte bianca in alto
    ctx.font = "bold 22px Arial";
    ctx.fillText(name, x + width / 2, y + 60);
    // Anime centrato nella parte bianca in basso
    ctx.font = "bold 20px Arial";
    ctx.fillText(anime, x + width / 2, y + height - 50);

    // ID carta in basso a destra nel rettangolo
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#222";
    // Posiziona l'id più in alto e più a sinistra per stare dentro il rettangolo
    ctx.fillText(`${id}`, x + width - 28, y + height - 3);
  }

  return canvas.toBuffer();
}
